import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendAdminRegistrationNotification } from "@/lib/email";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: NextRequest) {
  try {
    const { first_name, last_name, email, phone, notes, cash_delivery_date } = await req.json();

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

    const { error } = await supabase
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
      });

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

    sendAdminRegistrationNotification({
      competition: "Champions League",
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      payment_method: `Cash (dostava: ${cash_delivery_date})`,
      amount: "15.00€",
      notes: notes?.trim() || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("CL cash registration API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
