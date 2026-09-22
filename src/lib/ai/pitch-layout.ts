// Geometrija "taktičke table" za AI loader: raspoređuje stvarnu postavu korisnika
// na pola terena (gol lijevo, napad desno) i generiše sekvence dodavanja.

export type Role = "GK" | "DEF" | "MID" | "FWD";

export interface SquadPlayer {
  name: string;
  /** FPL element_type: 1 GKP, 2 DEF, 3 MID, 4 FWD */
  type: number;
}

export interface PitchNode {
  id: number;
  x: number;
  y: number;
  role: Role;
  label: string;
  /** sekunda u kojoj reflektor "probudi" čvor (sinhronizovano sa prolaskom snopa) */
  wakeAt: number;
}

export const PITCH_W = 360;
export const PITCH_H = 200;
export const SCAN_S = 5.2;

const COL: Record<Role, number> = { GK: 40, DEF: 118, MID: 200, FWD: 282 };
const ROLE_OF: Record<number, Role> = { 1: "GK", 2: "DEF", 3: "MID", 4: "FWD" };
const CAP: Record<Role, number> = { GK: 1, DEF: 5, MID: 5, FWD: 3 };
const DEFAULT_COUNTS: Record<Role, number> = { GK: 1, DEF: 3, MID: 4, FWD: 3 };

export function layoutXI(xi: SquadPlayer[] | undefined): PitchNode[] {
  const roles: Role[] = ["GK", "DEF", "MID", "FWD"];
  const grouped: Record<Role, string[]> = { GK: [], DEF: [], MID: [], FWD: [] };
  for (const p of xi ?? []) {
    const role = ROLE_OF[p.type];
    if (role && grouped[role].length < CAP[role]) grouped[role].push(p.name);
  }
  const hasSquad = roles.some((r) => grouped[r].length > 0);

  const nodes: PitchNode[] = [];
  let id = 0;
  for (const role of roles) {
    const names = hasSquad ? grouped[role] : Array.from({ length: DEFAULT_COUNTS[role] }, () => "");
    const n = names.length;
    const spacing = n >= 5 ? 34 : n === 4 ? 40 : 46;
    names.forEach((name, i) => {
      const x = COL[role];
      const y = 100 + (i - (n - 1) / 2) * spacing;
      nodes.push({
        id: id++,
        x,
        y,
        role,
        label: name.length > 10 ? `${name.slice(0, 9)}.` : name,
        wakeAt: (SCAN_S * (x + 100)) / 480 + i * 0.06,
      });
    });
  }
  return nodes;
}

/** Nekoliko vjerodostojnih sekvenci dodavanja kroz linije (indeksi čvorova). */
export function passSequences(nodes: PitchNode[]): number[][] {
  const by = (role: Role) => nodes.filter((n) => n.role === role);
  const gk = by("GK");
  const def = by("DEF");
  const mid = by("MID");
  const fwd = by("FWD");
  const pick = (arr: PitchNode[], at: number) => arr[Math.max(0, Math.min(arr.length - 1, at))];
  const last = (arr: PitchNode[]) => arr[arr.length - 1];
  const mk = (...list: Array<PitchNode | undefined>) => {
    const ids = list.filter((n): n is PitchNode => !!n).map((n) => n.id);
    return ids.filter((v, i) => i === 0 || v !== ids[i - 1]);
  };
  const seqs = [
    mk(gk[0], def[0], mid[0], fwd[0]),
    mk(last(def), last(mid), last(fwd)),
    mk(pick(mid, Math.floor(mid.length / 2)), pick(def, 1), last(mid), fwd[0]),
    mk(gk[0], pick(def, Math.floor(def.length / 2)), pick(mid, 1), last(fwd)),
  ].filter((s) => s.length >= 2);
  return seqs.length ? seqs : [nodes.slice(0, 3).map((n) => n.id)];
}
