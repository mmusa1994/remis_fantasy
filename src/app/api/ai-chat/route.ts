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
  getPlayerSummary,
  getUserTeam,
  getUserPicks,
} from "@/lib/fplTools";
import { supabaseServer } from "@/lib/supabase-server";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Direct data fetching - no tools needed

// Enhanced prompt for GPT-5-nano (more explicit than mini)
const SYSTEM_PROMPT = `Ti si Fantasy Premier League ekspert za sezonu 2025/26.

VAŽNO - Koristi SAMO podatke iz konteksta. NIKAD ne izmišljaj informacije.

KAKO ODGOVARATI:
- Odgovori na istom jeziku kao pitanje (hrvatski/srpski/engleski)
- Budi prirodan i prijateljski
- Daj konkretne preporuke bazirane na podacima
- Ako nemaš podatak, reci "ne mogu pronaći u trenutnim podacima"

ŠTO MOŽEŠ:
- Analizirati igrače i preporučiti kapetana
- Pomoći s transferima i strategijom
- Analizirati fixture schedule i difficulty
- Dati savjete o čipovima

PRIMJER DOBROG ODGOVORA:
"Za kapetana bih preporučio Salaha jer ima odličnu formu (8.2) protiv slabog protivnika."

NIKAD ne koristi izraze poput "ne mogu pristupiti vanjskim podacima" - sve što ti treba je u kontekstu.`;

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

    // OBAVEZNO SEKVENCIJALNI FLOW: bootstrap → fixtures → stats → AI odgovor
    let liveData: any = {};
    
    // KORAK 1: Bootstrap-static data (OBAVEZNO)
    console.log("🔄 KORAK 1: Fetching bootstrap-static data...");
    let bootstrapData;
    try {
      bootstrapData = await getBootstrapStatic();
      if (!bootstrapData || !bootstrapData.elements || !bootstrapData.teams) {
        throw new Error("Bootstrap data incomplete - missing elements or teams");
      }
      console.log("✅ KORAK 1 ZAVRŠEN: Bootstrap data loaded successfully");
    } catch (error) {
      console.error("❌ KORAK 1 FAILED:", error);
      return NextResponse.json(
        { error: "Ne mogu dohvatiti osnove FPL podatke (igrači/timovi). Pokušajte ponovo." },
        { status: 503 }
      );
    }

    // KORAK 2: Fixtures data (OBAVEZNO)
    console.log("🔄 KORAK 2: Fetching fixtures data...");
    let fixturesData;
    try {
      fixturesData = await getFixtures();
      if (!fixturesData || !Array.isArray(fixturesData)) {
        throw new Error("Fixtures data invalid or empty");
      }
      console.log("✅ KORAK 2 ZAVRŠEN: Fixtures data loaded successfully");
    } catch (error) {
      console.error("❌ KORAK 2 FAILED:", error);
      return NextResponse.json(
        { error: "Ne mogu dohvatiti raspored utakmica. Pokušajte ponovo." },
        { status: 503 }
      );
    }

    // KORAK 3: Kreiraj mostSelected iz bootstrap podataka
    console.log("🔄 KORAK 3: Creating top ownership data from bootstrap...");
    let mostSelectedData = null;
    try {
      mostSelectedData = bootstrapData.elements
        .sort((a: any, b: any) => parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent))
        .slice(0, 20)
        .map((p: any) => ({
          web_name: p.web_name,
          full_name: `${p.first_name} ${p.second_name}`,
          selected_by_percent: p.selected_by_percent
        }));
      console.log("✅ KORAK 3 ZAVRŠEN: Top ownership data created successfully");
    } catch (error) {
      console.warn("⚠️ KORAK 3 WARNING: Top ownership creation failed:", error);
    }

    // KORAK 3.5: Dohvati sve fixtures za potpunu sezonu
    console.log("🔄 KORAK 3.5: Fetching all season fixtures...");
    let allSeasonFixtures = [];
    try {
      const allFixturesResponse = await fetch("https://fantasy.premierleague.com/api/fixtures/");
      allSeasonFixtures = await allFixturesResponse.json();
      console.log(`✅ KORAK 3.5 ZAVRŠEN: Loaded ${allSeasonFixtures.length} total fixtures`);
    } catch (error) {
      console.error("❌ KORAK 3.5 FAILED: Failed to fetch all fixtures:", error);
      allSeasonFixtures = [];
    }

    // KOMBINOVANJE PODATAKA
    liveData = {
      bootstrap: bootstrapData,
      fixtures: fixturesData,
      allSeasonFixtures: allSeasonFixtures,
      mostSelected: mostSelectedData,
    };
    
    // KORAK 4: Dohvati user team data (ako je user autentificiran i ima manager ID)
    let userTeamData: any = null;
    if (session?.user?.id) {
      console.log("🔄 KORAK 4: Fetching user team data...");
      console.log("🔍 Session user ID:", session.user.id);
      
      try {
        const { data: userData, error: userError } = await supabaseServer
          .from('users')
          .select('manager_id')
          .eq('id', session.user.id)
          .single();

        console.log("🔍 Database lookup result:", { userData, userError });

        if (userError) {
          console.error("❌ Database error:", userError);
          throw userError;
        }

        if (userData?.manager_id) {
          console.log("✅ Manager ID found:", userData.manager_id);
          const current_event = liveData.bootstrap?.events?.find((e: any) => e.is_next)?.id || 1;
          console.log("🔍 Current event:", current_event);
          
          // Try to get picks for current event, fallback to previous events
          let picksData = null;
          for (let eventId = current_event; eventId >= Math.max(1, current_event - 3); eventId--) {
            try {
              console.log(`🔄 Trying picks for GW${eventId}...`);
              picksData = await getUserPicks(userData.manager_id, eventId);
              console.log(`✅ Got picks for GW${eventId}`);
              break;
            } catch (e) {
              console.warn(`⚠️ GW${eventId} picks failed:`, (e as Error).message);
            }
          }

          const [teamData] = await Promise.all([
            getUserTeam(userData.manager_id)
          ]);

          console.log("🔍 Team data fetched:", !!teamData);
          console.log("🔍 Picks data fetched:", !!picksData);

          userTeamData = {
            team: teamData,
            picks: picksData,
            managerId: userData.manager_id
          };
          console.log("✅ KORAK 4 ZAVRŠEN: User team data loaded successfully");
          console.log("🔍 Team data summary:", {
            teamName: teamData?.name || "N/A",
            totalPoints: teamData?.summary_overall_points || 0,
            picksCount: picksData?.picks?.length || 0
          });
        } else {
          console.log("⚠️ KORAK 4 PRESKOČEN: No manager ID found for user:", session.user.id);
        }
      } catch (error) {
        console.error("❌ KORAK 4 FAILED:", error);
      }
    } else {
      console.log("⚠️ KORAK 4 PRESKOČEN: No session or user ID");
    }
    
    console.log("✅ SVI KORACI ZAVRŠENI - AI može da odgovori");

    // Optimizovani podaci - kompaktan format za token efikasnost
    const teams =
      liveData.bootstrap?.teams?.reduce((acc: any, t: any) => {
        acc[t.id] = t.name;
        return acc;
      }, {}) || {};
      
    // Detaljni team strength podaci za analize
    const teamStrengths =
      liveData.bootstrap?.teams
        ?.map((t: any) => 
          `${t.id}|${t.name}|Pos:${t.position}|Str:${t.strength}|AtkH:${t.strength_attack_home}|AtkA:${t.strength_attack_away}|DefH:${t.strength_defence_home}|DefA:${t.strength_defence_away}|Form:${t.win}-${t.draw}-${t.loss}`
        )
        .join("\n") || "";

    // Include all players with optimized format for recommendations
    const players =
      liveData.bootstrap?.elements
        ?.slice(0, 750) // All 750 players for complete accuracy
        ?.map(
          (p: any) =>
            `${p.id}|${p.web_name}|${p.first_name} ${p.second_name}|${teams[p.team] || `Team${p.team}`}|${
              p.element_type === 1 ? 'GK' : 
              p.element_type === 2 ? 'DEF' : 
              p.element_type === 3 ? 'MID' : 'FWD'
            }|Form:${p.form}|Pts:${p.total_points}|£${(p.now_cost/10).toFixed(1)}m|${
              p.chance_of_playing_next_round || 100
            }%fit|Own:${p.selected_by_percent}%|Status:${p.status || 'a'}|News:${p.news || 'None'}`
        )
        .join("\n") || "";

    const upcomingFixtures =
      liveData.allSeasonFixtures
        ?.filter((f: any) => f.finished !== true)
        .sort((a: any, b: any) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime()) // Sort by kickoff time
        .slice(0, 30)
        .map((f: any) => {
          const homeTeam = teams[f.team_h] || `Team${f.team_h}`;
          const awayTeam = teams[f.team_a] || `Team${f.team_a}`;
          const date = f.kickoff_time ? f.kickoff_time.split('T')[0] : 'TBD';
          const kickoffTime = f.kickoff_time ? f.kickoff_time : 'No time';
          return `GW${f.event}: ${homeTeam} vs ${awayTeam} (${date})|KO:${kickoffTime}|ID:${f.id}`;
        })
        .join("\n") || "";

    const finishedFixtures =
      liveData.allSeasonFixtures
        ?.filter((f: any) => f.finished === true)
        .sort((a: any, b: any) => a.event - b.event) // Sort by gameweek
        .map((f: any) => {
          const homeTeam = teams[f.team_h] || `Team${f.team_h}`;
          const awayTeam = teams[f.team_a] || `Team${f.team_a}`;
          const date = f.kickoff_time ? f.kickoff_time.split('T')[0] : 'TBD';
          const kickoffTime = f.kickoff_time ? f.kickoff_time : 'No time';
          return `GW${f.event}|${homeTeam}|${awayTeam}|${f.team_h_score}-${f.team_a_score}|${date}|KO:${kickoffTime}|ID:${f.id}`;
        })
        .join("\n") || "";

    // Debug log za finished fixtures
    console.log(`🔍 DEBUG: Found ${liveData.allSeasonFixtures?.filter((f: any) => f.finished)?.length || 0} finished fixtures`);
    console.log(`🔍 DEBUG: First 5 finished fixtures:`, finishedFixtures.split('\n').slice(0, 5));

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

    // Pripremi user team podatke ako postoje
    let userTeamInfo = "";
    if (userTeamData?.team) {
      const teamName = userTeamData.team.name || "Unknown";
      const totalPoints = userTeamData.team.summary_overall_points || 0;
      const rank = userTeamData.team.summary_overall_rank || "N/A";
      const value = (userTeamData.team.value || 0) / 10; // Convert to £millions
      const bank = (userTeamData.team.bank || 0) / 10; // Convert to £millions
      
      let currentPicks = "No recent picks available";
      if (userTeamData?.picks?.picks) {
        currentPicks = userTeamData.picks.picks
          ?.map((pick: any) => {
            const player = liveData.bootstrap.elements?.find((p: any) => p.id === pick.element);
            return player ? `${player.web_name}${pick.is_captain ? '(C)' : pick.is_vice_captain ? '(VC)' : ''}` : `ID:${pick.element}`;
          })
          .join(", ") || "No picks data";
      }

      userTeamInfo = `

USER TEAM INFO:
Team Name: ${teamName}
Total Points: ${totalPoints}
Overall Rank: ${rank}
Team Value: £${value.toFixed(1)}m
Bank: £${bank.toFixed(1)}m
Current Squad: ${currentPicks}
Manager ID: ${userTeamData.managerId}

CRITICAL: This user has shared their actual FPL team data. Give specific analysis of their team and personalized recommendations.`;

      console.log("🔍 UserTeamInfo created:", userTeamInfo.length, "characters");
      console.log("🔍 UserTeamInfo preview:", userTeamInfo.substring(0, 200) + "...");
    }

    const enhancedInput = [
      {
        role: "system" as const,
        content: `${SYSTEM_PROMPT}

LIVE DATA:
Teams: ${JSON.stringify(teams)}
Team Strengths: ${teamStrengths}
Players: ${players}
Upcoming: ${upcomingFixtures}
All Season Results: ${finishedFixtures}
Event: ${current_event} | Date: ${today}
Top: ${mostSelected}${userTeamInfo}

FORMAT:
- Players: id|web_name|full_name|team|pos|Form:X.X|Pts:XX|£X.Xm|XX%fit|Own:X.X%|Status:x|News:injury_info
- Team Strengths: id|name|Pos:position|Str:strength|AtkH:attack_home|AtkA:attack_away|DefH:defence_home|DefA:defence_away|Form:W-D-L
- Upcoming: "GW4: Liverpool vs Arsenal (2025-09-14)|KO:2025-09-14T14:00:00Z|ID:25" format
- Results: "GW3|Arsenal|Brighton|2-1|2025-08-31|KO:2025-08-31T14:00:00Z|ID:15" format

FIXTURE DATA VALIDATION:
- GW number from "event" field (GW1 = event:1)
- KO (kickoff) time for exact scheduling 
- ID for unique fixture identification
- finished:true = completed match, finished:false = upcoming
- Compare kickoff_time with current time to determine if match is past/future

PLAYER DATA INTERPRETATION:
- Status: "a"=Available, "i"=Injured, "d"=Doubtful, "s"=Suspended
- News: Contains injury/suspension details (e.g. "Groin Injury - Expected back 13 Sep")
- XX%fit: Chance of playing next round (0% = definitely out, 100% = fully fit)

TEAM STRENGTH INTERPRETATION:
- Pos: Current league position (1=1st, 20=20th)
- Str: Overall strength rating (1-5, higher = stronger)
- AtkH/AtkA: Attack strength home/away (1050-1380, higher = better attack)
- DefH/DefA: Defence strength home/away (1050-1380, higher = better defence)
- Form: Season record (wins-draws-losses)
- Use for fixture difficulty: Higher opponent strength = harder fixture

READING PLAYER DATA:
Example: "531|Ballard|Daniel Ballard|Sunderland|DEF|Form:6.0|Pts:18|£4.6m|0%fit|Own:4.0%|Status:i|News:Groin Injury - Expected back 13 Sep"
- Form:6.0 = recent form (higher is better)
- £4.6m = current price
- 0%fit = injured (0% chance of playing)
- Status:i = injured
- News = injury details and expected return date

PLAYER POSITIONS (CRITICAL):
- GK = Goalkeeper
- DEF = Defender (backs, centre-backs, wing-backs)
- MID = Midfielder (central midfielders, wingers, attacking midfielders)
- FWD = Forward (strikers, centre-forwards)

NEVER suggest players from wrong positions! If asked for defenders, ONLY suggest players with "DEF" position. If asked for midfielders, ONLY suggest players with "MID" position.

KAKO NAĆI SLJEDEĆEG PROTIVNIKA:
1. Traži tim u UPCOMING fixtures listi
2. Uzmi PRVI fixture s datumom >= ${today}
3. To je sljedeći protivnik

PRIMER:
Pitanje: "Protiv koga igra Burnley?"
1. Traži "Burnley" u fixtures
2. Nađi: "GW4: Burnley vs Liverpool (2025-09-14)"
3. Datum 2025-09-14 >= ${today} = DA
4. Odgovor: "Burnley igra protiv Liverpool u GW4"

🚨 ABSOLUTE ZERO HALLUCINATION POLICY 🚨

CRITICAL RULES - NEVER HALLUCINATE:
1. ONLY use data from "All Season Results" and "Players" sections - ZERO exceptions
2. If asked about team fixtures: Search "All Season Results" line by line for EXACT team name
3. If team not found in "All Season Results": Say "No matches found for [team] in current data"
4. NEVER invent scores, dates, opponents, or player teams - ONLY use provided data
5. For player recommendations: Check player's team in "Players" section - NEVER assume
6. Before mentioning any player: VERIFY their team from "Players" data
7. If asked about non-existent team: Say "[Team] not found in Premier League data"
8. Match language of question (Croatian/Serbian/English)

FIXTURE ANALYSIS PROCESS (MANDATORY):
1. User asks about Team X fixtures
2. Search "All Season Results" for EVERY line containing "Team X" - check both home and away
3. CRITICAL FORMAT: "GW2|HomeTeam|AwayTeam|HomeScore-AwayScore|Date|KO:kickoff_time|ID:fixture_id"
4. NEVER reverse team positions - EXACT format from data
5. Example: "GW2|Arsenal|Leeds|5-0|2025-08-23|KO:2025-08-23T14:00:00Z|ID:15" = Arsenal (home) beat Leeds (away) 5-0
6. Sort by GW number (event field) for chronological order
7. Use kickoff_time to verify match timing vs current date
8. If zero matches found: "No finished matches found for Team X in current data"
9. NEVER guess or assume missing fixtures

TIMING VALIDATION:
- Compare kickoff_time with current date/time
- finished:true = match completed
- finished:false = match upcoming
- Use EXACT kickoff_time for scheduling questions

SCORE INTERPRETATION RULES:
- "GW2|Arsenal|Leeds|5-0" means Arsenal 5-0 Leeds (Arsenal won)
- "GW3|Leeds|Newcastle|0-0" means Leeds 0-0 Newcastle (draw)
- NEVER swap home/away teams from the data format
- First team listed is HOME team, second is AWAY team

PLAYER ANALYSIS PROCESS (MANDATORY):
1. User asks about specific player (e.g. "Dan Ballard")
2. Search "Players" section for exact name match
3. Extract ALL available data from player entry:
   - Price: now_cost ÷ 10 (e.g. 46 = £4.6m)
   - Team: use team name from teams mapping
   - Position: element_type (1=GK, 2=DEF, 3=MID, 4=FWD)
   - Form: form value (higher = better)
   - Total points: total_points
   - Injury status: check "news" field and "status" field
   - Ownership: selected_by_percent
4. For injury status: 
   - status="i" = Injured
   - status="d" = Doubtful  
   - status="s" = Suspended
   - status="a" = Available
   - Check "news" field for injury details
5. Provide comprehensive analysis with ALL extracted data
6. If player not found: "Player not found in current data"

TEAM ANALYSIS INSTRUCTIONS:
- When asked for comprehensive team analysis, search "All Season Results" for the team name
- ONLY use matches where the team appears in "All Season Results" data
- Count wins/draws/losses ONLY from provided fixture results
- If team has no matches in the data, say "No finished matches found for analysis"
- NEVER assume or invent match results that aren't explicitly listed
- Be honest about data limitations

PLAYER RECOMMENDATION STRATEGY:
- FORM is key metric (higher = better recent performance)
- OWNERSHIP matters for differentials (lower ownership = better differential)
- PRICE efficiency (good form/price ratio)
- FIXTURE DIFFICULTY: Check Team Strengths for opponent analysis
  - vs weak defence (DefH/DefA < 1150) = good for attackers
  - vs weak attack (AtkH/AtkA < 1150) = good for defenders/GK
  - vs strong teams (Str=4-5) = harder fixtures, avoid
  - vs weak teams (Str=1-2) = easier fixtures, target
- Consider position scarcity (premium vs budget options)

FIXTURE DIFFICULTY EXAMPLES:
- Arsenal (AtkH:1350, DefH:1290) vs Burnley (AtkH:1050, DefH:1050) = Easy for Arsenal attackers
- Liverpool (DefA:1380) vs Man City (AtkA:1250) = Hard fixture for both
- Sunderland (Str:2, Def:1050) = Easy opponent for any attackers

VALIDATION EXAMPLES:

CORRECT fixture search:
Q: "Against koga je igrao Leeds?"
A: Search "All Season Results" for "Leeds":
   - Found: "GW1|Leeds|Everton|1-0|2025-08-18" = Leeds beat Everton 1-0
   - Found: "GW2|Arsenal|Leeds|5-0|2025-08-25" = Arsenal beat Leeds 5-0 
   - Found: "GW3|Leeds|Newcastle|0-0|2025-08-31" = Leeds drew with Newcastle 0-0
   - Answer: "Leeds je igrao: vs Everton (1-0 win), vs Arsenal (0-5 loss), vs Newcastle (0-0 draw)"

CORRECT player analysis:
Q: "Dan Ballard da li je dobar izbor?"
A: Search "Players" for "Ballard":
   Found: "531|Ballard|Daniel Ballard|Sunderland|DEF|Form:6.0|Pts:18|£4.6m|0%fit|Own:4.0%"
   Extract: price=46/10=£4.6m, team=Sunderland, position=DEF, form=6.0, points=18, status=i, news="Groin Injury - Expected back 13 Sep"
   Answer: "Dan Ballard (£4.6m, Sunderland DEF) - Form 6.0, 18 bodova, ali je trenutno povrijeđen (groin injury) do 13. septembra. Nije dobar izbor dok se ne oporavi."

NEVER DO THIS (HALLUCINATION):
❌ "Leeds je igrao protiv Everton, Newcastle, Fulham"
❌ "Wood igra za Leeds" (Wood igra za Nott'm Forest)
❌ Izmišljanje rezultata koji nisu u "All Season Results"

EXAMPLE good recommendation:
"**Mbeumo** (£7.2m, Brentford) - Form 8.5, only 15% owned, excellent differential"`,
      },
      // micro history: only last 2 user/assistant msgs to save tokens
      ...chatHistory.slice(-2),
      { role: "user" as const, content: message },
    ];

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini", // Reliable model that works
      messages: enhancedInput,
      max_tokens: 400,
      temperature: 0.3
    });

    // No need for tool calls - we already have live data

    let response = completion.choices[0]?.message?.content || "No answer.";
    
    // Debug what AI actually returned
    console.log("🤖 AI Raw Response:", {
      choices: completion.choices?.length,
      hasContent: !!completion.choices[0]?.message?.content,
      contentLength: completion.choices[0]?.message?.content?.length,
      actualContent: completion.choices[0]?.message?.content?.substring(0, 200)
    });

    // Fallback to gpt-4o-mini if nano returns empty response
    if (!response || response.trim() === "" || response === "No answer.") {
      console.log("🔄 GPT-5-nano failed, falling back to gpt-4o-mini...");
      try {
        const fallbackCompletion = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: enhancedInput,
          max_tokens: 300,
          temperature: 0.3
        });
        
        response = fallbackCompletion.choices[0]?.message?.content || "No answer.";
        
        console.log("✅ Fallback successful:", {
          hasContent: !!response,
          contentLength: response.length
        });
        
        if (fallbackCompletion.usage) {
          console.log("💰 Token Usage - Fallback Request:", {
            prompt_tokens: fallbackCompletion.usage.prompt_tokens,
            completion_tokens: fallbackCompletion.usage.completion_tokens,
            total_tokens: fallbackCompletion.usage.total_tokens
          });
        }
      } catch (fallbackError) {
        console.error("❌ Fallback also failed:", fallbackError);
        response = "Izvinjavam se, imao sam tehnički problem. Molim pokušajte ponovo.";
      }
    }
    
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

GW DATA: ${gameweekData}
Format: GW[round]:pts|min|goals|assists

Answer original question using this data.`,
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
