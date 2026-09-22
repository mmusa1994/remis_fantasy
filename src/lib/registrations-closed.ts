import { NextResponse } from "next/server";

/**
 * Prijave za sve lige (Premier League, Champions League, F1) su zatvorene.
 *
 * Registracijski endpointi su hard-blokirani na serveru: ne upisuju ništa u
 * bazu, ne šalju email i ne zovu nikakav payment provider. Kad se prijave
 * ponovo otvore, vraća se prava logika u te route handlere — ovo je jedino
 * mjesto na kojem je definisan "zatvoreno" odgovor.
 */
export const REGISTRATIONS_CLOSED_MESSAGE =
  "Prijave su zatvorene. Registracija trenutno nije moguća.";

export function registrationsClosedResponse() {
  return NextResponse.json(
    { error: REGISTRATIONS_CLOSED_MESSAGE, registrations_closed: true },
    { status: 403 }
  );
}
