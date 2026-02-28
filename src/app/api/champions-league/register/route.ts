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
      card_number,
      card_exp_month,
      card_exp_year,
      card_cvc,
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

    // Validate card data
    if (!card_number || !card_exp_month || !card_exp_year || !card_cvc) {
      return NextResponse.json(
        { error: "Card details are required" },
        { status: 400 }
      );
    }

    // Create PaymentMethod from card data
    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        number: card_number,
        exp_month: parseInt(card_exp_month, 10),
        exp_year: 2000 + parseInt(card_exp_year, 10),
        cvc: card_cvc,
      },
      billing_details: {
        name: `${first_name.trim()} ${last_name.trim()}`,
        email: email.trim(),
        phone: phone.trim(),
      },
    });

    // Create PaymentIntent - fixed €15
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1500, // €15.00
      currency: "eur",
      payment_method: paymentMethod.id,
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
