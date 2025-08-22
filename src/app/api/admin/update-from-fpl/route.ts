import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { supabase } from "@/lib/supabase";

const LEAGUE_CONFIGS = {
  premium: { id: 277005, type: "standings", url_suffix: "standings/c" },
  h2h: { id: 277479, type: "h2h", url_suffix: "standings/h" },
  standard: { id: 277449, type: "standings", url_suffix: "standings/c" },
  // h2h2: { id: 451227, type: "h2h", url_suffix: "standings/h" }, // Liga ne postoji
} as const;

type LeagueType = keyof typeof LEAGUE_CONFIGS;

interface FPLPlayer {
  rank: number;
  entry: number;
  player_name: string;
  entry_name: string;
  total: number;
  points_for?: number;
  matches_won?: number;
  matches_drawn?: number;
  matches_lost?: number;
}

interface DatabasePlayer {
  id: string;
  first_name: string;
  last_name: string;
  team_name: string;
  email: string;
  league_type: string;
  points: number;
  h2h_points?: number;
  h2h_category?: string;
}

async function fetchFPLLeagueData(
  leagueId: number,
  type: string,
  maxPlayers: number = 150
): Promise<FPLPlayer[]> {
  const isH2H = type === "h2h";
  const baseUrl = isH2H
    ? `https://fantasy.premierleague.com/api/leagues-h2h/${leagueId}/standings/`
    : `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`;

  const players: FPLPlayer[] = [];
  let currentPage = 1;

  try {
    console.log(
      `[FPL-SYNC] Fetching league ${leagueId}, type: ${type}, max: ${maxPlayers}`
    );
    console.log(`[FPL-SYNC] Using URL: ${baseUrl}`);

    while (players.length < maxPlayers) {
      const url = `${baseUrl}?page_standings=${currentPage}`;
      console.log(`[FPL-SYNC] Fetching page ${currentPage}: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      if (!response.ok) {
        console.error(`[FPL-SYNC] API Error: ${response.status} ${response.statusText}`);
        throw new Error(
          `FPL API returned ${response.status} for league ${leagueId}, page ${currentPage}`
        );
      }

      const data = await response.json();
      console.log(`[FPL-SYNC] Response structure for ${type}:`, {
        hasStandings: !!data.standings,
        hasResults: !!data.results,
        standingsResults: data.standings?.results?.length || 0,
        directResults: data.results?.length || 0
      });
      
      let pageResults: FPLPlayer[] = [];
      
      if (isH2H) {
        // For H2H, results are in standings.results (not direct results)
        pageResults = data.standings?.results || [];
      } else {
        // For classic leagues, results are in standings.results
        pageResults = data.standings?.results || [];
      }

      if (!pageResults.length) {
        console.log(`[FPL-SYNC] No more results on page ${currentPage}`);
        break;
      }

      players.push(...pageResults);
      console.log(
        `[FPL-SYNC] Page ${currentPage}: ${pageResults.length} players (total: ${players.length})`
      );

      // Check if we have more pages to fetch
      if (pageResults.length < 50 || players.length >= maxPlayers) {
        break;
      }

      currentPage++;
    }

    const finalPlayers = players.slice(0, maxPlayers);
    console.log(
      `[FPL-SYNC] League ${leagueId} completed: ${finalPlayers.length}/${players.length} players`
    );

    return finalPlayers;
  } catch (error) {
    console.error(`[FPL-SYNC] Error fetching league ${leagueId}:`, error);
    throw error;
  }
}

function normalizeString(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    .replace(/[ćč]/g, "c")
    .replace(/[žz]/g, "z")
    .replace(/[šs]/g, "s")
    .replace(/[đd]/g, "d")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}

async function syncPlayersToDatabase(
  leagueType: LeagueType,
  fplPlayers: FPLPlayer[]
) {
  console.log(
    `[FPL-SYNC] Starting database sync for ${leagueType} with ${fplPlayers.length} FPL players`
  );

  const { data: dbPlayers, error: fetchError } = await supabase
    .from("premier_league_25_26")
    .select("*")
    .is("deleted_at", null);

  if (fetchError) {
    console.error(`[FPL-SYNC] Database fetch error:`, fetchError);
    throw new Error(`Database fetch error: ${fetchError.message}`);
  }

  console.log(`[FPL-SYNC] Found ${dbPlayers?.length || 0} database players`);

  const updates: Array<{ id: string; data: any }> = [];
  const matches: Array<{ fpl: FPLPlayer; db: DatabasePlayer }> = [];
  const notFound: string[] = [];

  for (const fplPlayer of fplPlayers) {
    const normalizedFPLName = normalizeString(fplPlayer.player_name);
    const normalizedFPLTeam = normalizeString(fplPlayer.entry_name);

    console.log(
      `[FPL-SYNC] Looking for match: "${fplPlayer.player_name}" (${fplPlayer.entry_name})`
    );

    const dbPlayer = dbPlayers?.find((player: DatabasePlayer) => {
      const normalizedDBName = normalizeString(
        `${player.first_name} ${player.last_name}`
      );
      const normalizedDBTeam = normalizeString(player.team_name);

      // Match by name or team
      const nameMatch = normalizedDBName === normalizedFPLName;
      const teamMatch = normalizedDBTeam === normalizedFPLTeam;
      const partialMatch =
        normalizedDBName.includes(normalizedFPLName.split(" ")[0]) &&
        normalizedDBTeam === normalizedFPLTeam;

      if (nameMatch || teamMatch || partialMatch) {
        console.log(
          `[FPL-SYNC] MATCH FOUND: ${player.first_name} ${player.last_name} (${
            player.team_name
          }) - Type: ${nameMatch ? "name" : teamMatch ? "team" : "partial"}`
        );
        return true;
      }

      return false;
    });

    if (dbPlayer) {
      const updateData: any = {
        points: fplPlayer.total,
        last_points_update: new Date().toISOString(),
      };

      // Add H2H data if applicable
      if (leagueType === "h2h") {
        // Za H2H: 
        // - points = overall FPL points (total) -> 83
        // - h2h_points = H2H league points (total from H2H standings) -> 3
        updateData.h2h_points = fplPlayer.total || 0; // H2H league points (3)
        updateData.h2h_category = leagueType;
        updateData.h2h_stats = {
          w: fplPlayer.matches_won || 0,
          d: fplPlayer.matches_drawn || 0,
          l: fplPlayer.matches_lost || 0,
        };
        // points ostaju overall FPL points (points_for je 83)
        updateData.points = fplPlayer.points_for || 0; // Overall points (83)
        console.log(`[FPL-SYNC] H2H data for ${fplPlayer.player_name}: Overall:${fplPlayer.points_for} H2H:${fplPlayer.total} W${fplPlayer.matches_won} D${fplPlayer.matches_drawn} L${fplPlayer.matches_lost}`);
      }

      // League type filter for standings leagues
      const shouldUpdate =
        leagueType === "h2h" ||
        (leagueType === "premium" && dbPlayer.league_type === "premium") ||
        (leagueType === "standard" && dbPlayer.league_type === "standard");

      if (shouldUpdate) {
        updates.push({ id: dbPlayer.id, data: updateData });
        matches.push({ fpl: fplPlayer, db: dbPlayer });
        console.log(
          `[FPL-SYNC] Will update: ${dbPlayer.first_name} ${dbPlayer.last_name} (${dbPlayer.team_name})`
        );
      } else {
        console.log(
          `[FPL-SYNC] Skipping player (wrong league): ${dbPlayer.first_name} ${dbPlayer.last_name} (db: ${dbPlayer.league_type}, sync: ${leagueType})`
        );
      }
    } else {
      notFound.push(`${fplPlayer.player_name} (${fplPlayer.entry_name})`);
      console.log(
        `[FPL-SYNC] No match found for: ${fplPlayer.player_name} (${fplPlayer.entry_name})`
      );
    }
  }

  console.log(`[FPL-SYNC] Prepared ${updates.length} updates`);

  // Execute updates
  let updateSuccess = 0;
  let updateErrors = 0;

  for (const update of updates) {
    try {
      const { error } = await supabase
        .from("premier_league_25_26")
        .update(update.data)
        .eq("id", update.id);

      if (error) {
        console.error(`[FPL-SYNC] Update error for ${update.id}:`, error);
        updateErrors++;
      } else {
        updateSuccess++;
      }
    } catch (error) {
      console.error(
        `[FPL-SYNC] Unexpected error updating ${update.id}:`,
        error
      );
      updateErrors++;
    }
  }

  console.log(
    `[FPL-SYNC] Database sync completed: ${updateSuccess} successful, ${updateErrors} errors`
  );

  return {
    totalFPLPlayers: fplPlayers.length,
    matchedPlayers: matches.length,
    updatedPlayers: updateSuccess,
    updateErrors,
    notFoundPlayers: notFound,
    matches: matches.map((m) => {
      // Pravilno mapiranje poena za različite tipove liga
      const isH2HLeague = leagueType === "h2h";
      
      return {
        rank: m.fpl.rank,
        fplName: m.fpl.player_name,
        fplTeam: m.fpl.entry_name,
        fplPoints: isH2HLeague ? m.fpl.points_for : m.fpl.total, // Overall FPL points
        fplH2HPoints: isH2HLeague ? m.fpl.total : undefined, // H2H league points
        dbId: m.db.id,
        dbName: `${m.db.first_name} ${m.db.last_name}`,
        dbTeam: m.db.team_name,
        dbEmail: m.db.email,
        oldPoints: m.db.points,
        oldH2HPoints: m.db.h2h_points,
        pointsDiff: isH2HLeague 
          ? (m.fpl.points_for || 0) - (m.db.points || 0)
          : m.fpl.total - (m.db.points || 0),
        h2hPointsDiff: isH2HLeague 
          ? (m.fpl.total || 0) - (m.db.h2h_points || 0)
          : undefined,
        h2hStats: isH2HLeague ? {
          w: m.fpl.matches_won || 0,
          d: m.fpl.matches_drawn || 0,
          l: m.fpl.matches_lost || 0
        } : undefined
      };
    }),
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log(`[FPL-SYNC] Request body:`, body);

    const { leagueType } = body;

    if (!leagueType || !LEAGUE_CONFIGS[leagueType as LeagueType]) {
      return NextResponse.json(
        {
          error: "Invalid or missing leagueType",
          validTypes: Object.keys(LEAGUE_CONFIGS),
          received: leagueType,
        },
        { status: 400 }
      );
    }

    const config = LEAGUE_CONFIGS[leagueType as LeagueType];
    console.log(`[FPL-SYNC] Processing league: ${leagueType}`, config);

    try {
      // Fetch FPL data
      const fplPlayers = await fetchFPLLeagueData(config.id, config.type, 150);

      if (!fplPlayers || fplPlayers.length === 0) {
        return NextResponse.json(
          {
            error: "No players fetched from FPL API",
            leagueType,
            leagueId: config.id,
          },
          { status: 500 }
        );
      }

      // Sync to database
      const syncResult = await syncPlayersToDatabase(
        leagueType as LeagueType,
        fplPlayers
      );

      return NextResponse.json({
        success: true,
        leagueType,
        leagueId: config.id,
        leagueApiType: config.type,
        timestamp: new Date().toISOString(),
        ...syncResult,
        message: `Successfully processed ${leagueType} league: ${syncResult.updatedPlayers} players updated`,
      });
    } catch (error) {
      console.error(`[FPL-SYNC] Error processing league ${leagueType}:`, error);
      return NextResponse.json(
        {
          error: `Failed to process ${leagueType} league`,
          details: error instanceof Error ? error.message : "Unknown error",
          leagueType,
          leagueId: config.id,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[FPL-SYNC] Fatal error:", error);
    return NextResponse.json(
      {
        error: "FPL sync failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
