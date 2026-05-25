import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/predictor";
import { PREDICTOR_TEMPLATES } from "@/data/predictor-templates";

// GET — lista šablona (samo meta podaci, bez ekipa)
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const summaries = PREDICTOR_TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    short_description: t.short_description,
    accent_color: t.accent_color,
    logo_url: t.logo_url ?? null,
    category_count: t.categories.length,
    team_count: t.categories.reduce(
      (acc, c) => Math.max(acc, c.options?.length ?? 0),
      0,
    ),
  }));

  return NextResponse.json(summaries);
}
