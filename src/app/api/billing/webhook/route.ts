import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseServer } from "@/lib/supabase-server";
import Stripe from "stripe";
import * as nodemailer from "nodemailer";
import { getF1CodesEmailHtml } from "@/app/api/send-f1-email/route";
import { sendAdminRegistrationNotification } from "@/lib/email";
import { getTemplate } from "@/data/predictor-templates";
import { seedTournamentFromTemplate } from "@/lib/predictor-seed";

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

        if (
          paymentIntent.metadata?.type === "tournament_creation" ||
          paymentIntent.metadata?.type === "tournament_creation_2eur"
        ) {
          const {
            user_id,
            tournament_name,
            tournament_slug,
            short_description,
            accent_color,
            template_id,
          } = paymentIntent.metadata;
          const tmpl = template_id ? getTemplate(template_id) : null;

          if (!user_id || !tournament_name) {
            console.error("tournament_creation missing metadata", paymentIntent.id);
          } else {
            const safeSlug = (tournament_slug || tournament_name)
              .toLowerCase()
              .normalize("NFD")
              .replace(/[̀-ͯ]/g, "")
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "")
              .slice(0, 80);

            // Idempotency: skip if a tournament with this PaymentIntent already exists
            const { data: existing } = await supabaseServer
              .from("predictor_tournaments")
              .select("id")
              .eq("stripe_payment_intent_id", paymentIntent.id)
              .maybeSingle();

            if (!existing) {
              // Ensure unique slug by suffixing if taken
              let finalSlug = safeSlug;
              const { data: slugTaken } = await supabaseServer
                .from("predictor_tournaments")
                .select("id")
                .eq("slug", finalSlug)
                .maybeSingle();
              if (slugTaken) {
                finalSlug = `${safeSlug}-${paymentIntent.id.slice(-6).toLowerCase()}`;
              }

              const { data: created, error: createErr } = await supabaseServer
                .from("predictor_tournaments")
                .insert({
                  slug: finalSlug,
                  name: tournament_name,
                  short_description: short_description || tmpl?.short_description || null,
                  long_description: tmpl?.long_description ?? null,
                  logo_url: tmpl?.logo_url ?? null,
                  banner_image_url: tmpl?.banner_image_url ?? null,
                  hero_image_url: tmpl?.hero_image_url ?? null,
                  rules_md: tmpl?.rules_md ?? null,
                  point_system_md: tmpl?.point_system_md ?? null,
                  eligibility_md: tmpl?.eligibility_md ?? null,
                  prize_pool_amount: tmpl?.prize_pool_amount ?? null,
                  prize_pool_currency: tmpl?.prize_pool_currency ?? "EUR",
                  status: "draft",
                  visibility: "public",
                  accent_color: accent_color || "amber",
                  owner_user_id: user_id,
                  created_via: "user_paid",
                  stripe_payment_intent_id: paymentIntent.id,
                  amount_paid: 2.0,
                })
                .select("id, slug")
                .single();

              if (createErr) {
                console.error("Error creating public tournament:", createErr);
              } else {
                if (template_id && created?.id) {
                  try {
                    await seedTournamentFromTemplate(created.id, template_id);
                  } catch (seedErr) {
                    console.error("Failed to seed template:", seedErr);
                  }
                }
                sendAdminRegistrationNotification({
                  competition: "Predictor — Korisnički turnir",
                  first_name: tournament_name,
                  last_name: `(@${finalSlug})`,
                  email: paymentIntent.receipt_email || "",
                  phone: "",
                  payment_method: "Stripe (kartica)",
                  amount: "2.00€",
                  notes: `Tournament ID: ${created?.id} • Owner user_id: ${user_id}`,
                });
              }
            }
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
