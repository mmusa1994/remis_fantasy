// Season helpers derived from live bootstrap-static data.
// Nothing here is hardcoded per season - kad FPL otvori novu sezonu, ovo se samo pomjeri.

export interface GameweekContext {
  seasonLabel: string; // "2026/27"
  seasonStartYear: number; // 2026
  currentGW: number | null; // kolo koje je u toku / zadnje odigrano
  nextGW: number | null; // kolo za koje se planira
  targetGW: number; // kolo na koje se analiza odnosi
  totalGWs: number;
  deadline: string | null; // ISO deadline targetGW-a
  hoursToDeadline: number | null;
  isDeadlineClose: boolean; // < 24h
  targetGWName: string;
}

interface BootstrapLike {
  events?: Array<{
    id: number;
    name?: string;
    deadline_time?: string;
    is_current?: boolean;
    is_next?: boolean;
    is_previous?: boolean;
    finished?: boolean;
  }>;
}

function seasonStartYearFromDate(date = new Date()): number {
  // FPL sezona kreće u julu/avgustu i nosi ime godine u kojoj je startala.
  return date.getUTCMonth() >= 6
    ? date.getUTCFullYear()
    : date.getUTCFullYear() - 1;
}

export function getSeasonStartYear(bootstrap?: BootstrapLike): number {
  const firstDeadline = bootstrap?.events?.[0]?.deadline_time;
  if (firstDeadline) {
    const parsed = new Date(firstDeadline);
    if (!Number.isNaN(parsed.getTime())) return parsed.getUTCFullYear();
  }
  return seasonStartYearFromDate();
}

export function formatSeasonLabel(startYear: number): string {
  return `${startYear}/${String((startYear + 1) % 100).padStart(2, "0")}`;
}

export function getSeasonLabel(bootstrap?: BootstrapLike): string {
  return formatSeasonLabel(getSeasonStartYear(bootstrap));
}

export function getGameweekContext(bootstrap?: BootstrapLike): GameweekContext {
  const events = bootstrap?.events ?? [];
  const current = events.find((e) => e.is_current) ?? null;
  const next = events.find((e) => e.is_next) ?? null;
  const seasonStartYear = getSeasonStartYear(bootstrap);

  const target = next ?? current ?? events[0] ?? null;
  const deadline = target?.deadline_time ?? null;
  const hoursToDeadline = deadline
    ? (new Date(deadline).getTime() - Date.now()) / 36e5
    : null;

  return {
    seasonLabel: formatSeasonLabel(seasonStartYear),
    seasonStartYear,
    currentGW: current?.id ?? null,
    nextGW: next?.id ?? null,
    targetGW: target?.id ?? 1,
    totalGWs: events.length || 38,
    deadline,
    hoursToDeadline,
    isDeadlineClose: hoursToDeadline !== null && hoursToDeadline <= 24,
    targetGWName: target?.name ?? `Gameweek ${target?.id ?? 1}`,
  };
}

// Godine koje pripadaju ranijim sezonama - koristi se za "pitanje je o staroj sezoni" guard.
export function getPastSeasonYears(
  bootstrap?: BootstrapLike,
  depth = 6
): string[] {
  const start = getSeasonStartYear(bootstrap);
  return Array.from({ length: depth }, (_, i) => String(start - 1 - i));
}
