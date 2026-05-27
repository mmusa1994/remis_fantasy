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

export async function POST(request: NextRequest) {
  try {
    const { payment_intent_id } = await request.json();

    if (!payment_intent_id) {
      return NextResponse.json(
        { success: false, error: "payment_intent_id is required" },
        { status: 400 }
      );
    }

    // Verify the PaymentIntent with Stripe (source of truth)
    const pi = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (pi.status !== "succeeded") {
      return NextResponse.json(
        { success: false, error: `PaymentIntent not succeeded (${pi.status})` },
        { status: 400 }
      );
    }

    if (pi.metadata?.type !== "wc2026_registration") {
      return NextResponse.json(
        { success: false, error: "PaymentIntent is not a WC2026 registration" },
        { status: 400 }
      );
    }

    const registrationId = pi.metadata.registration_id;
    if (!registrationId) {
      return NextResponse.json(
        { success: false, error: "registration_id missing in PaymentIntent metadata" },
        { status: 400 }
      );
    }

    // Mark as paid + fetch row
    const { data: reg, error: updateErr } = await supabase
      .from("wc2026_registrations")
      .update({
        payment_status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", registrationId)
      .select(
        "id, first_name, last_name, email, phone, team_name, codes_email_sent, notes"
      )
      .maybeSingle();

    if (updateErr || !reg) {
      console.error("WC2026 confirm: update/select failed", updateErr);
      return NextResponse.json(
        { success: false, error: updateErr?.message || "Registration not found" },
        { status: 500 }
      );
    }

    // Send welcome email (idempotent via codes_email_sent)
    if (!reg.codes_email_sent) {
      try {
        await sendWC2026WelcomeEmail({
          first_name: reg.first_name,
          last_name: reg.last_name,
          email: reg.email,
          team_name: reg.team_name || "",
          payment_method: "card",
        });
        await supabase
          .from("wc2026_registrations")
          .update({
            codes_email_sent: true,
            codes_email_sent_at: new Date().toISOString(),
          })
          .eq("id", reg.id);
      } catch (emailErr) {
        console.error("WC2026 confirm: welcome email failed", emailErr);
      }

      sendAdminRegistrationNotification({
        competition: "WC2026",
        first_name: reg.first_name,
        last_name: reg.last_name,
        email: reg.email,
        phone: reg.phone,
        payment_method: "Stripe (kartica)",
        amount: "5.00€",
        notes: reg.notes || undefined,
      });
    }

    return NextResponse.json({ success: true, emailSent: !reg.codes_email_sent });
  } catch (error) {
    console.error("WC2026 confirm error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
