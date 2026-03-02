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
import {
  getBootstrapStatic,
  getFixtures,
  getPlayerSummary,
  getUserTeam,
  getUserPicks,
  getTeamHistory,
} from "@/lib/fplTools";
import { supabaseServer } from "@/lib/supabase-server";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Direct data fetching - no tools needed

// ZERO HALLUCINATION FLOW - Only bootstrap-static + fixtures + optional user team

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

    // SEASON 2025/26 VALIDATION
    const seasonKeywords = [
      "2024",
      "2023",
      "2022",
      "2021",
      "prošla sezona",
      "last season",
      "previous season",
      "historical",
    ];
    const isOtherSeason = seasonKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword.toLowerCase())
    );

    if (isOtherSeason) {
      const response =
        message.includes("Croatian") ||
        message.includes("hrvatski") ||
        message.includes("sezona")
          ? "Izvinjavam se, ja sam stručnjak isključivo za FPL sezonu 2025/26. Molim pitajte o trenutnoj sezoni."
          : "Sorry, I'm an expert exclusively for the 2025/26 FPL season. Please ask about the current season.";
      return NextResponse.json({ response });
    }

    // vocab + validator (validator već radi sve provere)
    const vocab = await loadFplVocab();
    const validation = await validateQuery(message, vocab);
    const routing = route(validation);
    if (routing.action === "clarify")
      return NextResponse.json({ response: routing.message });

    // ZERO HALLUCINATION FLOW: Only bootstrap-static + fixtures + user team

    // STEP 1: Bootstrap-static (MANDATORY - All players & teams with exact IDs)
    let bootstrapData: any;
    try {
      bootstrapData = await getBootstrapStatic();
      if (!bootstrapData?.elements || !bootstrapData?.teams) {
        throw new Error("Bootstrap data incomplete");
      }
    } catch (error) {
      console.error("❌ STEP 1 FAILED:", error);
      return NextResponse.json(
        { error: "Cannot fetch FPL data. Try again." },
        { status: 503 }
      );
    }

    // STEP 2: Fixtures (MANDATORY - Complete season schedule & results)
    let fixturesData: any[];
    try {
      const fixtures = await getFixtures();
      if (!Array.isArray(fixtures)) {
        throw new Error("Fixtures data invalid");
      }
      fixturesData = fixtures;
    } catch (error) {
      console.error("❌ STEP 2 FAILED:", error);
      return NextResponse.json(
        { error: "Cannot fetch fixtures. Try again." },
        { status: 503 }
      );
    }
    // STEP 3: Detailed User Team (my-team + history endpoints)
    let userTeamData: any = null;

    if (session?.user?.id) {
      try {
        const { data: userData, error: userError } = await supabaseServer
          .from("users")
          .select("manager_id")
          .eq("id", session.user.id)
          .single();

        if (!userError && userData?.manager_id) {
          const current_event =
            bootstrapData.events?.find((e: any) => e.is_next)?.id || 1;

          // Try current event first, then fallback to previous events
          let currentPicks = null;
          let actualGW = current_event;

          for (
            let gw = current_event;
            gw >= Math.max(1, current_event - 3);
            gw--
          ) {
            try {
              currentPicks = await getUserPicks(userData.manager_id, gw);
              actualGW = gw;
              break;
            } catch (e) {
              // GW picks failed, try previous
            }
          }

          const [teamHistory, teamInfo] = await Promise.all([
            getTeamHistory(userData.manager_id).catch(() => null),
            getUserTeam(userData.manager_id).catch(() => null),
          ]);

          userTeamData = {
            managerId: userData.manager_id,
            history: teamHistory, // GW by GW history
            info: teamInfo, // Basic team info
            picks: currentPicks, // Current gameweek picks
            currentGW: actualGW, // Actual GW where picks were found
          };
        }
      } catch (error) {
        console.warn("⚠️ STEP 3 WARNING: User team fetch failed:", error);
      }
    }

    // MINIMAL DATA PROCESSING - Only essential information

    // Team ID to name mapping (essential)
    const teams = bootstrapData.teams.reduce((acc: any, t: any) => {
      acc[t.id] = t.name;
      return acc;
    }, {});

    // EXPANDED PLAYER DATABASE - More players for complete answers
    const allPlayers = bootstrapData.elements
      .filter(
        (p: any) =>
          p.total_points >= 3 || // Players with 3+ points (lowered)
          p.now_cost >= 60 || // Players £6m+ (lowered)
          parseFloat(p.form) >= 2.0 || // Decent form players (lowered)
          parseFloat(p.selected_by_percent) >= 2.0 || // 2%+ ownership (lowered)
          p.status !== "a" // Include injured/doubtful players
      )
      .sort((a: any, b: any) => b.total_points - a.total_points)
      .slice(0, 500) // Increased to 500 players for more complete answers
      .map(
        (p: any) =>
          `${p.id}|${p.web_name}|${teams[p.team]}|${
            p.element_type === 1
              ? "GK"
              : p.element_type === 2
              ? "DEF"
              : p.element_type === 3
              ? "MID"
              : "FWD"
          }|${p.form}|${p.total_points}|${(p.now_cost / 10).toFixed(1)}|${
            p.selected_by_percent
          }|${p.status || "a"}`
      )
      .join("\n");

    // Recent fixtures only (limit tokens) - IMPROVED FORMAT
    const completedMatches = fixturesData
      .filter((f: any) => f.finished === true)
      .sort((a: any, b: any) => b.event - a.event)
      .slice(0, 50)
      .map(
        (f: any) =>
          `GW${f.event}: ${teams[f.team_h]} ${f.team_h_score}-${f.team_a_score} ${
            teams[f.team_a]
          } (${teams[f.team_h]} played at home)`
      )
      .join("\n");

    // Next fixtures only - IMPROVED FORMAT WITH CLEAR HOME/AWAY
    const upcomingMatches = fixturesData
      .filter((f: any) => f.finished !== true)
      .sort(
        (a: any, b: any) =>
          new Date(a.kickoff_time).getTime() -
          new Date(b.kickoff_time).getTime()
      )
      .slice(0, 25)
      .map((f: any) => `GW${f.event}: ${teams[f.team_h]} vs ${teams[f.team_a]} (${teams[f.team_h]} home, ${teams[f.team_a]} away)`)
      .join("\n");

    const current_event =
      bootstrapData.events?.find((e: any) => e.is_next)?.id || 1;
    const today = new Date().toISOString().split("T")[0];

    // Detailed User Team Info
    let userTeamInfo = "";

    if (userTeamData?.picks?.picks) {
      // Only require picks, info is optional
      const picks = userTeamData.picks.picks;
      const teamValue = (userTeamData.info?.last_deadline_value || 0) / 10; // Convert to £
      const bank = (userTeamData.info?.last_deadline_bank || 0) / 10;

      // Get squad details with positions
      const squadByPosition = {
        GK: picks.filter((p: any) => {
          const player = bootstrapData.elements.find(
            (e: any) => e.id === p.element
          );
          return player?.element_type === 1;
        }),
        DEF: picks.filter((p: any) => {
          const player = bootstrapData.elements.find(
            (e: any) => e.id === p.element
          );
          return player?.element_type === 2;
        }),
        MID: picks.filter((p: any) => {
          const player = bootstrapData.elements.find(
            (e: any) => e.id === p.element
          );
          return player?.element_type === 3;
        }),
        FWD: picks.filter((p: any) => {
          const player = bootstrapData.elements.find(
            (e: any) => e.id === p.element
          );
          return player?.element_type === 4;
        }),
      };

      const formatPosition = (picks: any[]) => {
        return picks
          .map((pick: any) => {
            const player = bootstrapData.elements.find(
              (e: any) => e.id === pick.element
            );
            if (!player) return `ID:${pick.element}`;
            return `${player.web_name}${
              pick.is_captain ? "(C)" : pick.is_vice_captain ? "(VC)" : ""
            }:£${(player.now_cost / 10).toFixed(1)}m`;
          })
          .join(", ");
      };

      userTeamInfo = `
MOJ TIM (${userTeamData.info?.name || "Unknown"}) - ${
        userTeamData.info?.summary_overall_points || 0
      }pts - GW${userTeamData.currentGW}
Tim vrijednost: £${teamValue.toFixed(1)}m | Banka: £${bank.toFixed(1)}m

GOLMANI (${squadByPosition.GK.length}): ${formatPosition(squadByPosition.GK)}
OBRAMBENI (${squadByPosition.DEF.length}): ${formatPosition(
        squadByPosition.DEF
      )}  
VEZNI (${squadByPosition.MID.length}): ${formatPosition(squadByPosition.MID)}
NAPADI (${squadByPosition.FWD.length}): ${formatPosition(squadByPosition.FWD)}

Transferi napravljeni: ${userTeamData.picks.entry_history?.event_transfers || 0}
Ukupan rank: ${userTeamData.info?.summary_overall_rank || "N/A"}`;

    }

    // FPL 2025/26 EXPERT SYSTEM PROMPT - IMPROVED
    const aiInput = [
      {
        role: "system" as const,
        content: `Ti si FPL stručnjak za sezonu 2025/26. Koristi ISKLJUČIVO podatke ispod - NE izmišljaj ništa!

TIMOVI I ID-ovi: ${JSON.stringify(teams)}

SVIH ${allPlayers.split("\n").length} IGRAČA (id|ime|tim|pozicija|forma|bodovi|cijena|vlasništvo%|status):
${allPlayers}

REZULTATI MEČEVA (format: "GW: Tim1 2-1 Tim2 (Tim1 played at home)"):
${completedMatches.split("\n").slice(0, 15).join("\n")}

SLEDEĆI MEČEVI (format: "GW: Tim1 vs Tim2 (Tim1 home, Tim2 away)"):
${upcomingMatches.split("\n").slice(0, 12).join("\n")}

TRENUTNO KOLO: GW${current_event} | Datum: ${today}${
          userTeamInfo ? "\n\nKORISNIKOV TIM:\n" + userTeamInfo.substring(0, 500) : ""
        }

KLJUČNA PRAVILA:
1. Cijena igrača = polje 7 u formatu (£X.Xm) 
2. Koristi SAMO igrače iz gornje liste - ako nema igrača, reci "nije u bazi"
3. Za fixtures: Tim1 home = domaćin, Tim2 away = gost
4. NE izmišljaj rezultate, protivnike ili podatke
5. Burnley se možda NIJE kvalificirao za 2025/26 - provjeri da li je u timovima!
6. Za pitanja o "idućem kolu" - koristi SLEDEĆI MEČEVI sekciju`,
      },
      ...chatHistory.slice(-2),
      { role: "user" as const, content: message },
    ];

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: aiInput,
      max_tokens: 800,
      temperature: 0.7,
    });

    // No need for tool calls - we already have live data

    let response = completion.choices[0]?.message?.content || "No answer.";

    // Fallback to gpt-4o-mini if nano returns empty response
    if (!response || response.trim() === "" || response === "No answer.") {
      try {
        const fallbackCompletion = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: aiInput,
          max_tokens: 800,
          temperature: 0.7,
        });

        response =
          fallbackCompletion.choices[0]?.message?.content || "No answer.";

      } catch (fallbackError) {
        console.error("❌ Fallback also failed:", fallbackError);
        response =
          "Izvinjavam se, imao sam tehnički problem. Molim pokušajte ponovo.";
      }
    }

    // Enforce 50k token limit
    if (completion.usage && completion.usage.total_tokens > 50000) {
      return NextResponse.json(
        {
          error:
            "Request too large. Please try a simpler question or break it into multiple parts.",
        },
        { status: 413 }
      );
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
            content: `Ti si FPL ekspert. Koristi podatke ispod za odgovor.

GAMEWEEK DATA: ${gameweekData}
Format: GW[round]:pts|min|goals|assists

Odgovori na pitanje koristeći ove podatke.`,
          },
          { role: "user" as const, content: message },
        ];

        const summaryCompletion = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: summaryInput,
          max_tokens: 250,
          temperature: 0.7,
        });

        response =
          summaryCompletion.choices[0]?.message?.content || "No answer.";

      } catch (error) {
        console.error("Failed to fetch player summary:", error);
        response = "Ne mogu da dohvatim detaljne podatke o igraču trenutno.";
      }
    }

    // Increment usage for successful responses (except when using own API key)
    if (!userApiKey && response && response.trim() !== "" && response !== "No answer.") {
      const userId = session?.user?.id || (await getUserFromRequest(req));
      if (userId) {
        await incrementUserUsage(userId);
      }
    }

    return NextResponse.json({ response });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "Failed to answer" }, { status: 500 });
  }
}
