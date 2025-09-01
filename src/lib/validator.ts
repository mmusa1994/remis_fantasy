import OpenAI from "openai";
import { z } from "zod";
import stringSimilarity from "string-similarity";
import type { FplVocab } from "./fplVocab";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// strict JSON we expect back from the model
export const ValidationSchema = z.object({
  is_in_scope: z.boolean(),          // FPL + EPL relevant
  mentions_season: z.boolean(),      // user explicitly/implicitly points to 25/26, GW numbers, or current season
  season_ok: z.boolean(),            // resolves to 2025/26 EPL
  intent: z.enum([
    "captain_pick","value_defenders","wildcard","differentials","fixtures_analysis",
    "transfers","chips","other"
  ]),
  confidence: z.number().min(0).max(1),
  normalized_query: z.string(),
  needs_clarification: z.boolean().optional().default(false),
  clarification_hint: z.string().optional(),
});

type Validation = z.infer<typeof ValidationSchema>;

export async function validateQuery(input: string, vocab: FplVocab): Promise<Validation & {
  term_evidence: string[];
}> {
  // 1) fuzzy term evidence (permissive)
  const pool = new Set<string>([
    ...vocab.genericTerms,
    ...vocab.teams,
    ...vocab.players,
    ...vocab.positions,
    ...vocab.stats,
    ...vocab.events.map(e => `gw${e.id}`),
    ...vocab.events.map(e => e.name?.toLowerCase() ?? ''),
    vocab.seasonLabel.toLowerCase(), // e.g. "2025/26"
  ].filter(Boolean).map(s => s.toLowerCase()));

  const tokens = tokenize(input);
  const hits: string[] = [];
  for (const t of tokens) {
    const match = stringSimilarity.findBestMatch(t, Array.from(pool));
    if (match.bestMatch.rating >= 0.72) hits.push(match.bestMatch.target); // permissive threshold
  }

  // 2) season hint (allow "this season", "next GW", numeric GW)
  const seasonHint = /\b(2025\/?26|25\/?26|this season|current season|gameweek|gw\s*\d+|next gw)\b/i.test(input);

  // 3) let the model decide high-level intent & scope using Structured Outputs
  const schema = {
    name: "FPLValidator",
    schema: {
      type: "object",
      properties: {
        is_in_scope: { type: "boolean" },
        mentions_season: { type: "boolean" },
        season_ok: { type: "boolean" },
        intent: {
          type: "string",
          enum: ["captain_pick","value_defenders","wildcard","differentials","fixtures_analysis","transfers","chips","other"]
        },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        normalized_query: { type: "string" },
        needs_clarification: { type: "boolean" },
        clarification_hint: { type: "string" }
      },
      required: ["is_in_scope","mentions_season","season_ok","intent","confidence","normalized_query","needs_clarification","clarification_hint"],
      additionalProperties: false
    },
    strict: true
  } as const;

  const resp = await client.chat.completions.create({
    model: "gpt-4o-mini", // cheaper model for validation
    response_format: { type: "json_schema", json_schema: schema },
    messages: [
      {
        role: "system",
        content:
          `You are a STRICT validator for Fantasy Premier League (FPL) 2025/26 season questions ONLY. ` +
          `REJECT any questions about: general football, other sports, real transfers, politics, personal advice, weather, coding, etc. ` +
          `ONLY ACCEPT questions specifically about FPL 2025/26: team selection, captaincy, player points, gameweeks, differentials, chips, transfers within FPL game. ` +
          `Consider "this season" or "next GW" as 2025/26. Be very strict - set confidence to 0.3 or lower for non-FPL questions.`
      },
      {
        role: "user",
        content:
          `Question: """${input}"""\n` +
          `Season label: "${vocab.seasonLabel}". Example intents: captain_pick, value_defenders, wildcard, differentials, fixtures_analysis, transfers, chips.\n` +
          `Return strict JSON only.`
      }
    ]
  });

  const json = JSON.parse(resp.choices[0].message.content || '{}');
  const parsed = ValidationSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Validator JSON did not match schema");
  }

  // 4) combine: enforce stricter validation but not too strict to avoid empty responses
  const hasHighConfidence = parsed.data.confidence >= 0.6; // Model is reasonably confident it's FPL
  
  const is_in_scope = parsed.data.is_in_scope && hasHighConfidence;
  const season_ok = parsed.data.season_ok || seasonHint || vocab.seasonLabel.includes("2025");

  return {
    ...parsed.data,
    is_in_scope,
    season_ok,
    term_evidence: hits.slice(0, 12) // keep it small
  };
}

function tokenize(q: string) {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\s\/\-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}