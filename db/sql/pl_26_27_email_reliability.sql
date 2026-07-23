-- Pouzdanost potvrdnih emailova i idempotencija webhooka.
-- Pokrenuti u Supabase SQL Editoru PRIJE deploya koda koji ga koristi
-- (kod tolerira nedostatak kolona/tabela, ali bez njih nema retry emaila
-- ni evidencije konflikata).

-- 1) PL 26/27: flag da je potvrdni email s kodovima stvarno poslan.
--    Webhook ga postavlja tek nakon uspješnog sendMail-a; Stripe redelivery
--    ponovo pokušava slanje dok flag nije postavljen.
ALTER TABLE registration_premier_league_26_27
  ADD COLUMN IF NOT EXISTS confirmation_email_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirmation_email_sent_at timestamptz;

-- 2) Idempotencija za CL 26/27 i F1: backstop protiv duplog upisa kad Stripe
--    isporuči isti payment_intent.succeeded event više puta.
ALTER TABLE registration_champions_league_26_27
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;
CREATE UNIQUE INDEX IF NOT EXISTS registration_cl_26_27_stripe_pi_uidx
  ON registration_champions_league_26_27 (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS f1_registrations_25_26_stripe_pi_uidx
  ON f1_registrations_25_26 (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- 3) Trajna evidencija "naplaćeno ali nije upisano" konflikata — da slučaj
--    ne zavisi samo od admin email notifikacije (SMTP može biti nedostupan).
CREATE TABLE IF NOT EXISTS payment_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_payment_intent_id text UNIQUE NOT NULL,
  competition text NOT NULL,
  email text,
  amount numeric(10, 2),
  details text,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE payment_conflicts ENABLE ROW LEVEL SECURITY;
