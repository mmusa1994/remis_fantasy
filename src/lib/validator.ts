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
          `ALWAYS ACCEPT questions about these Premier League teams: ${vocab.teams.join(', ')}. ` +
          `ALWAYS ACCEPT: team performance, league positions, historical data, past seasons, player statistics, transfers, injuries, form analysis, fixtures, any Premier League related content. ` +
          `HISTORICAL QUESTIONS ARE ALWAYS VALID: "how did team X perform in last 5 seasons", "team X results last year", etc. ` +
          `Any question mentioning these teams or players is ALWAYS VALID for FPL analysis. ` +
          `REJECT only: politics, weather, coding, completely unrelated non-football topics. ` +
          `If a question mentions ANY Premier League team name, nickname, or inflected form, ALWAYS set is_in_scope to true.`
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
  const hasHighConfidence = parsed.data.confidence >= 0.3; // Very permissive for Premier League content
  
  // Create dynamic regex from actual team names in vocabulary
  const teamNamesPattern = vocab.teams
    .map(team => team.toLowerCase().replace(/\s+/g, '\\s+')) // Handle spaces in team names
    .join('|');
  const dynamicTeamRegex = new RegExp(`\\b(${teamNamesPattern})\\b`, 'i');
  
  // Complete Premier League team nicknames database
  const premierLeagueNicknames = [
    { club: "Arsenal", nicknames: ["gunners"] },
    { club: "Aston Villa", nicknames: ["villans"] },
    { club: "Bournemouth", nicknames: ["cherries"] },
    { club: "Brentford", nicknames: ["bees"] },
    { club: "Brighton & Hove Albion", nicknames: ["seagulls"] },
    { club: "Burnley", nicknames: ["clarets"] },
    { club: "Chelsea", nicknames: ["blues"] },
    { club: "Crystal Palace", nicknames: ["eagles"] },
    { club: "Everton", nicknames: ["toffees", "blues", "peoples club", "school of science"] },
    { club: "Fulham", nicknames: ["cottagers"] },
    { club: "Leeds United", nicknames: ["whites", "united"] },
    { club: "Liverpool", nicknames: ["reds"] },
    { club: "Manchester City", nicknames: ["citizens", "sky blues", "city"] },
    { club: "Manchester United", nicknames: ["red devils", "united"] },
    { club: "Newcastle United", nicknames: ["magpies", "toon army", "geordies"] },
    { club: "Nottingham Forest", nicknames: ["forest", "garibaldis", "reds", "tricky trees"] },
    { club: "Southampton", nicknames: ["saints"] },
    { club: "Sunderland", nicknames: ["black cats", "mackems"] },
    { club: "Tottenham Hotspur", nicknames: ["spurs"] },
    { club: "West Ham United", nicknames: ["hammers", "irons"] },
    { club: "Wolverhampton Wanderers", nicknames: ["wolves"] }
  ];
  
  // Extract all nicknames into a flat array
  const allNicknames = premierLeagueNicknames
    .flatMap(team => team.nicknames)
    .concat(['arsenal', 'chelsea', 'liverpool', 'city', 'united', 'spurs', 'everton']); // Add common short names
  
  const nicknamePattern = allNicknames.join('|');
  const nicknameRegex = new RegExp(`\\b(${nicknamePattern})\\b`, 'i');
  
  // Add flexible team name matching for inflected forms and partial matches
  const baseTeamNames = [
    'arsenal', 'chelsea', 'liverpool', 'manchester', 'tottenham', 'leeds', 'aston', 'villa',
    'newcastle', 'brighton', 'west', 'ham', 'crystal', 'palace', 'leicester', 'wolves',
    'southampton', 'burnley', 'norwich', 'watford', 'brentford', 'bournemouth', 'fulham',
    'nottingham', 'forest', 'everton', 'sheffield'
  ];
  
  // Create flexible regex that matches team name stems (handles inflected forms like "leedsa")
  const flexibleTeamPattern = baseTeamNames
    .map(name => `${name}[a-z]{0,3}`) // Allow up to 3 additional characters for inflections
    .join('|');
  const flexibleTeamRegex = new RegExp(`\\b(${flexibleTeamPattern})\\b`, 'i');
  
  // Also check for player names from the vocab
  const playerNamesPattern = vocab.players.slice(0, 50) // Top 50 players to avoid too long regex
    .map(player => player.toLowerCase().replace(/\s+/g, '\\s+'))
    .join('|');
  const playerRegex = new RegExp(`\\b(${playerNamesPattern})\\b`, 'i');
  
  // Override: Always accept Premier League team/player questions regardless of model output
  const shouldOverrideScope = dynamicTeamRegex.test(input) || nicknameRegex.test(input) || 
                             flexibleTeamRegex.test(input) || playerRegex.test(input);
  const is_in_scope = shouldOverrideScope || (parsed.data.is_in_scope && hasHighConfidence);
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