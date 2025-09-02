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
          `You are a validator for Fantasy Premier League (FPL) 2025/26 season questions. ` +
          `ALWAYS ACCEPT questions about: FPL team selection, captaincy, player points, gameweeks, differentials, chips, FPL transfers, ANY Premier League players, ANY Premier League teams/clubs (Arsenal, Chelsea, Manchester United, Liverpool, etc), player performance, team form, fixtures, player stats, injury updates, price changes, league positions, historical performance. ` +
          `REJECT questions about: other sports leagues (except Premier League/FPL), politics, personal advice, weather, coding, completely unrelated topics. ` +
          `Premier League clubs and players are ALWAYS RELEVANT to FPL - historical performance helps with team selection. ` +
          `Questions about Arsenal, Manchester City, Liverpool etc. finishing positions are FPL-relevant. Be very permissive for any football/Premier League content.`
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
  const hasHighConfidence = parsed.data.confidence >= 0.4; // More permissive for Premier League content
  
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