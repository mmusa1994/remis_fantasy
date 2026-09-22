// Gradi kompaktan, provjerljiv "data pack" za AI analizu tima.
// Sve dolazi iz live FPL API-ja (bootstrap-static + fixtures + entry endpoints).

import { getGameweekContext, type GameweekContext } from "@/lib/fpl-season";

export interface TeamAnalysisContext {
  gw: GameweekContext;
  dataPack: string;
  squadPlayerIds: number[];
  hasSquad: boolean;
  managerName: string | null;
  teamName: string | null;
}

const POS: Record<number, string> = { 1: "GKP", 2: "DEF", 3: "MID", 4: "FWD" };

const money = (tenths: number) => (tenths / 10).toFixed(1);
const num = (v: unknown, digits = 2) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n.toFixed(digits) : "0.00";
};

interface FixtureLite {
  event: number | null;
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
  finished: boolean;
  team_h_score: number | null;
  team_a_score: number | null;
  kickoff_time: string | null;
}

/** Za svaki tim: lista narednih N mečeva kao "OPP(H/A,FDR)". Hvata i DGW i BGW. */
function buildFixtureTicker(
  fixtures: FixtureLite[],
  shortNames: Record<number, string>,
  fromGW: number,
  horizon: number
) {
  const ticker = new Map<number, string[][]>();
  const gws = Array.from({ length: horizon }, (_, i) => fromGW + i);

  for (const teamId of Object.keys(shortNames).map(Number)) {
    ticker.set(
      teamId,
      gws.map(() => [])
    );
  }

  for (const f of fixtures) {
    if (f.event == null || f.event < fromGW || f.event >= fromGW + horizon) continue;
    const slot = f.event - fromGW;
    ticker.get(f.team_h)?.[slot]?.push(
      `${shortNames[f.team_a]}(H,${f.team_h_difficulty})`
    );
    ticker.get(f.team_a)?.[slot]?.push(
      `${shortNames[f.team_h]}(A,${f.team_a_difficulty})`
    );
  }

  return { ticker, gws };
}

function tickerLine(slots: string[][] | undefined): string {
  if (!slots) return "-";
  return slots
    .map((s) => (s.length === 0 ? "BLANK" : s.join("+")))
    .join(" | ");
}

function avgFdr(slots: string[][] | undefined): number | null {
  if (!slots) return null;
  const vals: number[] = [];
  for (const slot of slots) {
    for (const m of slot) {
      const hit = m.match(/,(\d)\)$/);
      if (hit) vals.push(Number(hit[1]));
    }
  }
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/** Procjena slobodnih transfera iz javne historije (FPL ne izlaže FT bez logina). */
function estimateFreeTransfers(
  history: any,
  chipsByGW: Map<number, string>,
  upToGW: number
): number {
  let ft = 1;
  const rows: any[] = history?.current ?? [];
  for (const row of rows) {
    if (row.event > upToGW) break;
    const chip = chipsByGW.get(row.event);
    if (chip !== "wildcard" && chip !== "freehit") {
      ft = Math.max(0, ft - (row.event_transfers ?? 0));
    }
    ft = Math.min(5, ft + 1);
  }
  return Math.max(1, Math.min(5, ft));
}

function playerLine(p: any, shortNames: Record<number, string>): string {
  const flag =
    p.status === "a"
      ? "OK"
      : `${p.status}${
          p.chance_of_playing_next_round != null
            ? `/${p.chance_of_playing_next_round}%`
            : ""
        }`;
  const news = (p.news || "").replace(/\s+/g, " ").trim().slice(0, 70);
  return [
    p.id,
    p.web_name,
    shortNames[p.team] ?? "?",
    POS[p.element_type] ?? "?",
    money(p.now_cost),
    num(p.form, 1),
    p.total_points,
    num(p.points_per_game, 1),
    p.minutes,
    p.starts ?? 0,
    num(p.expected_goal_involvements_per_90),
    num(p.expected_goals_conceded_per_90),
    num(p.defensive_contribution_per_90, 1),
    num(p.selected_by_percent, 1),
    p.cost_change_event ?? 0,
    flag,
    news ? `"${news}"` : "",
  ].join("|");
}

export function buildTeamAnalysisContext(args: {
  bootstrap: any;
  fixtures: FixtureLite[];
  picks: any | null;
  entry: any | null;
  history: any | null;
  picksGW: number | null;
  horizon?: number;
}): TeamAnalysisContext {
  const { bootstrap, fixtures, picks, entry, history } = args;
  const horizon = args.horizon ?? 5;
  const gw = getGameweekContext(bootstrap);

  const shortNames: Record<number, string> = {};
  const fullNames: Record<number, string> = {};
  for (const t of bootstrap.teams) {
    shortNames[t.id] = t.short_name;
    fullNames[t.id] = t.name;
  }

  const byId = new Map<number, any>(
    bootstrap.elements.map((e: any) => [e.id, e])
  );

  const { ticker, gws } = buildFixtureTicker(
    fixtures,
    shortNames,
    gw.targetGW,
    horizon
  );

  // ---------- 1. MOJ TIM ----------
  const squadPicks: any[] = picks?.picks ?? [];
  const squadPlayerIds = squadPicks.map((p) => p.element);
  const squadIdSet = new Set(squadPlayerIds);

  const squadLines = squadPicks.map((pick) => {
    const p = byId.get(pick.element);
    if (!p) return `?|ID:${pick.element}`;
    const role = pick.is_captain
      ? "C"
      : pick.is_vice_captain
      ? "VC"
      : pick.position > 11
      ? `B${pick.position - 11}`
      : "XI";
    return `${role}|${playerLine(p, shortNames)}|FIX:${tickerLine(
      ticker.get(p.team)
    )}`;
  });

  const clubCounts = new Map<string, number>();
  for (const id of squadPlayerIds) {
    const p = byId.get(id);
    if (!p) continue;
    const key = shortNames[p.team];
    clubCounts.set(key, (clubCounts.get(key) ?? 0) + 1);
  }

  const chipsUsed: Array<{ name: string; event: number }> = history?.chips ?? [];
  const chipsByGW = new Map<number, string>(
    chipsUsed.map((c) => [c.event, c.name])
  );

  const allChips: Array<{ name: string; start_event: number; stop_event: number }> =
    bootstrap.chips ?? [];
  const chipLabel: Record<string, string> = {
    wildcard: "Wildcard",
    freehit: "Free Hit",
    bboost: "Bench Boost",
    "3xc": "Triple Captain",
  };
  const usedCounter = new Map<string, number>();
  for (const c of chipsUsed) {
    const window = allChips.find(
      (w) => w.name === c.name && c.event >= w.start_event && c.event <= w.stop_event
    );
    const key = `${c.name}:${window?.start_event ?? 0}`;
    usedCounter.set(key, (usedCounter.get(key) ?? 0) + 1);
  }
  const chipAvailability = allChips
    .map((w) => {
      const key = `${w.name}:${w.start_event}`;
      const used = usedCounter.get(key) ?? 0;
      const active = gw.targetGW >= w.start_event && gw.targetGW <= w.stop_event;
      return `${chipLabel[w.name] ?? w.name} GW${w.start_event}-${w.stop_event}: ${
        used > 0 ? "ISKORISTEN" : active ? "DOSTUPAN SADA" : "dostupan kasnije"
      }`;
    })
    .join("\n");

  const eh = picks?.entry_history ?? {};
  const bank = (eh.bank ?? entry?.last_deadline_bank ?? 0) / 10;
  const value = (eh.value ?? entry?.last_deadline_value ?? 1000) / 10;
  const ftEstimate = history
    ? estimateFreeTransfers(history, chipsByGW, gw.targetGW - 1)
    : 1;

  const last5 = (history?.current ?? [])
    .slice(-5)
    .map(
      (r: any) =>
        `GW${r.event}: ${r.points}pts (bench ${r.points_on_bench}, OR ${
          r.overall_rank?.toLocaleString?.("en-US") ?? r.overall_rank
        }, transfers ${r.event_transfers}${
          r.event_transfers_cost ? ` -${r.event_transfers_cost}` : ""
        }${chipsByGW.get(r.event) ? `, chip ${chipsByGW.get(r.event)}` : ""})`
    )
    .join("\n");

  // ---------- 2. TRŽIŠTE ----------
  const eligible = bootstrap.elements.filter(
    (p: any) => p.minutes > 0 || p.now_cost >= 50
  );

  const score = (p: any) =>
    parseFloat(p.form || "0") * 2 +
    parseFloat(p.points_per_game || "0") * 1.5 +
    parseFloat(p.expected_goal_involvements_per_90 || "0") * 3 +
    (p.status === "a" ? 1 : -4);

  const topByPos = [1, 2, 3, 4]
    .map((type) => {
      const limit = type === 1 ? 12 : type === 4 ? 20 : 28;
      const rows = eligible
        .filter((p: any) => p.element_type === type)
        .sort((a: any, b: any) => score(b) - score(a))
        .slice(0, limit)
        .map(
          (p: any) =>
            `${playerLine(p, shortNames)}|FIX:${tickerLine(ticker.get(p.team))}${
              squadIdSet.has(p.id) ? "|*U MOM TIMU*" : ""
            }`
        )
        .join("\n");
      return `-- ${POS[type]} --\n${rows}`;
    })
    .join("\n");

  const differentials = eligible
    .filter(
      (p: any) =>
        parseFloat(p.selected_by_percent) < 8 &&
        parseFloat(p.form) >= 3.5 &&
        p.status === "a" &&
        p.minutes >= 180 &&
        !squadIdSet.has(p.id)
    )
    .sort((a: any, b: any) => score(b) - score(a))
    .slice(0, 15)
    .map(
      (p: any) =>
        `${playerLine(p, shortNames)}|FIX:${tickerLine(ticker.get(p.team))}`
    )
    .join("\n");

  const priceWatch = eligible
    .map((p: any) => ({
      p,
      net: (p.transfers_in_event ?? 0) - (p.transfers_out_event ?? 0),
    }))
    .sort((a: any, b: any) => Math.abs(b.net) - Math.abs(a.net))
    .slice(0, 12)
    .map(
      ({ p, net }: any) =>
        `${p.web_name} (${shortNames[p.team]}) £${money(p.now_cost)} net ${
          net > 0 ? "+" : ""
        }${net.toLocaleString("en-US")} ${
          net > 0 ? "→ rizik poskupljenja" : "→ rizik pada cijene"
        }`
    )
    .join("\n");

  const injuries = bootstrap.elements
    .filter(
      (p: any) =>
        p.status !== "a" &&
        (squadIdSet.has(p.id) || parseFloat(p.selected_by_percent) >= 3)
    )
    .sort(
      (a: any, b: any) =>
        parseFloat(b.selected_by_percent) - parseFloat(a.selected_by_percent)
    )
    .slice(0, 25)
    .map(
      (p: any) =>
        `${p.web_name} (${shortNames[p.team]}, ${POS[p.element_type]}) £${money(
          p.now_cost
        )} own ${p.selected_by_percent}% status ${p.status}${
          p.chance_of_playing_next_round != null
            ? ` ${p.chance_of_playing_next_round}%`
            : ""
        }${p.news ? ` — ${p.news.replace(/\s+/g, " ").slice(0, 90)}` : ""}${
          squadIdSet.has(p.id) ? " *U MOM TIMU*" : ""
        }`
    )
    .join("\n");

  // ---------- 3. FIXTURE TICKER ----------
  const tickerBlock = bootstrap.teams
    .map((t: any) => {
      const slots = ticker.get(t.id);
      const avg = avgFdr(slots);
      return `${t.short_name} (${t.name}): ${tickerLine(slots)} | avgFDR ${
        avg != null ? avg.toFixed(2) : "-"
      }`;
    })
    .sort()
    .join("\n");

  const recentResults = fixtures
    .filter((f) => f.finished && f.event != null)
    .sort((a, b) => (b.event ?? 0) - (a.event ?? 0))
    .slice(0, 20)
    .map(
      (f) =>
        `GW${f.event}: ${shortNames[f.team_h]} ${f.team_h_score}-${
          f.team_a_score
        } ${shortNames[f.team_a]}`
    )
    .join("\n");

  const gwHeader = gws.map((g) => `GW${g}`).join(" | ");

  const squadBlock = squadLines.length
    ? `MOJ SASTAV (${squadLines.length} igrača) — uloga|${"ID|IME|TIM|POZ|CIJENA|FORMA|BODOVI|PPG|MIN|STARTS|xGI90|xGC90|DC90|VLASNIŠTVO%|ΔCIJENA_GW|STATUS|NEWS"}|FIX:${gwHeader}
${squadLines.join("\n")}

IGRAČA PO KLUBU (limit 3): ${Array.from(clubCounts.entries())
        .map(([k, v]) => `${k}:${v}`)
        .join(", ")}`
    : "MOJ SASTAV: NEDOSTUPAN — korisnik nema povezan manager ID ili FPL nije vratio picks.";

  const dataPack = `=================== KONTEKST ===================
SEZONA: ${gw.seasonLabel} | DANAS: ${new Date().toISOString().slice(0, 16)}Z
AKTUELNO KOLO: ${gw.currentGW ?? "-"} | KOLO ZA KOJE PLANIRAMO: GW${gw.targetGW} (${gw.targetGWName})
DEADLINE: ${gw.deadline ?? "nepoznat"}${
    gw.hoursToDeadline != null
      ? ` (za ${gw.hoursToDeadline.toFixed(1)}h)${gw.isDeadlineClose ? " ⚠ DEADLINE JE BLIZU" : ""}`
      : ""
  }

=================== MOJ TIM ===================
MENADŽER: ${entry?.player_first_name ?? ""} ${entry?.player_last_name ?? ""} | EKIPA: ${
    entry?.name ?? "-"
  }
UKUPNO BODOVA: ${entry?.summary_overall_points ?? "-"} | OVERALL RANK: ${
    entry?.summary_overall_rank?.toLocaleString?.("en-US") ??
    entry?.summary_overall_rank ??
    "-"
  }
ZADNJE KOLO: ${entry?.summary_event_points ?? "-"} bodova | GW RANK: ${
    entry?.summary_event_rank?.toLocaleString?.("en-US") ??
    entry?.summary_event_rank ??
    "-"
  }
VRIJEDNOST TIMA: £${value.toFixed(1)}m | BANKA: £${bank.toFixed(1)}m | UKUPNO: £${(
    value + bank
  ).toFixed(1)}m
SLOBODNI TRANSFERI (procjena iz historije): ${ftEstimate}
AKTIVNI CHIP U ZADNJEM KOLU: ${picks?.active_chip ?? "nema"}
PICKS PREUZETI IZ: GW${args.picksGW ?? gw.targetGW}

${squadBlock}

CHIPOVI:
${chipAvailability}

ZADNJIH 5 KOLA:
${last5 || "nema podataka"}

=================== RASPORED (${gwHeader}) ===================
Format po timu: PROTIVNIK(H=domaćin/A=gost,FDR 1-5) | BLANK = nema meča | A+B = dupli GW
${tickerBlock}

=================== POVREDE I STATUSI ===================
${injuries || "nema značajnih flagova"}

=================== NAJBOLJI IGRAČI PO POZICIJI ===================
Format: ID|IME|TIM|POZ|CIJENA|FORMA|BODOVI|PPG|MIN|STARTS|xGI90|xGC90|DC90|VLASNIŠTVO%|ΔCIJENA_GW|STATUS|NEWS|FIX
${topByPos}

=================== DIFERENCIJALI (<8% vlasništva) ===================
${differentials || "nema kandidata"}

=================== KRETANJE CIJENA (neto transferi ovo kolo) ===================
${priceWatch}

=================== ZADNJI REZULTATI ===================
${recentResults}
=================== KRAJ PODATAKA ===================`;

  return {
    gw,
    dataPack,
    squadPlayerIds,
    hasSquad: squadLines.length > 0,
    managerName:
      entry?.player_first_name && entry?.player_last_name
        ? `${entry.player_first_name} ${entry.player_last_name}`
        : null,
    teamName: entry?.name ?? null,
  };
}
