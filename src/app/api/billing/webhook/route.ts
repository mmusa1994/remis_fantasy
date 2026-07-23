import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseServer } from "@/lib/supabase-server";
import Stripe from "stripe";
import * as nodemailer from "nodemailer";
import { getF1CodesEmailHtml } from "@/app/api/send-f1-email/route";
import {
  sendAdminRegistrationNotification,
  sendPLRegistrationConfirmationEmail,
} from "@/lib/email";
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

          // Idempotency: Stripe isporučuje evente at-least-once — preskoči
          // ako je ovaj PaymentIntent već upisan.
          const { data: existingF1, error: f1LookupError } =
            await supabaseServer
              .from("f1_registrations_25_26")
              .select("id")
              .eq("stripe_payment_intent_id", paymentIntent.id)
              .maybeSingle();

          if (f1LookupError) {
            throw new Error(
              `F1 idempotency lookup failed: ${f1LookupError.message}`
            );
          }

          if (existingF1) {
            console.info("F1 registration already recorded for PI:", paymentIntent.id);
            break;
          }

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
            await sendAdminRegistrationNotification({
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

          // Idempotency: preskoči ako je ovaj PaymentIntent već upisan.
          const { data: existingCl, error: clLookupError } =
            await supabaseServer
              .from("registration_champions_league_26_27")
              .select("id")
              .eq("stripe_payment_intent_id", paymentIntent.id)
              .maybeSingle();

          if (clLookupError) {
            throw new Error(
              `CL idempotency lookup failed: ${clLookupError.message}`
            );
          }

          if (existingCl) {
            console.info("CL registration already recorded for PI:", paymentIntent.id);
            break;
          }

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

          if (
            clError?.code === "23505" &&
            clError.message.includes("stripe_pi_uidx")
          ) {
            // Konkurentna isporuka istog eventa već je upisala red.
            console.info("CL registration already recorded (unique index) for PI:", paymentIntent.id);
          } else if (clError?.code === "23505") {
            // Deterministički konflikt (npr. email već registrovan kešom):
            // kartica JESTE naplaćena, a red ne može biti upisan — trajno
            // evidentiraj i alarmiraj admina, retry nikad ne može uspjeti.
            console.error(
              "CL registration conflict for PI:",
              paymentIntent.id,
              clError.message
            );
            const { error: clConflictError } = await supabaseServer
              .from("payment_conflicts")
              .insert({
                stripe_payment_intent_id: paymentIntent.id,
                competition: "Champions League",
                email,
                amount: 15.0,
                details: `Naplaćeno, ali upis nije uspio: ${clError.message}. Ime: ${first_name} ${last_name}, tel: ${phone}.`,
              });
            const clConflictRecorded =
              !clConflictError || clConflictError.code === "23505";
            if (clConflictError?.code === "42P01") {
              console.error(
                "payment_conflicts table missing — run db/sql/pl_26_27_email_reliability.sql"
              );
            } else if (clConflictError && clConflictError.code !== "23505") {
              throw new Error(
                `Failed to record CL payment conflict for PI ${paymentIntent.id}: ${clConflictError.message}`
              );
            }
            await sendAdminRegistrationNotification({
              competition: "Champions League",
              first_name,
              last_name,
              email,
              phone,
              payment_method: "Stripe (kartica)",
              amount: "15.00€",
              notes: `⚠️ KONFLIKT: uplata je naplaćena, ali upis NIJE uspio jer registracija s ovim podacima već postoji (${clError.message}). PaymentIntent: ${paymentIntent.id}. ${clConflictRecorded ? "Evidentirano u payment_conflicts tabeli." : "NIJE evidentirano u payment_conflicts (tabela ne postoji — pokrenuti db/sql/pl_26_27_email_reliability.sql)."} Riješiti ručno — spojiti s postojećom registracijom ili refundirati.`,
            });
          } else if (clError) {
            console.error("Error inserting CL registration:", clError);
          } else {
            await sendAdminRegistrationNotification({
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
                await sendAdminRegistrationNotification({
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

          // Charged amount is authoritative — the PI was created server-side
          // from the tier map in /api/premier-league/register.
          const amount = paymentIntent.amount / 100;

          // Idempotency: Stripe may deliver the same event more than once.
          // A failed lookup must NOT fall through to the insert — return 500
          // instead so Stripe retries the event later. confirmation_email_sent
          // se čita da bi redelivery mogao ponoviti neuspjelo slanje emaila;
          // ako kolona još ne postoji (SQL nije pokrenut), fallback bez nje.
          let existingPl: {
            id: string;
            confirmation_email_sent?: boolean | null;
          } | null = null;
          let emailFlagSupported = true;

          const plLookup = await supabaseServer
            .from("registration_premier_league_26_27")
            .select("id, confirmation_email_sent")
            .eq("stripe_payment_intent_id", paymentIntent.id)
            .maybeSingle();

          if (plLookup.error?.code === "42703") {
            emailFlagSupported = false;
            console.error(
              "confirmation_email_sent column missing — run db/sql/pl_26_27_email_reliability.sql"
            );
            const fallback = await supabaseServer
              .from("registration_premier_league_26_27")
              .select("id")
              .eq("stripe_payment_intent_id", paymentIntent.id)
              .maybeSingle();
            if (fallback.error) {
              throw new Error(
                `PL registration idempotency lookup failed: ${fallback.error.message}`
              );
            }
            existingPl = fallback.data;
          } else if (plLookup.error) {
            throw new Error(
              `PL registration idempotency lookup failed: ${plLookup.error.message}`
            );
          } else {
            existingPl = plLookup.data;
          }

          const markPlEmailSent = async (registrationId: string) => {
            if (!emailFlagSupported) return;
            const { error: flagError } = await supabaseServer
              .from("registration_premier_league_26_27")
              .update({
                confirmation_email_sent: true,
                confirmation_email_sent_at: new Date().toISOString(),
              })
              .eq("id", registrationId);
            if (flagError) {
              // Flag nije upisan iako je email poslan — redelivery bi poslao
              // duplikat, zato samo logujemo (email je stigao korisniku).
              console.error("Failed to mark PL confirmation email sent:", flagError);
            }
          };

          if (existingPl) {
            // Redelivery: red postoji. Ako potvrdni email ranije nije prošao,
            // pokušaj ga ponovo (admin notifikacija se NE šalje ponovo).
            if (emailFlagSupported && existingPl.confirmation_email_sent === false) {
              const emailResult = await sendPLRegistrationConfirmationEmail({
                first_name,
                last_name,
                email,
                league_tier,
                amount,
                payment_method: "card",
              });
              if (emailResult?.success) {
                await markPlEmailSent(existingPl.id);
              } else {
                throw new Error(
                  `PL confirmation email retry failed for PI ${paymentIntent.id}`
                );
              }
            } else {
              console.info(
                "PL registration already recorded for PI:",
                paymentIntent.id
              );
            }
          } else {
            const { data: insertedPl, error: plError } = await supabaseServer
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
              })
              .select("id")
              .single();

            if (
              plError?.code === "23505" &&
              plError.message.includes("stripe_pi_uidx")
            ) {
              // Unique violation on stripe_payment_intent_id: a concurrent
              // delivery of the same event already inserted the row.
              console.info(
                "PL registration already recorded for PI:",
                paymentIntent.id
              );
            } else if (plError?.code === "23505") {
              // Deterministic conflict (e.g. email already registered via the
              // cash flow) — the card WAS charged but no row was written, and
              // a retry can never succeed. Prvo TRAJNO evidentiraj konflikt
              // (admin email može pasti bez traga), pa tek onda alarmiraj.
              console.error(
                "PL registration conflict for PI:",
                paymentIntent.id,
                plError.message
              );
              const { error: conflictError } = await supabaseServer
                .from("payment_conflicts")
                .insert({
                  stripe_payment_intent_id: paymentIntent.id,
                  competition: "Premier League",
                  email,
                  amount,
                  details: `Naplaćeno, ali upis nije uspio: ${plError.message}. Tier: ${league_tier}, ime: ${first_name} ${last_name}, tel: ${phone}.`,
                });
              const conflictRecorded =
                !conflictError || conflictError.code === "23505";
              if (conflictError?.code === "42P01") {
                console.error(
                  "payment_conflicts table missing — run db/sql/pl_26_27_email_reliability.sql"
                );
              } else if (conflictError && conflictError.code !== "23505") {
                // Konflikt nije trajno zabilježen — 500 da Stripe ponovi event
                // dok evidencija ne uspije (23505 = već zabilježen ranije).
                throw new Error(
                  `Failed to record payment conflict for PI ${paymentIntent.id}: ${conflictError.message}`
                );
              }
              await sendAdminRegistrationNotification({
                competition: "Premier League",
                first_name,
                last_name,
                email,
                phone,
                payment_method: "Stripe (kartica)",
                amount: `${amount.toFixed(2)}€`,
                league_tier,
                notes: `⚠️ KONFLIKT: uplata je naplaćena, ali upis NIJE uspio jer registracija s ovim podacima već postoji (${plError.message}). PaymentIntent: ${paymentIntent.id}. ${conflictRecorded ? "Evidentirano u payment_conflicts tabeli." : "NIJE evidentirano u payment_conflicts (tabela ne postoji — pokrenuti db/sql/pl_26_27_email_reliability.sql)."} Riješiti ručno — spojiti s postojećom registracijom ili refundirati.`,
              });
            } else if (plError) {
              console.error("Error inserting PL registration:", plError);
              // The card was charged but the registration was not persisted —
              // alert the admin ONCE, then return 500 so Stripe retries the
              // event. Dedupe alarma preko payment_conflicts (Stripe retry-a
              // do ~3 dana — bez dedupe-a admin dobija email na svaki retry).
              const { error: alertDedupeError } = await supabaseServer
                .from("payment_conflicts")
                .insert({
                  stripe_payment_intent_id: paymentIntent.id,
                  competition: "Premier League",
                  email,
                  amount,
                  details: `GREŠKA (Stripe retry u toku): upis nije uspio — ${plError.message}. Tier: ${league_tier}, ime: ${first_name} ${last_name}, tel: ${phone}.`,
                });
              const alreadyAlerted = alertDedupeError?.code === "23505";
              if (!alreadyAlerted) {
                await sendAdminRegistrationNotification({
                  competition: "Premier League",
                  first_name,
                  last_name,
                  email,
                  phone,
                  payment_method: "Stripe (kartica)",
                  amount: `${amount.toFixed(2)}€`,
                  league_tier,
                  notes: `⚠️ GREŠKA: uplata je naplaćena, ali upis u bazu NIJE uspio (${plError.message}). PaymentIntent: ${paymentIntent.id}. Stripe će automatski ponoviti pokušaj — ručno upiši registraciju samo ako se ne pojavi u admin panelu.`,
                });
              }
              throw new Error(
                `PL registration insert failed for PI ${paymentIntent.id}: ${plError.message}`
              );
            } else {
              // Ako je raniji pokušaj upisa pao (retry-alarm u
              // payment_conflicts), očisti zapis — registracija je sada
              // uspješno upisana. Greške se ignorišu (best effort).
              await supabaseServer
                .from("payment_conflicts")
                .delete()
                .eq("stripe_payment_intent_id", paymentIntent.id);

              await sendAdminRegistrationNotification({
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
              const emailResult = await sendPLRegistrationConfirmationEmail({
                first_name,
                last_name,
                email,
                league_tier,
                amount,
                payment_method: "card",
              });
              if (emailResult?.success) {
                if (insertedPl?.id) await markPlEmailSent(insertedPl.id);
              } else if (emailFlagSupported) {
                // Email s kodovima NIJE poslan — 500 da Stripe ponovi event;
                // redelivery grana iznad će ponoviti samo slanje emaila.
                throw new Error(
                  `PL confirmation email failed for PI ${paymentIntent.id} — Stripe will retry`
                );
              } else {
                console.error(
                  "PL confirmation email failed and retry flag unsupported — resend manually via admin panel. PI:",
                  paymentIntent.id
                );
              }
            }
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
