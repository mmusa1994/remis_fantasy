import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";
import {
  sendWC2026WelcomeEmail,
  sendAdminRegistrationNotification,
} from "@/lib/email";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("wc2026_registrations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("WC2026 registrations GET API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      first_name,
      last_name,
      email,
      phone,
      team_name,
      payment_method,
      payment_method_id,
      notes,
    } = body;

    // Validate required fields
    if (
      !first_name?.trim() ||
      !last_name?.trim() ||
      !email?.trim() ||
      !phone?.trim() ||
      !team_name?.trim() ||
      !payment_method?.trim()
    ) {
      return NextResponse.json(
        { success: false, error: "All required fields must be filled" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existing, error: lookupError } = await supabase
      .from("wc2026_registrations")
      .select("id")
      .eq("email", email.trim())
      .maybeSingle();

    if (lookupError) {
      console.error("Supabase lookup error:", lookupError);
      return NextResponse.json(
        { success: false, error: lookupError.message },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { success: false, error: "This email is already registered" },
        { status: 409 }
      );
    }

    // ── Cash flow: just insert registration ──
    if (payment_method === "cash") {
      const { data, error } = await supabase
        .from("wc2026_registrations")
        .insert({
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          team_name: team_name.trim(),
          payment_method: "cash",
          notes: (notes || "").trim(),
          payment_status: "pending",
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase insert error:", error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      // Fire welcome email + admin notification (best-effort, don't block flow)
      try {
        await sendWC2026WelcomeEmail({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          team_name: data.team_name || "",
          payment_method: "cash",
        });
        await supabase
          .from("wc2026_registrations")
          .update({
            codes_email_sent: true,
            codes_email_sent_at: new Date().toISOString(),
          })
          .eq("id", data.id);
      } catch (emailErr) {
        console.error("WC2026 welcome email (cash) failed:", emailErr);
      }

      sendAdminRegistrationNotification({
        competition: "WC2026",
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        payment_method: "Keš",
        amount: "5.00€",
        notes: data.notes || undefined,
      });

      return NextResponse.json({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      });
    }

    // ── Card flow: create PaymentIntent, return clientSecret ──
    if (!payment_method_id) {
      return NextResponse.json(
        { success: false, error: "Missing payment_method_id for card payment" },
        { status: 400 }
      );
    }

    // Insert registration first
    const { data: regData, error: regError } = await supabase
      .from("wc2026_registrations")
      .insert({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        team_name: team_name.trim(),
        payment_method: "card",
        notes: (notes || "").trim(),
        payment_status: "pending",
      })
      .select()
      .single();

    if (regError) {
      console.error("Supabase insert error:", regError);
      return NextResponse.json(
        { success: false, error: regError.message },
        { status: 500 }
      );
    }

    // Create PaymentIntent for 5.00 EUR (500 cents)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 500,
      currency: "eur",
      payment_method: payment_method_id,
      metadata: {
        type: "wc2026_registration",
        registration_id: regData.id,
        product: "wc2026_fantasy",
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        team_name: team_name.trim(),
        notes: (notes || "").trim(),
        customer_name: `${first_name.trim()} ${last_name.trim()}`,
        customer_email: email.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      data: regData,
      clientSecret: paymentIntent.client_secret,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("WC2026 registration POST API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Registration ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("wc2026_registrations")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("WC2026 registration DELETE API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
