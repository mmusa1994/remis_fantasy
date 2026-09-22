import { registrationsClosedResponse } from "@/lib/registrations-closed";

// F1 Fantasy 2026 (gotovina) — prijave su zatvorene. Endpoint je blokiran na serveru:
// ne prima podatke, ne upisuje u bazu i ne zove nikakav payment provider.
export async function POST() {
  return registrationsClosedResponse();
}
