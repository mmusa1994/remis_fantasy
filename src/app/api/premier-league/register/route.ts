import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { stripe } from "@/lib/stripe";
import { supabaseServer } from "@/lib/supabase-server";
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
      league_tier,
      recaptcha_token,
      client_token,
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

    // Validate tier and determine amount
    // standard=€20, premium=€50, h2h_only=€15
    // standard_h2h=€35, premium_h2h=€65
    const tierAmounts: Record<string, number> = {
      standard: 2000,
      premium: 5000,
      h2h_only: 1500,
      standard_h2h: 3500,
      premium_h2h: 6500,
    };

    if (!league_tier || !tierAmounts[league_tier]) {
      return NextResponse.json(
        { error: "Invalid league tier" },
        { status: 400 }
      );
    }

    const amount = tierAmounts[league_tier];

    const cleanFirstName = String(first_name).trim().slice(0, 100);
    const cleanLastName = String(last_name).trim().slice(0, 100);
    const cleanEmail = String(email).trim().slice(0, 255);
    const cleanPhone = String(phone).trim().slice(0, 40);
    const cleanNotes = String(notes || "").trim().slice(0, 450);

    // Guard prije naplate: ako registracija s ovim emailom već postoji (keš
    // ili ranija kartična), NE kreiraj novu naplatu — webhook je ionako ne bi
    // mogao upisati (konflikt "naplaćeno ali neregistrovano").
    const { data: existingRows, error: dupError } = await supabaseServer
      .from("registration_premier_league_26_27")
      .select("id")
      .eq("email", cleanEmail)
      .is("deleted_at", null)
      .limit(1);

    if (dupError) {
      // Fail closed — bez provjere duplikata ne naplaćujemo karticu.
      console.error("PL duplicate check failed:", dupError);
      return NextResponse.json(
        { error: "Provjera registracije trenutno nije moguća. Pokušajte ponovo za par minuta." },
        { status: 503 }
      );
    }

    if (existingRows && existingRows.length > 0) {
      return NextResponse.json(
        { error: "Registracija s ovim emailom već postoji. Ako mislite da je ovo greška, kontaktirajte nas." },
        { status: 409 }
      );
    }

    // Idempotency key: identičan zahtjev (isti client_token + isti podaci +
    // isti PaymentMethod) vraća isti PaymentIntent umjesto nove naplate —
    // štiti od duplog terećenja kod dvostrukog POST-a istog submita.
    // payment_method_id MORA biti u hashu: novi PaymentMethod znači nove
    // parametre, a isti ključ s drugim parametrima Stripe odbija greškom.
    const idempotencyOptions: { idempotencyKey?: string } = {};
    if (typeof client_token === "string" && /^[A-Za-z0-9-]{8,64}$/.test(client_token)) {
      const payloadHash = createHash("sha256")
        .update(
          JSON.stringify([cleanFirstName, cleanLastName, cleanEmail, cleanPhone, cleanNotes, league_tier, payment_method_id])
        )
        .digest("hex")
        .slice(0, 16);
      idempotencyOptions.idempotencyKey = `pl2627-${client_token}-${payloadHash}`;
    }

    // Create PaymentIntent with the client-created PaymentMethod
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount,
        currency: "eur",
        payment_method: payment_method_id,
        metadata: {
          type: "pl_registration_26_27",
          league_tier,
          first_name: cleanFirstName,
          last_name: cleanLastName,
          email: cleanEmail,
          phone: cleanPhone,
          // Stripe rejects metadata values over 500 chars
          notes: cleanNotes,
        },
        description: `Remis Fantasy Premier League 2026/27 - ${league_tier}`,
      },
      idempotencyOptions
    );

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: unknown) {
    console.error("PL registration API error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
