import { NextRequest, NextResponse } from "next/server";
import { stripe, getTournamentCreationPrice } from "@/lib/stripe";
import { supabaseServer } from "@/lib/supabase-server";
import { requireUser, slugify, jsonError } from "@/lib/predictor";
import { getTemplate } from "@/data/predictor-templates";
import { seedTournamentFromTemplate } from "@/lib/predictor-seed";

export async function POST(req: NextRequest) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;
  const userId: string = guard.user.id;
  const userEmail: string = guard.user.email || "";

  const body = await req.json();
  const tournament_name = String(body?.tournament_name || "").trim();
  const short_description = String(body?.short_description || "").trim() || null;
  const accent_color = String(body?.accent_color || "amber");
  const template_id = body?.template_id ? String(body.template_id) : null;
  const tmpl = template_id ? getTemplate(template_id) : null;
  if (template_id && !tmpl) return jsonError("Šablon nije pronađen", 400);
  const requestedSlug = body?.tournament_slug
    ? String(body.tournament_slug).trim()
    : tournament_name;

  if (!tournament_name) return jsonError("Naziv turnira je obavezan");
  if (tournament_name.length < 3)
    return jsonError("Naziv turnira mora imati najmanje 3 znaka");
  if (tournament_name.length > 80)
    return jsonError("Naziv turnira može imati najviše 80 znakova");

  const slug = slugify(requestedSlug);
  if (!slug) return jsonError("Slug nije validan");

  // Slug uniqueness check (case sensitive in DB; lowercase already from slugify)
  const { data: slugTaken } = await supabaseServer
    .from("predictor_tournaments")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (slugTaken)
    return jsonError(
      "Već postoji turnir sa tim URL identifikatorom. Probaj drugi.",
      409,
    );

  // Branch A: user already has credits → create directly, no Stripe needed
  const { data: userRow, error: userErr } = await supabaseServer
    .from("users")
    .select("tournament_create_credits, email, name")
    .eq("id", userId)
    .maybeSingle();
  if (userErr) return jsonError(userErr.message, 500);

  const credits = userRow?.tournament_create_credits ?? 0;
  if (credits > 0) {
    // Decrement credit + insert tournament (best-effort; not transactional but acceptable for low contention)
    const { error: decErr } = await supabaseServer
      .from("users")
      .update({ tournament_create_credits: credits - 1 })
      .eq("id", userId)
      .eq("tournament_create_credits", credits); // optimistic concurrency
    if (decErr) return jsonError(decErr.message, 500);

    const { data: created, error: insErr } = await supabaseServer
      .from("predictor_tournaments")
      .insert({
        slug,
        name: tournament_name,
        short_description: short_description ?? tmpl?.short_description ?? null,
        long_description: tmpl?.long_description ?? null,
        logo_url: tmpl?.logo_url ?? null,
        banner_image_url: tmpl?.banner_image_url ?? null,
        hero_image_url: tmpl?.hero_image_url ?? null,
        rules_md: tmpl?.rules_md ?? null,
        point_system_md: tmpl?.point_system_md ?? null,
        eligibility_md: tmpl?.eligibility_md ?? null,
        prize_pool_amount: tmpl?.prize_pool_amount ?? null,
        prize_pool_currency: tmpl?.prize_pool_currency ?? "EUR",
        accent_color,
        status: "draft",
        visibility: "public",
        owner_user_id: userId,
        created_via: "user_credit",
      })
      .select("id, slug")
      .single();

    if (insErr) {
      // best-effort rollback of the credit
      await supabaseServer
        .from("users")
        .update({ tournament_create_credits: credits })
        .eq("id", userId);
      return jsonError(insErr.message, 500);
    }

    if (template_id) {
      const seedResult = await seedTournamentFromTemplate(created.id, template_id);
      if (!seedResult.ok) {
        console.error("[checkout] template seed failed:", seedResult.error);
      }
    }

    return NextResponse.json({
      ok: true,
      paid: false,
      tournament_id: created.id,
      redirect_to: `/predictor/owner/${created.id}`,
    });
  }

  // Branch B: paid flow → require Stripe PaymentMethod, create PaymentIntent
  const payment_method_id = body?.payment_method_id;
  if (
    !payment_method_id ||
    typeof payment_method_id !== "string" ||
    !payment_method_id.startsWith("pm_")
  ) {
    return jsonError("Validan način plaćanja je obavezan", 400);
  }

  const price = await getTournamentCreationPrice();

  const paymentIntent = await stripe.paymentIntents.create({
    amount: price.amount,
    currency: price.currency,
    payment_method: payment_method_id,
    receipt_email: userEmail || undefined,
    metadata: {
      type: "tournament_creation",
      user_id: userId,
      tournament_name,
      tournament_slug: slug,
      short_description: short_description || "",
      accent_color,
      template_id: template_id || "",
      stripe_product_id: price.productId || "",
      stripe_price_id: price.priceId || "",
    },
    description: `Remis Predictor. kreiranje turnira "${tournament_name}"`,
  });

  return NextResponse.json({
    ok: true,
    paid: true,
    clientSecret: paymentIntent.client_secret,
    payment_intent_id: paymentIntent.id,
  });
}
