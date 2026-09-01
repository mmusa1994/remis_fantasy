import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  sendAdminRegistrationNotification,
  sendCLRegistrationConfirmationEmail,
} from "@/lib/email";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { plRegistrationLimiter } from "@/lib/rate-limiter";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: NextRequest) {
  try {
    // x-real-ip is set by the platform; a client-supplied x-forwarded-for
    // prefix is spoofable, so fall back to the last (platform-appended) hop.
    const clientIP =
      req.headers.get("x-real-ip") ||
      req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() ||
      "unknown";
    if (!plRegistrationLimiter.isAllowed(clientIP).allowed) {
      return NextResponse.json(
        { error: "Previše pokušaja. Pokušajte ponovo za 15 minuta." },
        { status: 429 }
      );
    }

    const { first_name, last_name, email, phone, notes, cash_delivery_date, recaptcha_token } = await req.json();

    if (!(await verifyRecaptcha(recaptcha_token))) {
      return NextResponse.json(
        { error: "reCAPTCHA verifikacija neuspješna" },
        { status: 400 }
      );
    }

    if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { error: "All required fields must be filled" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    if (!cash_delivery_date) {
      return NextResponse.json(
        { error: "Cash delivery date is required" },
        { status: 400 }
      );
    }

    const { data: insertedRow, error } = await supabase
      .from("registration_champions_league_26_27")
      .insert({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        notes: (notes || "").trim(),
        payment_method: "cash",
        payment_status: "pending",
        cash_delivery_date: cash_delivery_date,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("CL cash registration error:", error);
      if (error.message?.includes("duplicate") || error.message?.includes("unique")) {
        return NextResponse.json(
          { error: "Email already registered" },
          { status: 409 }
        );
      }
      throw error;
    }

    await sendAdminRegistrationNotification({
      competition: "Champions League",
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      payment_method: `Cash (dostava: ${cash_delivery_date})`,
      amount: "15.00€",
      notes: notes?.trim() || undefined,
    });

    const emailResult = await sendCLRegistrationConfirmationEmail({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.trim(),
      amount: 15.0,
      payment_method: "cash",
      cash_delivery_date,
    });

    // Zabilježi da je potvrdni email poslan — flag kolone možda još ne
    // postoje (sql/cl_26_27_email_reliability.sql), pa je upis best-effort.
    if (emailResult?.success && insertedRow?.id) {
      const { error: flagError } = await supabase
        .from("registration_champions_league_26_27")
        .update({
          confirmation_email_sent: true,
          confirmation_email_sent_at: new Date().toISOString(),
        })
        .eq("id", insertedRow.id);
      if (flagError) {
        console.error(
          "CL cash: email sent but flag update failed — run sql/cl_26_27_email_reliability.sql:",
          flagError
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("CL cash registration API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
