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