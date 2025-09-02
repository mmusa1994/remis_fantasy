import OpenAI from "openai";
import { z } from "zod";
import stringSimilarity from "string-similarity";
import type { FplVocab } from "./fplVocab";

export const ValidationSchema = z.object({
  is_in_scope: z.boolean(),
  mentions_season: z.boolean(),
  season_ok: z.boolean(),
  intent: z.enum([
    "captain_pick","value_defenders","wildcard","differentials","fixtures_analysis",
    "transfers","chips","other"
  ]),
  confidence: z.number().min(0).max(1),
  normalized_query: z.string(),
  needs_clarification: z.boolean().optional().default(false),
  clarification_hint: z.string().optional(),
});
export type Validation = z.infer<typeof ValidationSchema>;

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function validateQuery(input: string, vocab: FplVocab): Promise<Validation & { term_evidence: string[] }> {
  // UVEK fetčuj live podatke za validaciju
  let liveData: any = {};
  try {
    const { getBootstrapStatic } = await import('./fplTools');
    liveData = await getBootstrapStatic();
  } catch (error) {
    console.error('Failed to fetch bootstrap-static for validation:', error);
  }

  const inputLower = input.toLowerCase();
  
  // Osnovni FPL termini (prošireno)
  const fplTerms = [
    'kapiten', 'captain', 'kapetana', 'kolo', 'gw', 'gameweek', 'utakmica', 'utakmice', 'mec', 'mecevi',
    'igrac', 'igraca', 'player', 'tim', 'team', 'klub', 'protiv', 'vs', 'iduce', 'next', 'sledece',
    'fantasy', 'fpl', 'premier', 'league', 'liga', 'transfer', 'wildcard', 'chip', 'differential',
    'points', 'poena', 'form', 'forma', 'price', 'cena', 'ownership', 'vlasnistvo', 'fixtures',
    'clean sheet', 'goal', 'gol', 'assist', 'asistencija', 'bonus', 'bps', 'injury', 'povreda',
    'welbeck', 'welback', 'welbekc' // Dodaj i česte greške u kucanju
  ];

  // Imena igrača i timova iz live podataka
  const liveTeams = liveData?.teams?.map((t: any) => t.name.toLowerCase()) || [];
  const livePlayers = liveData?.elements?.map((p: any) => p.web_name.toLowerCase()) || [];
  
  const allKnownTerms = [
    ...fplTerms,
    ...vocab.teams.map(t => t.toLowerCase()),
    ...vocab.players.slice(0, 200).map(p => p.toLowerCase().split(' ')).flat(),
    ...vocab.genericTerms.map(t => t.toLowerCase()),
    ...liveTeams, // Dodaj live timove
    ...livePlayers.slice(0, 300) // Dodaj live igrače (ograniči broj)
  ];

  // Dodaj poznata imena timova i igrača
  const teamNicknames = [
    'arsenal', 'chelsea', 'liverpool', 'city', 'united', 'spurs', 'tottenham',
    'newcastle', 'brighton', 'villa', 'west ham', 'crystal palace', 'everton',
    'wolves', 'fulham', 'brentford', 'nottingham', 'forest', 'bournemouth',
    'luton', 'burnley', 'sheffield', 'leeds', 'leicester', 'watford',
    'haaland', 'salah', 'kane', 'son', 'rashford', 'fernandes', 'de bruyne',
    'saka', 'odegaard', 'alexander-arnold', 'robertson', 'dias', 'stones',
    'welbeck', 'wellbeck', 'welbekk' // Dodaj različite načine kucanja Welbeck
  ];

  allKnownTerms.push(...teamNicknames);

  // Proveri da li input sadrži bilo koji poznati termin
  const containsKnownTerm = allKnownTerms.some(term => 
    inputLower.includes(term) || term.includes(inputLower.replace(/[^a-z]/g, ''))
  );

  // Takođe proveri da li je pitanje o fudbalu uopšte
  const footballRelated = /\b(футбал|football|soccer|gol|goal|игра|game|мач|match|тим|team|играч|player|капитен|captain|лига|league|премијер|premier|фантази|fantasy)\b/i.test(input);
  
  const seasonHint = /\b(2025\/?26|25\/?26|this season|current season|gameweek|gw\s*\d+|next|iduc|sledec|naredno|naredni)\b/i.test(input);

  const schema = {
    type: "json_schema",
    json_schema: {
      name: "FPLValidator",
      strict: true,
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
      }
    }
  } as const;

  // Proveri da li je konkretno imenovan igrač aktivan u live podacima
  let playerFound = false;
  const evidence = allKnownTerms.filter(term => inputLower.includes(term)).slice(0, 5);
  
  if (liveData?.elements) {
    const mentionedPlayer = liveData.elements.find((p: any) => {
      const playerName = p.web_name.toLowerCase();
      const firstName = p.first_name.toLowerCase();
      const lastName = p.second_name.toLowerCase(); 
      const fullName = `${firstName} ${lastName}`;
      
      // Različiti načini podudaranja
      const inputClean = inputLower.replace(/[^a-z]/g, '');
      const playerClean = playerName.replace(/[^a-z]/g, '');
      const lastNameClean = lastName.replace(/[^a-z]/g, '');
      
      return (
        inputLower.includes(playerName) || // "botman" u input
        inputLower.includes(lastName) ||   // "botman" kao prezime
        inputLower.includes(fullName) ||   // puno ime
        playerName.includes(inputClean) || // obrnuto
        lastName.includes(inputClean) ||   // obrnuto samo prezime
        inputClean.includes(playerClean) ||
        inputClean.includes(lastNameClean) ||
        // Dodatni sloj za česta imena
        (inputClean.includes('welbeck') && lastNameClean.includes('welbeck')) ||
        (inputClean.includes('botman') && lastNameClean.includes('botman')) ||
        (inputClean.includes('haaland') && lastNameClean.includes('haaland')) ||
        (inputClean.includes('salah') && lastNameClean.includes('salah'))
      );
    });
    
    if (mentionedPlayer) {
      playerFound = true;
      evidence.push(`live_player:${mentionedPlayer.web_name}`);
    }
  }

  // Ako sadrži poznate termine ili je povezano sa fudbalom, ili našao live igrač, prihvati odmah
  if (containsKnownTerm || footballRelated || playerFound) {
    return {
      is_in_scope: true,
      mentions_season: seasonHint,
      season_ok: true,
      intent: inputLower.includes('kapiten') || inputLower.includes('captain') ? 'captain_pick' :
               inputLower.includes('transfer') ? 'transfers' :
               inputLower.includes('wildcard') ? 'wildcard' :
               inputLower.includes('fixture') || inputLower.includes('utakmica') || inputLower.includes('protiv') ? 'fixtures_analysis' :
               'other',
      confidence: playerFound ? 0.95 : 0.9, // Veća pouzdanost ako je našao live igrača
      normalized_query: input,
      needs_clarification: false,
      clarification_hint: '',
      term_evidence: evidence
    };
  }

  // Samo ako ništa od navedenog, onda pozovi AI za validaciju
  const resp = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: schema,
    messages: [
      { role:"system", content:
        `You validate if a question is about Fantasy Premier League or football/soccer.
         ACCEPT: anything about football, soccer, players, teams, matches, leagues, fantasy sports.
         REJECT: only non-sports topics like weather, politics, programming.
         Be VERY PERMISSIVE - if there's any doubt, accept it.` },
      { role:"user", content: `Q: """${input}"""` }
    ],
    max_tokens: 100,
    temperature: 0.1
  });

  const json = JSON.parse(resp.choices[0].message.content || '{}');
  const parsed = ValidationSchema.parse(json);

  return { 
    ...parsed, 
    is_in_scope: true, // Veoma liberalno - prihvati skoro sve
    season_ok: true,
    term_evidence: [] 
  };
}