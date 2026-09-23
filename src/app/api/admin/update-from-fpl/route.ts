import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { supabaseServer } from "@/lib/supabase-server";
import { PL_TIER_LEAGUES, type PLLeagueKey } from "@/data/pl-league-codes";

// FPL → Supabase sync za PL lige (sezonski).
//
// Pravila:
// - Piše ISKLJUČIVO u standings tabele (premier_league_<s>, h2h_league_<s>).
// - Tabele prijava (registration_*) se samo ČITAJU — za prava imena/email
//   kod novih redova. Nikad se ne mijenjaju.
// - Full sync je nedestruktivan: postojeći redovi se ažuriraju, novi se
//   dodaju, ništa se ne briše (redovi kojih nema na FPL-u se samo prijave).

type Season = "25_26" | "26_27";

interface LeagueConfig {
  id: number;
  type: "classic" | "h2h";
  table: string;
  dbLeagueType?: string;
  h2hCategory?: string;
}

// ID 0 = nije konfigurisan; admin šalje fplLeagueId iz UI-ja.
const LEAGUE_CONFIGS_BY_SEASON: Record<Season, Record<string, LeagueConfig>> = {
  "25_26": {
    premium: { id: 277005, type: "classic", table: "premier_league_25_26", dbLeagueType: "premium" },
    standard: { id: 277449, type: "classic", table: "premier_league_25_26", dbLeagueType: "standard" },
    h2h: { id: 277479, type: "h2h", table: "h2h_league_25_26", h2hCategory: "h2h" },
    h2h2: { id: 451227, type: "h2h", table: "h2h_league_25_26", h2hCategory: "h2h2" },
  },
  "26_27": {
    premium: { id: 0, type: "classic", table: "premier_league_26_27", dbLeagueType: "premium" },
    standard: { id: 0, type: "classic", table: "premier_league_26_27", dbLeagueType: "standard" },
    h2h: { id: 0, type: "h2h", table: "h2h_league_26_27", h2hCategory: "h2h" },
  },
};

const REGISTRATION_TABLE: Partial<Record<Season, string>> = {
  "26_27": "registration_premier_league_26_27",
};

const FPL_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  Accept: "application/json",
};

interface FPLPlayer {
  rank: number;
  entry: number;
  player_name: string;
  entry_name: string;
  total: number;
  event_total?: number;
  points_for?: number;
  matches_won?: number;
  matches_drawn?: number;
  matches_lost?: number;
}

interface LeagueInfo {
  id: number;
  name: string;
}

async function isAdminRequest() {
  const session = await getServerSession(authOptions);
  return Boolean(session?.user && (session.user as any).isAdmin);
}

async function fetchFPLLeague(
  leagueId: number,
  type: "classic" | "h2h"
): Promise<{ league: LeagueInfo; players: FPLPlayer[] }> {
  const base =
    type === "h2h"
      ? `https://fantasy.premierleague.com/api/leagues-h2h/${leagueId}/standings/`
      : `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`;

  const players: FPLPlayer[] = [];
  let league: LeagueInfo = { id: leagueId, name: "" };
  let page = 1;

  // Safety cap: 40 stranica × 50 = 2000 igrača
  while (page <= 40) {
    const res = await fetch(`${base}?page_standings=${page}`, {
      headers: FPL_HEADERS,
      cache: "no-store",
    });
    if (res.status === 404) throw new Error(`FPL liga ${leagueId} ne postoji (${type})`);
    if (!res.ok) throw new Error(`FPL API error: ${res.status}`);

    const data = await res.json();
    if (page === 1) league = { id: data.league?.id ?? leagueId, name: data.league?.name ?? "" };
    const results: FPLPlayer[] = data.standings?.results || [];
    players.push(...results);
    if (!data.standings?.has_next || results.length === 0) break;
    page++;
  }

  return { league, players };
}

const norm = (s: unknown) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") };
}

const syntheticEmail = (entry: number) => `fpl_${entry}@imported.com`;

// Da li tabela ima kolonu fpl_entry_id (premier_league_26_27 je dobija tek
// nakon sql/pl_26_27_fpl_sync.sql) — bez nje se matchuje po emailu/timu/imenu.
async function hasEntryIdColumn(table: string) {
  const { error } = await supabaseServer.from(table).select("fpl_entry_id").limit(1);
  return !error;
}

interface RegistrationRow {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  team_name: string | null;
  league_tier: string | null;
}

// Read-only: prijave koje pripadaju ovoj ligi (po tieru)
async function loadRegistrations(season: Season, leagueKey: string) {
  const table = REGISTRATION_TABLE[season];
  if (!table) return [] as RegistrationRow[];
  const { data, error } = await supabaseServer
    .from(table)
    .select("first_name, last_name, email, phone, team_name, league_tier")
    .is("deleted_at", null);
  if (error) {
    console.warn("[FPL-SYNC] registrations read failed:", error.message);
    return [];
  }
  return (data as RegistrationRow[]).filter((r) =>
    (PL_TIER_LEAGUES[r.league_tier || ""] || []).includes(leagueKey as PLLeagueKey)
  );
}

// GET ?managerId=123         → privatne lige tog menadžera (za odabir ID-ja)
// GET ?leagueId=123&type=h2h → pregled lige (ime + broj igrača)
export async function GET(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const managerId = Number(searchParams.get("managerId"));
  const leagueId = Number(searchParams.get("leagueId"));
  const type = searchParams.get("type") === "h2h" ? "h2h" : "classic";

  try {
    if (managerId > 0) {
      const res = await fetch(`https://fantasy.premierleague.com/api/entry/${managerId}/`, {
        headers: FPL_HEADERS,
        cache: "no-store",
      });
      if (!res.ok) {
        return NextResponse.json({ error: `FPL menadžer ${managerId} nije pronađen` }, { status: 404 });
      }
      const data = await res.json();
      const pick = (list: any[], kind: "classic" | "h2h") =>
        (list || [])
          .filter((l) => l.league_type === "x")
          .map((l) => ({ id: l.id, name: l.name, type: kind, rank: l.entry_rank ?? null }));
      return NextResponse.json({
        manager: `${data.player_first_name ?? ""} ${data.player_last_name ?? ""}`.trim(),
        team: data.name,
        leagues: [...pick(data.leagues?.classic, "classic"), ...pick(data.leagues?.h2h, "h2h")],
      });
    }

    if (leagueId > 0) {
      const { league, players } = await fetchFPLLeague(leagueId, type);
      return NextResponse.json({
        id: league.id,
        name: league.name,
        type,
        players: players.length,
        leader: players[0] ? { name: players[0].player_name, team: players[0].entry_name, total: players[0].total } : null,
      });
    }

    return NextResponse.json({ error: "managerId ili leagueId je obavezan" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "FPL greška" },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdminRequest())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { leagueType, fullSync = false } = body;
    const season: Season = body.season === "26_27" ? "26_27" : "25_26";
    const seasonConfigs = LEAGUE_CONFIGS_BY_SEASON[season];

    if (!leagueType || !seasonConfigs[leagueType]) {
      return NextResponse.json(
        { error: "Invalid leagueType", validTypes: Object.keys(seasonConfigs) },
        { status: 400 }
      );
    }

    // 25/26 je završena, a FPL je njene ID-jeve lige reciklirao za tuđe lige
    // u 26/27 — sync bi upisao pogrešne igrače u arhivsku tabelu.
    if (season === "25_26") {
      return NextResponse.json(
        { error: "Sezona 25/26 je završena i zaključana — FPL sync je moguć samo za 26/27" },
        { status: 400 }
      );
    }

    const config = seasonConfigs[leagueType];
    const isH2H = config.type === "h2h";
    const overrideId = Number(body.fplLeagueId);
    const leagueId = Number.isFinite(overrideId) && overrideId > 0 ? overrideId : config.id;

    if (!leagueId) {
      return NextResponse.json(
        { error: `Unesi FPL ID lige za ${leagueType} (sezona ${season.replace("_", "/")})` },
        { status: 400 }
      );
    }

    const { league, players: fplPlayers } = await fetchFPLLeague(leagueId, config.type);
    if (!fplPlayers.length) {
      return NextResponse.json(
        { error: `FPL liga "${league.name}" nema igrača u tabeli (sezona možda još nije počela)` },
        { status: 422 }
      );
    }

    // Postojeći redovi ove lige
    const withEntryId = await hasEntryIdColumn(config.table);
    let query = supabaseServer.from(config.table).select("*").is("deleted_at", null);
    query = isH2H
      ? query.eq("h2h_category", config.h2hCategory!)
      : query.eq("league_type", config.dbLeagueType!);
    const { data: existingRows, error: loadError } = await query;
    if (loadError) {
      console.error("[FPL-SYNC] load error:", loadError);
      return NextResponse.json({ error: "Ne mogu učitati postojeću tabelu" }, { status: 500 });
    }

    const rows = (existingRows || []) as any[];
    const used = new Set<string>();
    const byEntry = new Map<number, any>();
    const byEmail = new Map<string, any>();
    const byTeam = new Map<string, any>();
    const byName = new Map<string, any>();
    for (const r of rows) {
      if (withEntryId && r.fpl_entry_id) byEntry.set(Number(r.fpl_entry_id), r);
      if (r.email) byEmail.set(norm(r.email), r);
      if (r.team_name && !byTeam.has(norm(r.team_name))) byTeam.set(norm(r.team_name), r);
      const full = norm(`${r.first_name ?? ""} ${r.last_name ?? ""}`);
      if (full && !byName.has(full)) byName.set(full, r);
    }

    const findExisting = (p: FPLPlayer) => {
      const candidates = [
        byEntry.get(p.entry),
        byEmail.get(norm(syntheticEmail(p.entry))),
        byTeam.get(norm(p.entry_name)),
        byName.get(norm(p.player_name)),
      ];
      return candidates.find((c) => c && !used.has(c.id)) || null;
    };

    // Prijave (read-only) za prava imena kod novih redova
    const registrations = fullSync ? await loadRegistrations(season, leagueType) : [];
    const regByTeam = new Map(registrations.filter((r) => r.team_name).map((r) => [norm(r.team_name), r]));
    const regByName = new Map(registrations.map((r) => [norm(`${r.first_name ?? ""} ${r.last_name ?? ""}`), r]));

    const now = new Date().toISOString();
    const scoreFields = (p: FPLPlayer) =>
      isH2H
        ? {
            h2h_points: p.total,
            h2h_stats: { w: p.matches_won || 0, d: p.matches_drawn || 0, l: p.matches_lost || 0 },
            points_for: p.points_for || 0,
          }
        : { points: p.total };

    let inserted = 0;
    let updated = 0;
    let errors = 0;
    const notFound: string[] = [];
    const changes: Array<{ name: string; team: string; oldPts: number | null; newPts: number; status: "updated" | "inserted" }> = [];

    const tasks: Array<() => Promise<void>> = [];

    for (const p of fplPlayers) {
      const existing = findExisting(p);

      if (existing) {
        used.add(existing.id);
        const patch: Record<string, unknown> = { ...scoreFields(p), last_points_update: now };
        if (fullSync) {
          patch.team_name = p.entry_name;
          if (withEntryId) patch.fpl_entry_id = p.entry;
        }
        tasks.push(async () => {
          const { error } = await supabaseServer.from(config.table).update(patch).eq("id", existing.id);
          if (error) {
            errors++;
            console.error(`[FPL-SYNC] update ${p.entry_name}:`, error.message);
            return;
          }
          updated++;
          changes.push({
            name: `${existing.first_name ?? ""} ${existing.last_name ?? ""}`.trim() || p.player_name,
            team: p.entry_name,
            oldPts: isH2H ? existing.h2h_points ?? null : existing.points ?? null,
            newPts: p.total,
            status: "updated",
          });
        });
        continue;
      }

      if (!fullSync) {
        notFound.push(`${p.player_name} (${p.entry_name}) — ${p.total}`);
        continue;
      }

      const reg = regByTeam.get(norm(p.entry_name)) || regByName.get(norm(p.player_name));
      const fallback = splitName(p.player_name);
      const row: Record<string, unknown> = {
        first_name: reg?.first_name || fallback.firstName,
        last_name: reg?.last_name || fallback.lastName,
        team_name: p.entry_name,
        email: reg?.email || syntheticEmail(p.entry),
        phone: reg?.phone || null,
        ...scoreFields(p),
        last_points_update: now,
        ...(isH2H ? { h2h_category: config.h2hCategory } : { league_type: config.dbLeagueType }),
      };
      if (withEntryId) row.fpl_entry_id = p.entry;

      tasks.push(async () => {
        const { error } = await supabaseServer.from(config.table).insert(row);
        if (error) {
          errors++;
          console.error(`[FPL-SYNC] insert ${p.entry_name}:`, error.message);
          return;
        }
        inserted++;
        changes.push({
          name: `${row.first_name} ${row.last_name}`.trim(),
          team: p.entry_name,
          oldPts: null,
          newPts: p.total,
          status: "inserted",
        });
      });
    }

    // Paralelno u manjim serijama
    for (let i = 0; i < tasks.length; i += 10) {
      await Promise.all(tasks.slice(i, i + 10).map((t) => t()));
    }

    // Redovi u bazi kojih nema u FPL ligi — NE brišu se, samo se prijavljuju
    const notInFpl = rows
      .filter((r) => !used.has(r.id))
      .map((r) => `${r.first_name ?? ""} ${r.last_name ?? ""} (${r.team_name ?? "-"})`.trim());

    return NextResponse.json({
      success: true,
      mode: fullSync ? "full_sync" : "update",
      leagueType,
      leagueId,
      leagueName: league.name,
      table: config.table,
      totalFPLPlayers: fplPlayers.length,
      inserted,
      updated,
      errors,
      notFoundCount: notFound.length,
      notFound,
      notInFpl,
      matchedByEntryId: withEntryId,
      changes,
      message: fullSync
        ? `Full sync: ${updated} ažurirano, ${inserted} dodano, ${errors} grešaka`
        : `Ažurirano ${updated}/${fplPlayers.length}, nije pronađeno ${notFound.length}`,
    });
  } catch (error) {
    console.error("[FPL-SYNC] Fatal error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}

// DELETE ?leagueType=premium&season=26_27 → očisti standings redove jedne lige
// (npr. kad je sync-ovan pogrešan FPL ID). Samo 26/27; prijave se ne diraju.
export async function DELETE(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const leagueType = searchParams.get("leagueType") || "";
  if (searchParams.get("season") !== "26_27") {
    return NextResponse.json({ error: "Čišćenje je dozvoljeno samo za sezonu 26/27" }, { status: 400 });
  }
  const config = LEAGUE_CONFIGS_BY_SEASON["26_27"][leagueType];
  if (!config) {
    return NextResponse.json({ error: "Invalid leagueType" }, { status: 400 });
  }

  const query = supabaseServer.from(config.table).delete({ count: "exact" });
  const { error, count } =
    config.type === "h2h"
      ? await query.eq("h2h_category", config.h2hCategory!)
      : await query.eq("league_type", config.dbLeagueType!);

  if (error) {
    console.error("[FPL-SYNC] clear error:", error);
    return NextResponse.json({ error: "Brisanje nije uspjelo" }, { status: 500 });
  }

  return NextResponse.json({ success: true, deleted: count ?? 0 });
}
