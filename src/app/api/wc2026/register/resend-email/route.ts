import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWC2026WelcomeEmail } from "@/lib/email";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Registration ID is required" },
        { status: 400 }
      );
    }

    const { data: reg, error: fetchError } = await supabase
      .from("wc2026_registrations")
      .select("id, first_name, last_name, email, team_name, payment_method")
      .eq("id", id)
      .single();

    if (fetchError || !reg) {
      return NextResponse.json(
        { success: false, error: "Registration not found" },
        { status: 404 }
      );
    }

    await sendWC2026WelcomeEmail({
      first_name: reg.first_name,
      last_name: reg.last_name,
      email: reg.email,
      team_name: reg.team_name || "",
      payment_method: reg.payment_method === "card" ? "card" : "cash",
    });

    await supabase
      .from("wc2026_registrations")
      .update({
        codes_email_sent: true,
        codes_email_sent_at: new Date().toISOString(),
      })
      .eq("id", id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("WC2026 resend email error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
