-- Email reliability za CL 26/27 registracije — idempotentno (bezbjedno
-- pokrenuti više puta). Dodaje flag kolone preko kojih webhook/keš ruta
-- bilježe da je potvrdni email (kod PGwwr7 + auto-join link) poslan, pa
-- Stripe redelivery može ponoviti samo neuspjelo slanje bez duplikata.
--
-- Kod radi i BEZ ovih kolona (42703 fallback), ali bez njih neuspjeli
-- email nema automatski retry.

alter table registration_champions_league_26_27
  add column if not exists confirmation_email_sent boolean not null default false;

alter table registration_champions_league_26_27
  add column if not exists confirmation_email_sent_at timestamptz;
