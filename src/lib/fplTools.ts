import { request } from "undici";

const BASE = "https://fantasy.premierleague.com/api";

export async function getBootstrapStatic() {
  const res = await request(`${BASE}/bootstrap-static/`);
  if (res.statusCode! >= 400) throw new Error("bootstrap-static failed");
  return await res.body.json();
}

export async function getFixtures() {
  const res = await request(`${BASE}/fixtures/`);
  if (res.statusCode! >= 400) throw new Error("fixtures failed");
  return await res.body.json();
}

// optional community-known endpoint (ownership, transfers, etc.)
// Available stats: most_selected, most_transferred_in, most_captained, etc.
export async function getTopStat(stat: string) {
  const res = await request(`${BASE}/stats/top/${encodeURIComponent(stat)}/`);
  if (res.statusCode! >= 400) throw new Error("stats/top failed");
  return await res.body.json();
}

// player detailed stats and history per gameweek
export async function getPlayerSummary(playerId: number) {
  const res = await request(`${BASE}/element-summary/${playerId}/`);
  if (res.statusCode! >= 400) throw new Error("element-summary failed");
  return await res.body.json();
}

// get user FPL team data by manager ID
export async function getUserTeam(managerId: string) {
  const res = await request(`${BASE}/entry/${managerId}/`);
  if (res.statusCode! >= 400) throw new Error(`team data failed for manager ${managerId}`);
  return await res.body.json();
}

// get user's current gameweek picks
export async function getUserPicks(managerId: string, gameweek: number) {
  const res = await request(`${BASE}/entry/${managerId}/event/${gameweek}/picks/`);
  if (res.statusCode! >= 400) throw new Error(`picks failed for manager ${managerId} GW${gameweek}`);
  return await res.body.json();
}

// get user's current team with transfers and bank
export async function getMyTeam(managerId: string) {
  const res = await request(`${BASE}/my-team/${managerId}/`);
  if (res.statusCode! >= 400) throw new Error(`my-team failed for manager ${managerId}`);
  return await res.body.json();
}

// get user's team history 
export async function getTeamHistory(managerId: string) {
  const res = await request(`${BASE}/entry/${managerId}/history/`);
  if (res.statusCode! >= 400) throw new Error(`history failed for manager ${managerId}`);
  return await res.body.json();
}