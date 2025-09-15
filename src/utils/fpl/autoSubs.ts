export type PositionCode = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface SquadPlayer {
  id: number;
  position: PositionCode;
  isStarter: boolean;
  benchOrder?: number; // 1..3 for outfield bench
  isBenchGK?: boolean;
  minutes: number; // live minutes for GW
  points: number; // total points for GW (already includes bonus)
  multiplier: number; // 1 for normal, 2/3 for captains
  fixtureFinished: boolean;
}

export interface FormationCounts {
  GK: number;
  DEF: number;
  MID: number;
  FWD: number;
}

export interface AutoSubResult {
  appliedTeam: SquadPlayer[]; // final 11 after auto subs
  totalPoints: number; // sum(points * multiplier) for final 11
  subsApplied: Array<{ outId: number; inId: number; reason: string; orderUsed?: number }>; // orderUsed is benchOrder for outfield
  explanations: string[];
}

const MIN_DEFENDERS = 3;
const MIN_MIDFIELDERS = 2;
const MIN_FORWARDS = 1;
const REQUIRED_GOALKEEPER = 1;
const TEAM_SIZE = 11;

/**
 * Apply FPL auto-subs logic to a 15-man squad, respecting formation rules.
 * - Only replace DNP starters whose fixtures finished
 * - GK swaps only GK↔GK
 * - Outfield swaps follow bench order 1→2→3 and must keep DEF≥3 and total=11
 */
export function applyAutoSubs(squad: SquadPlayer[]): AutoSubResult {
  const starters = squad.filter((p) => p.isStarter);
  const benchGK = squad.find((p) => !p.isStarter && p.position === 'GK');
  const benchOutfield = squad
    .filter((p) => !p.isStarter && p.position !== 'GK')
    .sort((a, b) => (a.benchOrder || 99) - (b.benchOrder || 99));

  let team = [...starters];
  const subsApplied: AutoSubResult['subsApplied'] = [];
  const explanations: string[] = [];

  // DNP starters eligible for auto sub (minutes=0 and fixture finished)
  const dnpStarters = team.filter((p) => p.minutes === 0 && p.fixtureFinished === true);

  for (const out of dnpStarters) {
    if (out.position === 'GK') {
      if (benchGK && benchGK.minutes > 0) {
        team = swapIn(team, out, benchGK);
        subsApplied.push({ outId: out.id, inId: benchGK.id, reason: 'GK DNP' });
        explanations.push(`GK ${out.id} DNP → ${benchGK.id} in`);
      } else {
        explanations.push(`GK ${out.id} DNP but no eligible bench GK`);
      }
      continue;
    }

    // outfield
    let replaced = false;
    for (const candidate of benchOutfield) {
      if (candidate.minutes <= 0) continue;
      if (team.find((x) => x.id === candidate.id)) continue; // skip candidates already added by prior substitutions

      const tentative = swapIn(team, out, candidate);
      if (isValidFormation(tentative)) {
        team = tentative;
        subsApplied.push({ outId: out.id, inId: candidate.id, reason: 'Outfield DNP', orderUsed: candidate.benchOrder });
        explanations.push(`Out ${out.id} → ${candidate.id} (bench ${candidate.benchOrder})`);
        replaced = true;
        break;
      }
    }
    if (!replaced) explanations.push(`Outfield ${out.id} DNP but no valid bench sub`);
  }

  const totalPoints = team.reduce((sum, p) => sum + p.points * (p.multiplier || 1), 0);
  return { appliedTeam: team, totalPoints, subsApplied, explanations };
}

export function isValidFormation(players: SquadPlayer[]): boolean {
  const gk = players.filter((p) => p.position === 'GK').length;
  const def = players.filter((p) => p.position === 'DEF').length;
  const mid = players.filter((p) => p.position === 'MID').length;
  const fwd = players.filter((p) => p.position === 'FWD').length;
  return players.length === TEAM_SIZE && gk === REQUIRED_GOALKEEPER && def >= MIN_DEFENDERS && mid >= MIN_MIDFIELDERS && fwd >= MIN_FORWARDS;
}

function swapIn(team: SquadPlayer[], outPlayer: SquadPlayer, inPlayer: SquadPlayer): SquadPlayer[] {
  return team.filter((p) => p.id !== outPlayer.id).concat({ ...inPlayer, isStarter: true });
}

