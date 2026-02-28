import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      notes,
      payment_method_id,
    } = await req.json();

    // Validate required fields
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

    // Validate payment method ID (created client-side via Stripe Elements)
    if (!payment_method_id || typeof payment_method_id !== "string" || !payment_method_id.startsWith("pm_")) {
      return NextResponse.json(
        { error: "Valid payment method is required" },
        { status: 400 }
      );
    }

    // Create PaymentIntent with the client-created PaymentMethod
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1500, // €15.00
      currency: "eur",
      payment_method: payment_method_id,
      metadata: {
        type: "cl_registration_26_27",
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        notes: (notes || "").trim(),
      },
      receipt_email: email.trim(),
      description: "Remis Fantasy Champions League 2026/27 - Registration",
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: unknown) {
    console.error("CL registration API error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
