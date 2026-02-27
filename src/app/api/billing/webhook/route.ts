import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseServer } from "@/lib/supabase-server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Missing signature or webhook secret" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown webhook error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Handle subscription payments
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;

        if (!userId || !planId) {
          console.error("Missing metadata in checkout session:", session.id);
          break;
        }

        // Update or create subscription in Supabase
        const { error: upsertError } = await supabaseServer
          .from("subscriptions")
          .upsert(
            {
              user_id: userId,
              plan_id: planId,
              status: "active",
              stripe_subscription_id: session.subscription as string,
              stripe_customer_id: session.customer as string,
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000
              ).toISOString(),
            },
            { onConflict: "user_id" }
          );

        if (upsertError) {
          console.error("Error updating subscription:", upsertError);
        } else {
          console.log(
            `Subscription activated for user ${userId}, plan ${planId}`
          );
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        if (paymentIntent.metadata?.type === "f1_registration") {
          const { first_name, last_name, email, phone, notes } =
            paymentIntent.metadata;

          const { error: f1Error } = await supabaseServer
            .from("f1_registrations_25_26")
            .insert({
              first_name,
              last_name,
              email,
              phone,
              notes: notes || null,
              payment_status: "paid",
              stripe_payment_intent_id: paymentIntent.id,
              amount_paid: 10.0,
            });

          if (f1Error) {
            console.error("Error inserting F1 registration:", f1Error);
          } else {
            console.log(`F1 registration completed for ${email}`);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const item = subscription.items?.data?.[0];
        const updateData: Record<string, string> = {
          status: subscription.status,
        };
        if (item?.current_period_start) {
          updateData.current_period_start = new Date(
            item.current_period_start * 1000
          ).toISOString();
        }
        if (item?.current_period_end) {
          updateData.current_period_end = new Date(
            item.current_period_end * 1000
          ).toISOString();
        }
        const { error } = await supabaseServer
          .from("subscriptions")
          .update(updateData)
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          console.error("Error updating subscription status:", error);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const { error } = await supabaseServer
          .from("subscriptions")
          .update({ status: "cancelled" })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          console.error("Error cancelling subscription:", error);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
