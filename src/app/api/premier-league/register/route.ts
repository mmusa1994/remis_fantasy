import { registrationsClosedResponse } from "@/lib/registrations-closed";

// Premier League 2026/27 — prijave su zatvorene. Endpoint je blokiran na serveru:
// ne prima podatke, ne upisuje u bazu i ne zove nikakav payment provider.
export async function POST() {
  return registrationsClosedResponse();
}
