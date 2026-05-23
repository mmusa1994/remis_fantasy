import "server-only";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing env var STRIPE_SECRET_KEY");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  typescript: true,
});

// --- Tournament creation pricing -----------------------------------------
// Lazily resolves the active default Price for the configured tournament Product.
// Cached in-module so we hit Stripe at most once per server instance lifetime
// (or until the TTL expires). Falls back to a hard-coded 2 EUR if no product
// is configured, so local dev without env vars still works.

const FALLBACK_AMOUNT_CENTS = 200;
const FALLBACK_CURRENCY = "eur";
const PRICE_CACHE_TTL_MS = 10 * 60 * 1000;

type ResolvedPrice = {
  productId: string | null;
  priceId: string | null;
  amount: number;
  currency: string;
};

let cached: { value: ResolvedPrice; expiresAt: number } | null = null;

export async function getTournamentCreationPrice(): Promise<ResolvedPrice> {
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.value;

  const productId = process.env.STRIPE_TOURNAMENT_PRODUCT_ID || null;
  const explicitPriceId = process.env.STRIPE_TOURNAMENT_PRICE_ID || null;

  let resolved: ResolvedPrice = {
    productId,
    priceId: null,
    amount: FALLBACK_AMOUNT_CENTS,
    currency: FALLBACK_CURRENCY,
  };

  try {
    if (explicitPriceId) {
      const price = await stripe.prices.retrieve(explicitPriceId);
      if (price && price.active && typeof price.unit_amount === "number") {
        resolved = {
          productId:
            typeof price.product === "string" ? price.product : productId,
          priceId: price.id,
          amount: price.unit_amount,
          currency: price.currency,
        };
      }
    } else if (productId) {
      const product = await stripe.products.retrieve(productId);
      const defaultPriceField = (product as any).default_price;
      const defaultPriceId =
        typeof defaultPriceField === "string"
          ? defaultPriceField
          : defaultPriceField?.id || null;

      let priceObj: Stripe.Price | null = null;
      if (defaultPriceId) {
        priceObj = await stripe.prices.retrieve(defaultPriceId);
      } else {
        const list = await stripe.prices.list({
          product: productId,
          active: true,
          limit: 1,
        });
        priceObj = list.data[0] || null;
      }

      if (priceObj && typeof priceObj.unit_amount === "number") {
        resolved = {
          productId,
          priceId: priceObj.id,
          amount: priceObj.unit_amount,
          currency: priceObj.currency,
        };
      }
    }
  } catch (err) {
    console.warn(
      "[stripe] tournament price resolve failed, using fallback",
      err instanceof Error ? err.message : err,
    );
  }

  cached = { value: resolved, expiresAt: now + PRICE_CACHE_TTL_MS };
  return resolved;
}
