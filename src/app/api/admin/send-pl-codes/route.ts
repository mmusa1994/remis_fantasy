import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { supabaseServer } from "@/lib/supabase-server";
import { sendPLRegistrationConfirmationEmail } from "@/lib/email";

// Admin akcija: (ponovno) slanje potvrdnog emaila s FPL kodovima za sezonu
// 26/27. Sezona 25/26 i dalje ide kroz /api/send-email — ova ruta radi
// isključivo nad registration_premier_league_26_27 i league_tier modelom.

const TIER_AMOUNTS: Record<string, number> = {
  standard: 20.0,
  premium: 50.0,
  h2h_only: 15.0,
  standard_h2h: 35.0,
  premium_h2h: 65.0,
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const registrationId = String(body?.registrationId || "");
    if (!registrationId) {
      return NextResponse.json(
        { error: "registrationId is required" },
        { status: 400 }
      );
    }

    const { data: reg, error } = await supabaseServer
      .from("registration_premier_league_26_27")
      .select("*")
      .eq("id", registrationId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      console.error("send-pl-codes lookup failed:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
    if (!reg) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const amountPaid = Number(reg.amount_paid);
    const amount =
      Number.isFinite(amountPaid) && amountPaid > 0
        ? amountPaid
        : TIER_AMOUNTS[reg.league_tier as string] ?? 0;

    const result = await sendPLRegistrationConfirmationEmail({
      first_name: reg.first_name,
      last_name: reg.last_name,
      email: reg.email,
      league_tier: reg.league_tier,
      amount,
      payment_method: reg.payment_method === "cash" ? "cash" : "card",
      cash_delivery_date: reg.cash_delivery_date || undefined,
    });

    if (!result?.success) {
      return NextResponse.json(
        { error: "Slanje emaila nije uspjelo. Pokušajte ponovo." },
        { status: 502 }
      );
    }

    const sentAt = new Date().toISOString();
    const { error: flagError } = await supabaseServer
      .from("registration_premier_league_26_27")
      .update({
        confirmation_email_sent: true,
        confirmation_email_sent_at: sentAt,
      })
      .eq("id", registrationId);

    if (flagError) {
      // Email je poslan; flag nije upisan (npr. SQL migracija nije pokrenuta).
      console.error(
        "send-pl-codes: email sent but flag update failed — run db/sql/pl_26_27_email_reliability.sql:",
        flagError
      );
    }

    return NextResponse.json({
      success: true,
      registration: {
        ...reg,
        confirmation_email_sent: true,
        confirmation_email_sent_at: sentAt,
        codes_email_sent: true,
        codes_email_sent_at: sentAt,
      },
    });
  } catch (error) {
    console.error("send-pl-codes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
