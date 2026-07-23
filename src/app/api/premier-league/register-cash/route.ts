import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  sendAdminRegistrationNotification,
  sendPLRegistrationConfirmationEmail,
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

    const { first_name, last_name, email, phone, notes, cash_delivery_date, league_tier, recaptcha_token } = await req.json();

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

    const validTiers = ["standard", "premium", "h2h_only", "standard_h2h", "premium_h2h"];
    if (!league_tier || !validTiers.includes(league_tier)) {
      return NextResponse.json(
        { error: "Invalid league tier" },
        { status: 400 }
      );
    }

    // Ograničenja dužine — polja idu u bazu i u admin email; notes bez limita
    // bi omogućio multi-megabajtne payloade.
    const cleanFirstName = String(first_name).trim().slice(0, 100);
    const cleanLastName = String(last_name).trim().slice(0, 100);
    const cleanEmail = String(email).trim().slice(0, 255);
    const cleanPhone = String(phone).trim().slice(0, 40);
    const cleanNotes = String(notes || "").trim().slice(0, 1000);
    const cleanDeliveryDate = String(cash_delivery_date).trim().slice(0, 40);

    const { data: insertedRow, error } = await supabase
      .from("registration_premier_league_26_27")
      .insert({
        first_name: cleanFirstName,
        last_name: cleanLastName,
        email: cleanEmail,
        phone: cleanPhone,
        notes: cleanNotes,
        payment_method: "cash",
        payment_status: "pending",
        cash_delivery_date: cleanDeliveryDate,
        league_tier: league_tier,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("PL cash registration error:", error);
      if (error.message?.includes("duplicate") || error.message?.includes("unique")) {
        return NextResponse.json(
          { error: "Email already registered" },
          { status: 409 }
        );
      }
      throw error;
    }

    const tierAmounts: Record<string, number> = {
      standard: 20.0,
      premium: 50.0,
      h2h_only: 15.0,
      standard_h2h: 35.0,
      premium_h2h: 65.0,
    };
    const amount = tierAmounts[league_tier] || 0;

    await sendAdminRegistrationNotification({
      competition: "Premier League",
      first_name: cleanFirstName,
      last_name: cleanLastName,
      email: cleanEmail,
      phone: cleanPhone,
      payment_method: `Cash (dostava: ${cleanDeliveryDate})`,
      amount: `${amount.toFixed(2)}€`,
      league_tier,
      notes: cleanNotes || undefined,
    });

    const emailResult = await sendPLRegistrationConfirmationEmail({
      first_name: cleanFirstName,
      last_name: cleanLastName,
      email: cleanEmail,
      league_tier,
      amount,
      payment_method: "cash",
      cash_delivery_date: cleanDeliveryDate,
    });

    // Zabilježi da je email s kodovima poslan — admin dashboard preko ovog
    // flaga prikazuje status i nudi (ponovno) slanje samo kad treba.
    if (emailResult?.success && insertedRow?.id) {
      const { error: flagError } = await supabase
        .from("registration_premier_league_26_27")
        .update({
          confirmation_email_sent: true,
          confirmation_email_sent_at: new Date().toISOString(),
        })
        .eq("id", insertedRow.id);
      if (flagError) {
        // Email je poslan; flag nije upisan (npr. migracija nije pokrenuta).
        console.error(
          "PL cash: email sent but flag update failed — run db/sql/pl_26_27_email_reliability.sql:",
          flagError
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("PL cash registration API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
