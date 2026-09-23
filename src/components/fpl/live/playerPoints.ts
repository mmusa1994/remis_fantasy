"use client";

/**
 * Live points helpers for the Squad tab: FPL scoring rules, a per-stat
 * breakdown, the exact FPL `explain` feed and fixture status per team.
 */

import { useEffect, useState } from "react";
import { getTeamColors } from "@/lib/team-colors";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface LiveStats {
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  bps: number;
  total_points: number;
}

export interface LivePlayer {
  id: number;
  web_name: string;
  first_name?: string;
  second_name?: string;
  team: number;
  team_code?: number;
  element_type: number;
  status?: string;
  news?: string;
  now_cost?: number;
  selected_by_percent?: string;
  form?: string;
}

/** One entry of `team_with_stats` from /api/fpl/load-team. */
export interface LivePick {
  player_id: number;
  position: number;
  multiplier: number;
  is_captain: boolean;
  is_vice_captain: boolean;
  gw?: number;
  player: LivePlayer | null;
  live_stats: Partial<LiveStats> | null;
}

export interface LiveFixture {
  id: number;
  event: number;
  kickoff_time: string | null;
  started: boolean;
  finished: boolean;
  finished_provisional?: boolean;
  minutes: number;
  team_h: number;
  team_a: number;
  team_h_score: number | null;
  team_a_score: number | null;
}

/* ------------------------------------------------------------------ */
/* Scoring (matches FPL bootstrap game_config.scoring for 2026/27)     */
/* ------------------------------------------------------------------ */

export const GOAL_POINTS: Record<number, number> = { 1: 10, 2: 6, 3: 5, 4: 4 };
export const CLEAN_SHEET_POINTS: Record<number, number> = { 1: 4, 2: 4, 3: 1, 4: 0 };
/** Goalkeepers and defenders lose a point for every two goals conceded. */
export const concedesPoints = (elementType: number) => elementType === 1 || elementType === 2;

export type StatId =
  | "minutes"
  | "goals_scored"
  | "assists"
  | "clean_sheets"
  | "goals_conceded"
  | "saves"
  | "penalties_saved"
  | "penalties_missed"
  | "own_goals"
  | "yellow_cards"
  | "red_cards"
  | "defensive_contribution"
  | "bonus"
  | "other";

export const STAT_ORDER: StatId[] = [
  "minutes",
  "goals_scored",
  "assists",
  "clean_sheets",
  "goals_conceded",
  "saves",
  "penalties_saved",
  "penalties_missed",
  "own_goals",
  "defensive_contribution",
  "yellow_cards",
  "red_cards",
  "bonus",
  "other",
];

export interface BreakdownLine {
  id: StatId;
  value: number;
  points: number;
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/**
 * Per-stat points from the stats we already have. Defensive contributions are
 * not in load-team's stats, so `reconcile` books any gap as "other".
 */
export function computeBreakdown(elementType: number, stats: Partial<LiveStats> | null): BreakdownLine[] {
  if (!stats) return [];
  const minutes = num(stats.minutes);
  const lines: BreakdownLine[] = [];
  const push = (id: StatId, value: number, points: number) => {
    if (value || points) lines.push({ id, value, points });
  };

  push("minutes", minutes, minutes >= 60 ? 2 : minutes > 0 ? 1 : 0);
  push("goals_scored", num(stats.goals_scored), num(stats.goals_scored) * (GOAL_POINTS[elementType] ?? 4));
  push("assists", num(stats.assists), num(stats.assists) * 3);
  if (num(stats.clean_sheets) > 0 && CLEAN_SHEET_POINTS[elementType]) {
    push("clean_sheets", num(stats.clean_sheets), num(stats.clean_sheets) * CLEAN_SHEET_POINTS[elementType]);
  }
  if (concedesPoints(elementType)) {
    const conceded = num(stats.goals_conceded);
    if (conceded >= 2) push("goals_conceded", conceded, -Math.floor(conceded / 2));
  }
  if (elementType === 1 && num(stats.saves) >= 3) {
    push("saves", num(stats.saves), Math.floor(num(stats.saves) / 3));
  }
  push("penalties_saved", num(stats.penalties_saved), num(stats.penalties_saved) * 5);
  push("penalties_missed", num(stats.penalties_missed), num(stats.penalties_missed) * -2);
  push("own_goals", num(stats.own_goals), num(stats.own_goals) * -2);
  push("yellow_cards", num(stats.yellow_cards), num(stats.yellow_cards) * -1);
  push("red_cards", num(stats.red_cards), num(stats.red_cards) * -3);
  push("bonus", num(stats.bonus), num(stats.bonus));
  return lines;
}

/** Make the lines add up to the official total; any gap becomes "other". */
export function reconcile(lines: BreakdownLine[], total: number): BreakdownLine[] {
  const sum = lines.reduce((s, l) => s + l.points, 0);
  if (sum === total) return lines;
  return [...lines, { id: "other", value: 0, points: total - sum }];
}

/* ------------------------------------------------------------------ */
/* Exact breakdown from FPL's event/live `explain`                     */
/* ------------------------------------------------------------------ */

interface ExplainStat {
  identifier: string;
  points: number;
  value: number;
  points_modification?: number;
}
interface ExplainFixture {
  fixture: number;
  stats: ExplainStat[];
}

const EXPLAIN_TTL_MS = 60_000;
const explainCache = new Map<number, { at: number; data: Promise<Map<number, ExplainFixture[]>> }>();

function loadExplain(gameweek: number) {
  const cached = explainCache.get(gameweek);
  if (cached && Date.now() - cached.at < EXPLAIN_TTL_MS) return cached.data;

  const data = fetch(`/api/fpl/proxy?endpoint=/event/${gameweek}/live/`)
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
    .then((json) => {
      const elements: Array<{ id: number; explain?: ExplainFixture[] }> = json?.data?.elements ?? [];
      return new Map(elements.map((el) => [el.id, el.explain ?? []]));
    });
  data.catch(() => explainCache.delete(gameweek));
  explainCache.set(gameweek, { at: Date.now(), data });
  return data;
}

function explainToLines(explain: ExplainFixture[]): BreakdownLine[] {
  const byId = new Map<StatId, BreakdownLine>();
  for (const fixture of explain) {
    for (const stat of fixture.stats ?? []) {
      const id = (STAT_ORDER as string[]).includes(stat.identifier) ? (stat.identifier as StatId) : "other";
      const line = byId.get(id) ?? { id, value: 0, points: 0 };
      line.value += num(stat.value);
      line.points += num(stat.points) + num(stat.points_modification);
      byId.set(id, line);
    }
  }
  return STAT_ORDER.map((id) => byId.get(id)).filter(
    (line): line is BreakdownLine => !!line && (line.value !== 0 || line.points !== 0)
  );
}

/**
 * The exact per-stat breakdown (incl. defensive contributions and double
 * gameweeks). Returns null until loaded, or when it disagrees with `total`
 * (the feeds refresh at different moments) — callers fall back to
 * `computeBreakdown` so the sheet never contradicts the list.
 */
export function useExplainBreakdown(
  gameweek: number | undefined,
  elementId: number | undefined,
  total: number,
  enabled: boolean
): BreakdownLine[] | null {
  const key = enabled && gameweek && elementId ? `${gameweek}:${elementId}:${total}` : null;
  const [result, setResult] = useState<{ key: string; lines: BreakdownLine[] | null } | null>(null);

  useEffect(() => {
    if (!key || !gameweek || !elementId) return;
    let cancelled = false;
    loadExplain(gameweek)
      .then((map) => {
        if (cancelled) return;
        const next = explainToLines(map.get(elementId) ?? []);
        const sum = next.reduce((s, l) => s + l.points, 0);
        setResult({ key, lines: next.length > 0 && sum === total ? next : null });
      })
      .catch(() => {
        /* keep the computed breakdown */
      });
    return () => {
      cancelled = true;
    };
  }, [key, gameweek, elementId, total]);

  return result && result.key === key ? result.lines : null;
}

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

export type FixtureState = "none" | "upcoming" | "live" | "finished";

export interface TeamFixtureInfo {
  fixture: LiveFixture;
  isHome: boolean;
  opponentId: number;
  opponentShort: string;
}

export function teamFixtures(fixtures: LiveFixture[] | undefined, teamId: number | undefined): TeamFixtureInfo[] {
  if (!fixtures || !teamId) return [];
  return fixtures
    .filter((f) => f.team_h === teamId || f.team_a === teamId)
    .sort((a, b) => String(a.kickoff_time).localeCompare(String(b.kickoff_time)))
    .map((fixture) => {
      const isHome = fixture.team_h === teamId;
      const opponentId = isHome ? fixture.team_a : fixture.team_h;
      return { fixture, isHome, opponentId, opponentShort: getTeamColors(opponentId).shortName };
    });
}

/** Where a team's gameweek stands. Unknown (null) when no fixtures were passed in. */
export function fixtureState(infos: TeamFixtureInfo[], hasFixtureData: boolean): FixtureState | null {
  if (!hasFixtureData) return null;
  if (infos.length === 0) return "none";
  if (infos.every((i) => i.fixture.finished || i.fixture.finished_provisional)) return "finished";
  if (infos.some((i) => i.fixture.started)) return "live";
  return "upcoming";
}
