import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { stripe } from "@/lib/stripe";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { planId } = await req.json();

    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      );
    }

    // Fetch the plan from Supabase to get stripe_price_id
    const { data: plan, error: planError } = await supabaseServer
      .from("subscription_plans")
      .select("id, name, price_eur, stripe_price_id")
      .eq("id", planId)
      .eq("is_active", true)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    // Free plans don't need Stripe checkout
    if (plan.price_eur === 0) {
      return NextResponse.json({
        success: true,
        message: "Free plan activated",
      });
    }

    if (!plan.stripe_price_id) {
      return NextResponse.json(
        { error: "This plan is not yet available for purchase" },
        { status: 400 }
      );
    }

    // Create Stripe Checkout Session
    const origin = req.headers.get("origin") || "https://remis-fantasy.com";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      success_url: `${origin}/billing-plans/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing-plans/cancel`,
      customer_email: session.user.email || undefined,
      metadata: {
        userId: session.user.id,
        planId: plan.id,
      },
    });

    return NextResponse.json({
      success: true,
      url: checkoutSession.url,
    });
  } catch (error: unknown) {
    console.error("Payment API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
