import { request } from "undici";

export type FplVocab = {
  seasonLabel: string; // "2025/26"
  teams: string[]; // ["Arsenal", "Chelsea", ...]
  players: string[]; // ["Erling Haaland", ...]
  positions: string[]; // ["GK","DEF","MID","FWD"]
  stats: string[]; // ["ict_index","bps","influence",...]
  events: { id: number; name: string; deadline_time: string }[];
  genericTerms: string[]; // stable FPL words: "wildcard","differentials","captaincy","GW",...
  currentGameweek: number;
  nextFixtures: any[];
  playerTeams: { [playerName: string]: string }; // Maps player names to current teams
  transfers: { player: string; from: string; to: string; date: string }[]; // Recent transfers
  playerData: any[]; // Full player data with stats, prices, ownership
  dreamTeam: any[]; // Current gameweek's dream team
  topPlayers: any; // Top players by various stats
  getPlayerHistory: (playerName: string) => Promise<any[]>; // Function to get detailed player history
};

export async function loadFplVocab(): Promise<FplVocab> {
  const base = "https://fantasy.premierleague.com/api";

  try {
    const [bs, fixtures] = await Promise.all([
      fetchJson(`${base}/bootstrap-static/`), // teams, players (elements), events, element_types, stat labels
      fetchJson(`${base}/fixtures/`), // basic fixture meta
    ]);

    // Try to get additional data
    const [dreamTeam] = await Promise.all([
      fetchJson(`${base}/dream-team/1/`).catch(() => []), // Current gameweek dream team
    ]);

    const bootstrapData = bs as any;
    const teams = (bootstrapData.teams ?? [])
      .map((t: any) => t.name)
      .filter(Boolean);
    const elements = bootstrapData.elements ?? [];
    const players = elements.map((e: any) => e.web_name).filter(Boolean);
    const positions = (bootstrapData.element_types ?? []).map(
      (t: any) => t.singular_name_short
    ); // GK/DEF/MID/FWD
    const statLabels = (bootstrapData.element_stats ?? []).map(
      (s: any) => s.name
    ); // e.g. bps, ict_index
    const events = (bootstrapData.events ?? []).map((e: any) => ({
      id: e.id,
      name: e.name,
      deadline_time: e.deadline_time,
    }));

    // Create player to team mapping
    const teamsById = Object.fromEntries(
      (bootstrapData.teams ?? []).map((t: any) => [t.id, t.name])
    );
    const playerTeams: { [playerName: string]: string } = {};
    elements.forEach((player: any) => {
      if (player.web_name && player.team && teamsById[player.team]) {
        playerTeams[player.web_name] = teamsById[player.team];
      }
    });

    // derive season label from the first/last event deadlines (best-effort)
    const first = events[0]?.deadline_time?.slice(0, 4);
    const last = events.at(-1)?.deadline_time?.slice(0, 4);
    const seasonLabel =
      first && last ? `${first}/${String(Number(last)).slice(-2)}` : "2025/26";

    const genericTerms = [
      "fpl",
      "premier league",
      "gameweek",
      "gw",
      "captain",
      "captaincy",
      "vice-captain",
      "wildcard",
      "free hit",
      "bench boost",
      "triple captain",
      "price rise",
      "price drop",
      "bps",
      "bonus",
      "ict index",
      "xg",
      "xa",
      "fixtures",
      "fixture difficulty",
      "differential",
      "value",
      "expected",
      "transfer",
      "chip",
      "rank",
      "mini-league",
      "effective ownership",
    ];

    // Find current gameweek
    const now = new Date();
    const currentEvent = events.find(
      (e: any) => new Date(e.deadline_time) > now
    );
    const currentGameweek = currentEvent?.id || 1;

    // Get next 3 gameweeks of fixtures
    const upcomingEvents = events
      .filter((e: any) => e.id >= currentGameweek)
      .slice(0, 3);
    const nextFixtures = (fixtures as any[])
      .filter((f: any) => upcomingEvents.some((e: any) => e.id === f.event))
      .slice(0, 30); // Limit to 30 fixtures to avoid too much data

    // Add fixture team names
    const enhancedFixtures = nextFixtures.map((fixture: any) => ({
      ...fixture,
      team_h_name: teamsById[fixture.team_h],
      team_a_name: teamsById[fixture.team_a],
    }));

    // Get top players by various metrics
    const topPlayersByPrice = elements
      .sort((a: any, b: any) => b.now_cost - a.now_cost)
      .slice(0, 10)
      .map((p: any) => ({
        name: p.web_name,
        team: teamsById[p.team],
        price: p.now_cost / 10,
        position: positions[p.element_type - 1],
      }));

    const topPlayersByOwnership = elements
      .sort((a: any, b: any) => b.selected_by_percent - a.selected_by_percent)
      .slice(0, 10)
      .map((p: any) => ({
        name: p.web_name,
        team: teamsById[p.team],
        ownership: p.selected_by_percent,
        position: positions[p.element_type - 1],
      }));

    const topPlayersByPoints = elements
      .sort((a: any, b: any) => b.total_points - a.total_points)
      .slice(0, 10)
      .map((p: any) => ({
        name: p.web_name,
        team: teamsById[p.team],
        points: p.total_points,
        position: positions[p.element_type - 1],
      }));

    // Enhanced player data with key stats
    const playerData = elements.map((player: any) => ({
      name: player.web_name,
      team: teamsById[player.team],
      position: positions[player.element_type - 1],
      price: player.now_cost / 10,
      total_points: player.total_points,
      selected_by_percent: player.selected_by_percent,
      form: player.form,
      points_per_game: player.points_per_game,
      ict_index: player.ict_index,
      influence: player.influence,
      creativity: player.creativity,
      threat: player.threat,
      goals_scored: player.goals_scored,
      assists: player.assists,
      clean_sheets: player.clean_sheets,
      goals_conceded: player.goals_conceded,
      saves: player.saves,
    }));

    // For now, return empty transfers array - you can enhance this later with transfer data
    const transfers: {
      player: string;
      from: string;
      to: string;
      date: string;
    }[] = [];

    // Create function to get player history
    const getPlayerHistory = async (playerName: string): Promise<any[]> => {
      try {
        // Find player ID by name
        const player = elements.find(
          (p: any) =>
            p.web_name.toLowerCase() === playerName.toLowerCase() ||
            p.first_name.toLowerCase() + " " + p.second_name.toLowerCase() ===
              playerName.toLowerCase()
        );

        if (!player) return [];

        // Fetch player history
        const historyData = await fetchJson(
          `${base}/element-summary/${player.id}/`
        ) as any;
        return historyData?.history || [];
      } catch (error) {
        console.error("Error fetching player history:", error);
        return [];
      }
    };

    return {
      seasonLabel,
      teams,
      players,
      positions,
      stats: statLabels,
      events,
      genericTerms,
      currentGameweek,
      nextFixtures: enhancedFixtures,
      playerTeams,
      transfers,
      playerData,
      dreamTeam: (dreamTeam as any[]) || [],
      topPlayers: {
        byPrice: topPlayersByPrice,
        byOwnership: topPlayersByOwnership,
        byPoints: topPlayersByPoints,
      },
      getPlayerHistory,
    };
  } catch (error) {
    console.error("Error loading FPL vocab:", error);
    // Return minimal fallback data
    return {
      seasonLabel: "2025/26",
      teams: [],
      players: [],
      positions: ["GK", "DEF", "MID", "FWD"],
      stats: [],
      events: [],
      genericTerms: [],
      currentGameweek: 1,
      nextFixtures: [],
      playerTeams: {},
      transfers: [],
      playerData: [],
      dreamTeam: [],
      topPlayers: { byPrice: [], byOwnership: [], byPoints: [] },
      getPlayerHistory: async () => [],
    };
  }
}

async function fetchJson(url: string) {
  const res = await request(url, { method: "GET" });
  if (res.statusCode! >= 400)
    throw new Error(`Fetch failed ${res.statusCode} for ${url}`);
  return await res.body.json();
}
