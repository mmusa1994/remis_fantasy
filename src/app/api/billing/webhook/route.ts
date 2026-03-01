import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseServer } from "@/lib/supabase-server";
import Stripe from "stripe";
import * as nodemailer from "nodemailer";
import { getF1CodesEmailHtml } from "@/app/api/send-f1-email/route";
import { sendAdminRegistrationNotification } from "@/lib/email";

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

          const { data: insertedRow, error: f1Error } = await supabaseServer
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
            })
            .select("id")
            .single();

          if (f1Error) {
            console.error("Error inserting F1 registration:", f1Error);
          } else {
            console.log(`F1 registration completed for ${email}`);

            // Send admin notification
            sendAdminRegistrationNotification({
              competition: "F1",
              first_name,
              last_name,
              email,
              phone,
              payment_method: "Stripe (kartica)",
              amount: "10.00€",
              notes: notes || undefined,
            });

            // Auto-send F1 codes email
            try {
              const smtpUser = process.env.SMTP_USER;
              const smtpPass = process.env.SMTP_PASS;

              if (smtpUser && smtpPass) {
                const transporter = nodemailer.createTransport({
                  service: "gmail",
                  auth: { user: smtpUser, pass: smtpPass },
                });

                await transporter.sendMail({
                  from: process.env.SMTP_FROM || smtpUser,
                  to: email,
                  subject:
                    "F1 Fantasy League 2026 - Kod za pristup | REMIS Fantasy",
                  html: getF1CodesEmailHtml(first_name),
                });

                // Update codes_email_sent flag
                if (insertedRow?.id) {
                  await supabaseServer
                    .from("f1_registrations_25_26")
                    .update({
                      codes_email_sent: true,
                      codes_email_sent_at: new Date().toISOString(),
                    })
                    .eq("id", insertedRow.id);
                }

                console.log(`F1 codes email sent automatically to ${email}`);
              } else {
                console.warn(
                  "Email credentials not configured, skipping auto-send"
                );
              }
            } catch (emailError) {
              console.error("Failed to auto-send F1 codes email:", emailError);
            }
          }
        }

        if (paymentIntent.metadata?.type === "cl_registration_26_27") {
          const { first_name, last_name, email, phone, notes } =
            paymentIntent.metadata;

          const { error: clError } = await supabaseServer
            .from("registration_champions_league_26_27")
            .insert({
              first_name,
              last_name,
              email,
              phone,
              notes: notes || null,
              payment_method: "stripe",
              payment_status: "paid",
              stripe_payment_intent_id: paymentIntent.id,
              amount_paid: 15.0,
            });

          if (clError) {
            console.error("Error inserting CL registration:", clError);
          } else {
            console.log(`CL registration completed for ${email}`);
            sendAdminRegistrationNotification({
              competition: "Champions League",
              first_name,
              last_name,
              email,
              phone,
              payment_method: "Stripe (kartica)",
              amount: "15.00€",
              notes: notes || undefined,
            });
          }
        }

        if (paymentIntent.metadata?.type === "pl_registration_26_27") {
          const { first_name, last_name, email, phone, notes, league_tier } =
            paymentIntent.metadata;

          const tierAmounts: Record<string, number> = {
            standard: 20.0,
            premium: 50.0,
            h2h_only: 15.0,
            standard_h2h: 35.0,
            premium_h2h: 65.0,
          };
          const amount = tierAmounts[league_tier] || 0;

          const { error: plError } = await supabaseServer
            .from("registration_premier_league_26_27")
            .insert({
              first_name,
              last_name,
              email,
              phone,
              notes: notes || null,
              payment_method: "stripe",
              payment_status: "paid",
              league_tier,
              stripe_payment_intent_id: paymentIntent.id,
              amount_paid: amount,
            });

          if (plError) {
            console.error("Error inserting PL registration:", plError);
          } else {
            console.log(`PL registration completed for ${email}`);
            sendAdminRegistrationNotification({
              competition: "Premier League",
              first_name,
              last_name,
              email,
              phone,
              payment_method: "Stripe (kartica)",
              amount: `${amount.toFixed(2)}€`,
              league_tier,
              notes: notes || undefined,
            });
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
