// Server-side provjera AI izvještaja protiv stvarnih FPL podataka.
// Model nikad nema zadnju riječ o imenima, cijenama, kadru i klub limitu — podaci imaju.

import type { FplTeamAnalysisReport } from "@/lib/ai/fpl-analysis-prompt";
import { POS } from "@/lib/ai/fpl-context";

export interface ValidationResult {
  report: FplTeamAnalysisReport;
  /** Popravljeno automatski (cijene, redoslijed, izbačeni nepostojeći igrači). */
  repaired: string[];
  /** Zahtijeva novi prolaz modela (npr. transfer koji krši budžet ili klub limit). */
  unrepairable: string[];
}

interface Ctx {
  bootstrap: any;
  squadIds: Set<number>;
  bank: number;
  clubLimit: number;
}

const norm = (s: unknown) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/[^a-z0-9À-ɏ.'-]+/g, " ")
    .trim();

function buildIndex(bootstrap: any) {
  const shortNames: Record<number, string> = {};
  for (const t of bootstrap.teams) shortNames[t.id] = t.short_name;
  const byName = new Map<string, any[]>();
  for (const p of bootstrap.elements) {
    const keys = new Set([norm(p.web_name), norm(`${p.first_name} ${p.second_name}`), norm(p.second_name)]);
    for (const k of keys) {
      if (!k) continue;
      const arr = byName.get(k) ?? [];
      arr.push(p);
      byName.set(k, arr);
    }
  }
  return { shortNames, byName };
}

export function validateAndRepairReport(
  input: FplTeamAnalysisReport,
  ctx: Ctx
): ValidationResult {
  const report: FplTeamAnalysisReport = JSON.parse(JSON.stringify(input));
  const repaired: string[] = [];
  const unrepairable: string[] = [];
  const { shortNames, byName } = buildIndex(ctx.bootstrap);
  const byId = new Map<number, any>(ctx.bootstrap.elements.map((e: any) => [e.id, e]));

  const resolve = (name: string, team?: string, preferSquad?: boolean) => {
    const cands = byName.get(norm(name)) ?? [];
    if (!cands.length) return null;
    const t = (team ?? "").toUpperCase().trim();
    const scored = cands
      .map((p) => ({
        p,
        s:
          (t && shortNames[p.team] === t ? 4 : 0) +
          (preferSquad === true && ctx.squadIds.has(p.id) ? 3 : 0) +
          (preferSquad === false && !ctx.squadIds.has(p.id) ? 3 : 0) +
          (p.minutes > 0 ? 1 : 0),
      }))
      .sort((a, b) => b.s - a.s);
    return scored[0].p;
  };
  const price = (p: any) => Math.round(p.now_cost) / 10;

  // --- HITNO: samo igrači iz kadra ---
  report.urgent = (report.urgent ?? []).filter((u) => {
    const p = resolve(u.player, u.team, true);
    if (!p || !ctx.squadIds.has(p.id)) {
      repaired.push(`urgent: "${u.player}" nije u kadru — izbačen`);
      return false;
    }
    u.player = p.web_name;
    u.team = shortNames[p.team];
    return true;
  });

  // --- KAPITEN: samo igrači iz kadra ---
  report.captaincy = (report.captaincy ?? [])
    .filter((c) => {
      const p = resolve(c.player, c.team, true);
      if (!p || !ctx.squadIds.has(p.id)) {
        repaired.push(`captaincy: "${c.player}" nije u kadru — izbačen`);
        return false;
      }
      c.player = p.web_name;
      c.team = shortNames[p.team];
      return true;
    })
    .map((c, i) => ({ ...c, rank: i + 1 }));

  // --- KLUPA: samo igrači iz kadra ---
  if (report.lineup) {
    report.lineup.benchOrder = (report.lineup.benchOrder ?? [])
      .filter((b) => {
        const p = resolve(b.player, undefined, true);
        if (!p || !ctx.squadIds.has(p.id)) {
          repaired.push(`bench: "${b.player}" nije u kadru — izbačen`);
          return false;
        }
        b.player = p.web_name;
        return true;
      })
      .map((b, i) => ({ ...b, order: i + 1 }));
  }

  // --- WATCHLIST: mora postojati, cijena iz podataka ---
  report.watchlist = (report.watchlist ?? []).filter((w) => {
    const p = resolve(w.player, w.team, false);
    if (!p) {
      repaired.push(`watchlist: "${w.player}" ne postoji — izbačen`);
      return false;
    }
    if (Math.abs(w.price - price(p)) > 0.05) {
      repaired.push(`watchlist: cijena ${w.player} ${w.price} → ${price(p)}`);
      w.price = price(p);
    }
    w.player = p.web_name;
    w.team = shortNames[p.team];
    return true;
  });

  // --- TRANSFERI: out ∈ kadar, in ∉ kadar, dostupan, cijene, budžet, klub limit ---
  const plan = report.transferPlan;
  if (plan) {
    const clubCount = new Map<number, number>();
    for (const id of ctx.squadIds) {
      const p = byId.get(id);
      if (p) clubCount.set(p.team, (clubCount.get(p.team) ?? 0) + 1);
    }
    let bank = ctx.bank;
    const validMoves: typeof plan.moves = [];
    for (const m of plan.moves ?? []) {
      const out = resolve(m.out?.name, m.out?.team, true);
      const inn = resolve(m.in?.name, m.in?.team, false);
      const label = `${m.out?.name} → ${m.in?.name}`;
      if (!out || !ctx.squadIds.has(out.id)) {
        unrepairable.push(`transfer ${label}: "${m.out?.name}" nije u kadru`);
        continue;
      }
      if (!inn) {
        unrepairable.push(`transfer ${label}: "${m.in?.name}" ne postoji u podacima`);
        continue;
      }
      if (ctx.squadIds.has(inn.id)) {
        unrepairable.push(`transfer ${label}: "${inn.web_name}" je već u kadru`);
        continue;
      }
      const chance = inn.chance_of_playing_next_round;
      if (inn.status !== "a" && !(inn.status === "d" && (chance ?? 0) >= 75)) {
        unrepairable.push(`transfer ${label}: "${inn.web_name}" ima status ${inn.status} — nije dostupan`);
        continue;
      }
      if (inn.element_type !== out.element_type) {
        unrepairable.push(`transfer ${label}: pozicije se ne poklapaju (${POS[out.element_type]} → ${POS[inn.element_type]})`);
        continue;
      }
      const outPrice = price(out);
      const inPrice = price(inn);
      if (Math.abs((m.out?.price ?? 0) - outPrice) > 0.05) {
        repaired.push(`transfer: cijena ${out.web_name} ${m.out.price} → ${outPrice}`);
      }
      if (Math.abs((m.in?.price ?? 0) - inPrice) > 0.05) {
        repaired.push(`transfer: cijena ${inn.web_name} ${m.in.price} → ${inPrice}`);
      }
      const newBank = Math.round((bank + outPrice - inPrice) * 10) / 10;
      if (newBank < -0.001) {
        unrepairable.push(
          `transfer ${label}: nedostaje £${Math.abs(newBank).toFixed(1)}m (banka £${bank.toFixed(1)}m + £${outPrice} < £${inPrice})`
        );
        continue;
      }
      const inClub = (clubCount.get(inn.team) ?? 0) - (out.team === inn.team ? 1 : 0);
      if (inClub + 1 > ctx.clubLimit) {
        unrepairable.push(`transfer ${label}: ${shortNames[inn.team]} bi imao ${inClub + 1} igrača (limit ${ctx.clubLimit})`);
        continue;
      }
      clubCount.set(out.team, (clubCount.get(out.team) ?? 1) - 1);
      clubCount.set(inn.team, (clubCount.get(inn.team) ?? 0) + 1);
      bank = newBank;
      validMoves.push({
        ...m,
        netSpend: Math.round((inPrice - outPrice) * 10) / 10,
        out: { ...m.out, name: out.web_name, team: shortNames[out.team], position: POS[out.element_type], price: outPrice },
        in: { ...m.in, name: inn.web_name, team: shortNames[inn.team], position: POS[inn.element_type], price: inPrice },
      });
    }
    plan.moves = validMoves.map((m, i) => ({ ...m, priority: i + 1 }));
    plan.transfersUsed = validMoves.length;
    if (Math.abs((plan.bankAfter ?? 0) - bank) > 0.05) {
      repaired.push(`bankAfter ${plan.bankAfter} → ${bank.toFixed(1)}`);
      plan.bankAfter = Math.round(bank * 10) / 10;
    }
    if (validMoves.length === 0 && !["hold", "wildcard", "free_hit"].includes(plan.recommendation) && unrepairable.length === 0) {
      plan.recommendation = "hold";
      repaired.push("recommendation → hold (nema validnih poteza)");
    }
  }

  return { report, repaired, unrepairable };
}
