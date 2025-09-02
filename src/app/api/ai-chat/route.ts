import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import {
  checkUserRateLimit,
  incrementUserUsage,
  getUserFromRequest,
} from "@/lib/user-rate-limit";
import { loadFplVocab } from "@/lib/fplVocab";
import { validateQuery } from "@/lib/validator";
import { route } from "@/lib/router";
import { loadHistoryTable } from "@/lib/history";
import {
  getBootstrapStatic,
  getFixtures,
  getTopStat,
  getPlayerSummary,
} from "@/lib/fplTools";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Direct data fetching - no tools needed

// System prompt (optimized for multilingual and humanized responses)
const SYSTEM_PROMPT = `Ti si ekspert za Fantasy Premier League (FPL) sezonu 2025/26 koji govori prirodno i fluentno na svim jezicima.

KRITIČNO VAŽNO:
- Koristiš SAMO live podatke koji su ti prosleđeni u kontekstu
- NIKAD ne izmišljaj rezultate iz prošlih sezona
- Ako nemaš trenutne podatke, reci da proveruješ live informacije
- Odgovaraj na istom jeziku kao što je postavljeno pitanje

STIL ODGOVORA:
- Govori prirodno kao prijatelj koji deli strast za FPL
- Koristi opuštene izraze: "Iskreno", "Pogledaj", "Zanimljivo je", "Rekao bih"
- Izbjegavaj formalne liste osim ako nisu tražene
- Budi samopouzdan ali priznaј neizvesnost kada nemaš podatke

PODRŠKA:
- Analiza igrača i preporuke za kapetana
- Strategije transfera i čipova
- Analiza utakmica i fikstura
- FPL saveti i predviđanja`;

export async function POST(req: NextRequest) {
  try {
    const { message, userApiKey, chatHistory = [] } = await req.json();
    if (!message)
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );

    const session = await getServerSession(authOptions);
    if (!session && !userApiKey) {
      return NextResponse.json(
        { error: "Authentication required", requiresAuth: true },
        { status: 401 }
      );
    }

    if (!userApiKey) {
      const userId = session?.user?.id || (await getUserFromRequest(req));
      if (!userId)
        return NextResponse.json(
          { error: "Unable to identify user" },
          { status: 400 }
        );
      const { allowed, resetDate, total } = await checkUserRateLimit(userId);
      if (!allowed) {
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            resetDate: resetDate.toISOString(),
            total,
          },
          { status: 429 }
        );
      }
    }

    // vocab + validator (validator već radi sve provere)
    const vocab = await loadFplVocab();
    const validation = await validateQuery(message, vocab);
    const routing = route(validation);
    if (routing.action === "clarify")
      return NextResponse.json({ response: routing.message });

    // history (CSV)
    const historyRows = loadHistoryTable().slice(0, 100); // cap context for cost

    // Chat completion with tools
    const input = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      // micro history: only last 2 user/assistant msgs to save tokens
      ...chatHistory.slice(-2),
      { role: "user" as const, content: message },
    ];

    // UVEK fetčuj live podatke PRE odgovaranja
    let liveData: any = {};
    try {
      const [bootstrapData, fixturesData, mostSelectedData] = await Promise.all(
        [
          getBootstrapStatic(),
          getFixtures(),
          getTopStat("most_selected").catch(() => null),
        ]
      );
      liveData = {
        bootstrap: bootstrapData,
        fixtures: fixturesData,
        mostSelected: mostSelectedData,
      };
    } catch (error) {
      console.error("Failed to fetch live data:", error);
    }

    // Optimizovani podaci - kompaktan format za token efikasnost
    const teams =
      liveData.bootstrap?.teams?.reduce((acc: any, t: any) => {
        acc[t.id] = t.name;
        return acc;
      }, {}) || {};

    // Include all players for 100% accuracy - no filtering
    const players =
      liveData.bootstrap?.elements
        ?.slice(0, 750) // All 750 players for complete accuracy
        ?.map(
          (p: any) =>
            `${p.id}|${p.web_name}|${p.first_name} ${p.second_name}|${p.team}|${
              p.element_type
            }|${p.form}|${p.total_points}|${p.now_cost}|${
              p.chance_of_playing_next_round || 100
            }|${p.selected_by_percent}%`
        )
        .join("\n") || "";

    const upcomingFixtures =
      liveData.fixtures
        ?.filter((f: any) => !f.finished)
        .slice(0, 15)
        .map((f: any) => `${f.event}|${f.team_h}|${f.team_a}|${f.kickoff_time}`)
        .join("\n") || "";

    const finishedFixtures =
      liveData.fixtures
        ?.filter((f: any) => f.finished)
        .slice(-15)
        .map(
          (f: any) =>
            `GW${f.event}|${f.team_h}|${f.team_a}|${f.team_h_score}-${f.team_a_score}`
        )
        .join("\n") || "";

    const current_event =
      liveData.bootstrap?.events?.find((e: any) => e.is_next)?.id || 1;
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    const mostSelected = liveData.mostSelected
      ? liveData.mostSelected
          .slice(0, 20)
          .map(
            (p: any) => `${p.web_name}|${p.full_name}|${p.selected_by_percent}%`
          )
          .join("\n")
      : "";

    const enhancedInput = [
      {
        role: "system" as const,
        content: `${SYSTEM_PROMPT}

KOMPAKTNI LIVE PODATCI:

TEAMS: ${JSON.stringify(teams)}

PLAYERS (all 750 players for 100% accuracy - format: id|web_name|full_name|team_id|position|form|points|price|chance_playing|ownership%):
${players}

UPCOMING FIXTURES (format: event|team_h|team_a|kickoff_time):
${upcomingFixtures}

FINISHED FIXTURES (format: GWevent|team_h|team_a|score):
${finishedFixtures}

CURRENT EVENT: ${current_event}
TODAY'S DATE: ${today}

TOP OWNERSHIP (format: web_name|full_name|ownership%):
${mostSelected}

INSTRUKCIJE ZA ČITANJE PODATAKA:
1. Teams objekat: key=team_id, value=team_name (Liverpool=12, Arsenal=1, Man City=13, itd.)
2. Players format: id|web_name|full_name|team_id|position|form|points|price|chance_playing|ownership%
3. UPCOMING fixtures format: event|team_h|team_a|kickoff_time
4. FINISHED fixtures format: GWevent|team_h|team_a|score

KAKO NAĆI SLEDEĆE PROTIVNIKE:
1. Uporedi kickoff_time sa TODAY'S DATE
2. Uzmi samo fixtures gde je kickoff_time >= TODAY'S DATE (budući mečevi)  
3. Nađi team_id u Teams objektu (npr. Man City = 13)
4. Traži u UPCOMING fixtures gde je team_h=13 ili team_a=13
5. Sortiraj po kickoff_time (hronološki) da dobiješ sledeće mečeve
6. PRVI meč u listi = "sledeći protivnik"

PRIMER za "sledeći protivnik Man City-ja":
- Danas: 2025-09-02
- Fixture: "4|13|15|2025-09-14T14:00:00Z" = Man City vs Newcastle 14. septembra
- Fixture: "5|7|13|2025-09-21T15:00:00Z" = Brighton vs Man City 21. septembra  
- SLEDEĆI = Newcastle (14. september je prvi datum >= danas)

UVEK koristi datum poređenje - ne gađaj!

GAMEWEEK PROCES:
- Pitanje: "koliko bodova Salah prošlo kolo"
- Traži "Salah" u PLAYERS linijama 
- Nađi liniju: "123|Salah|Mohamed Salah|4|3|8.2|..."
- Uzmi prvi broj = 123 
- OBVEZNO odgovori: "PLAYER_SUMMARY_NEEDED:123"
- NIKAD ne odgovaraj sa imenom igrača!

KRITIČNO: 
- Odgovori SAMO na pitanja o Fantasy Premier League sezoni 2025/26
- Ako pitanje nema veze sa FPL-om, reci: "Mogu odgovoriti samo na pitanja o Fantasy Premier League 25/26. Imaš li pitanje o igračima, timovima ili strategiji?"
- Koristi SAMO ove podatke, NIKAD ne izmišljaj rezultate ili utakmice
- NIKAD ne spominji team ID brojeve u odgovorima (npr. "tim ID 15") - koristi samo imena timova
- PROVJERI chance_playing_next_round: ako je 0 ili null, igrač je povriješen i ne može igrati
- NIKAD ne preporučuj povriješene igrače za kapetana ili transfer
- Za gameweek podatke OBVEZNO koristi format: "PLAYER_SUMMARY_NEEDED:123" (samo brojevi!)
- NIKAD ne haluciniraj datume, protivnike ili rezultate - koristi SAMO fixtures podatke
- Za protivnike UVEK koristi step-by-step proces sa fixtures podacima
- Ako nemaš podatke, reci "ne mogu pronaći u trenutnim podacima"`,
      },
      // micro history: only last 2 user/assistant msgs to save tokens
      ...chatHistory.slice(-2),
      { role: "user" as const, content: message },
    ];

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini", // Use stable cheap model
      messages: enhancedInput,
      max_tokens: 300,
      temperature: 0.3
    });

    // No need for tool calls - we already have live data

    let response = completion.choices[0]?.message?.content || "No answer.";
    
    // Log token usage for monitoring
    if (completion.usage) {
      console.log("💰 Token Usage - Main Request:", {
        prompt_tokens: completion.usage.prompt_tokens,
        completion_tokens: completion.usage.completion_tokens,
        total_tokens: completion.usage.total_tokens
      });
    }

    // Check if AI requests player summary
    const summaryMatch = response.match(/PLAYER_SUMMARY_NEEDED:\[?(\d+)\]?/);
    if (summaryMatch) {
      const playerId = parseInt(summaryMatch[1]);
      try {
        const playerSummary: any = await getPlayerSummary(playerId);
        const gameweekData =
          playerSummary.history
            ?.map(
              (h: any) =>
                `GW${h.round}:${h.total_points}pts|${h.minutes}min|${h.goals_scored}g|${h.assists}a`
            )
            .join("\n") || "";

        // Re-run with player summary data
        const summaryInput = [
          {
            role: "system" as const,
            content: `${SYSTEM_PROMPT}

PLAYER GAMEWEEK DATA:
${gameweekData}

Format: GW[round]:[total_points]pts|[minutes]min|[goals]g|[assists]a

Sada odgovori na originalno pitanje koristeći ove gameweek podatke.`,
          },
          { role: "user" as const, content: message },
        ];

        const summaryCompletion = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: summaryInput,
          max_tokens: 250,
          temperature: 0.3
        });

        response =
          summaryCompletion.choices[0]?.message?.content || "No answer.";
          
        // Log token usage for player summary request
        if (summaryCompletion.usage) {
          console.log("💰 Token Usage - Player Summary Request:", {
            prompt_tokens: summaryCompletion.usage.prompt_tokens,
            completion_tokens: summaryCompletion.usage.completion_tokens,
            total_tokens: summaryCompletion.usage.total_tokens
          });
        }
      } catch (error) {
        console.error("Failed to fetch player summary:", error);
        response = "Ne mogu da dohvatim detaljne podatke o igraču trenutno.";
      }
    }

    if (!userApiKey && response !== "No answer.") {
      const userId = session?.user?.id || (await getUserFromRequest(req));
      if (userId) await incrementUserUsage(userId);
    }

    return NextResponse.json({ response });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "Failed to answer" }, { status: 500 });
  }
}
