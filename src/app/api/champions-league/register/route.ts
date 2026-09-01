import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { plRegistrationLimiter } from "@/lib/rate-limiter";

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

    const {
      first_name,
      last_name,
      email,
      phone,
      notes,
      payment_method_id,
      recaptcha_token,
    } = await req.json();

    if (!(await verifyRecaptcha(recaptcha_token))) {
      return NextResponse.json(
        { error: "reCAPTCHA verifikacija neuspješna" },
        { status: 400 }
      );
    }

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
