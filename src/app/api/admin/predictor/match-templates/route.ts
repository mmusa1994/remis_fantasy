import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/predictor";
import { MATCH_TEMPLATES } from "@/data/predictor-match-templates";

// GET — lista predefinisanih match šablona
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const summaries = MATCH_TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    count: t.matches.length,
    tag: t.tag ?? null,
  }));
  return NextResponse.json(summaries);
}
