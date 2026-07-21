-- Premier League 26/27: kolone potrebne za Stripe kartične uplate.
-- Živa tabela registration_premier_league_26_27 postoji, ali bez ovih kolona
-- webhook (/api/billing/webhook) ne može upisati plaćenu registraciju.
-- Pokrenuti u Supabase SQL Editoru.

ALTER TABLE registration_premier_league_26_27
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS amount_paid numeric(10, 2);

-- Jedinstvenost po PaymentIntent-u: backstop protiv duplog upisa ako Stripe
-- isporuči isti webhook event više puta.
CREATE UNIQUE INDEX IF NOT EXISTS registration_pl_26_27_stripe_pi_uidx
  ON registration_premier_league_26_27 (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- Stari CHECK constraint ne dozvoljava payment_method = 'stripe' (webhook
-- upis kartičnih uplata pada s 23514). Proširiti dozvoljene vrijednosti.
ALTER TABLE registration_premier_league_26_27
  DROP CONSTRAINT IF EXISTS registration_premier_league_26_27_payment_method_check;
ALTER TABLE registration_premier_league_26_27
  ADD CONSTRAINT registration_premier_league_26_27_payment_method_check
  CHECK (payment_method IN ('stripe', 'cash', 'bank', 'wise', 'paypal'));
