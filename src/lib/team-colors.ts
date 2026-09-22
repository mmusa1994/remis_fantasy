/**
 * Premier League club identity colours + home-kit definitions.
 *
 * KEYED BY FPL `short_name` (ARS, LIV, MCI...) — the only club key FPL keeps
 * stable between seasons. The numeric `team` id on a player is season-scoped:
 * FPL renumbers 1..20 alphabetically every August, so promotions shift every
 * club below the newcomer. An id-keyed colour table therefore mismaps most of
 * the league the moment the alphabet changes — which is exactly what happened
 * when the 25/26 ids were left in place for 26/27 (Liverpool rendered Man Utd's
 * red, Man City rendered Newcastle's black, and the promoted clubs fell through
 * to grey).
 *
 * A number passed to `getTeamColors` is ALWAYS read as a season team id,
 * resolved via the map registered from bootstrap-static (`registerFplTeams`)
 * and falling back to `CURRENT_SEASON_TEAM_IDS`. Season ids and FPL's permanent
 * club codes share the 1..20 range (Arsenal's code is 3, which is also
 * Bournemouth's 26/27 id), so codes get their own entry point —
 * `getTeamColorsByCode` — and `getPlayerTeamColors` prefers it. Never feed a
 * code into `getTeamColors`.
 */

export type KitPattern = "solid" | "stripes" | "halves" | "sash";

export interface TeamKit {
  /** Display name, matching FPL's own `team.name`. */
  name: string;
  shortName: string;
  /** FPL's permanent club code — stable across seasons. */
  code: number;

  /** Brand colour for bars, badges, accent text. Always clearly visible. */
  primary: string;
  /** Brand secondary colour. */
  secondary: string;

  /** Dominant home-shirt colour. */
  shirt: string;
  /** Second shirt colour — stripes, halves, sash. */
  shirtAlt: string;
  /** Sleeve colour (Arsenal's white sleeves, Villa's sky sleeves...). */
  sleeve: string;
  /** Collar / cuff detail. */
  trim: string;
  pattern: KitPattern;
  /** Goalkeeper shirt colour — keepers never wear the outfield kit. */
  gk: string;
  /** Readable ink on top of `shirt`. */
  onShirt: string;
}

const DARK_INK = "#1F2937";
const LIGHT_INK = "#FFFFFF";

/**
 * Black or white ink, whichever stays readable on `hex`.
 *
 * Club colours span Newcastle black to Man City sky blue and Wolves gold, so a
 * hardcoded white label is unreadable on roughly a fifth of the league. The
 * threshold sits above the pure WCAG cross-over point (~0.18) so strong reds
 * like Arsenal's keep white text, which is both expected and still above 4.5:1.
 */
export const readableInk = (hex: string): string => {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex?.trim() ?? "");
  if (!match) return LIGHT_INK;

  const value = parseInt(match[1], 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map(
    (c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    }
  );
  const luminance =
    0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];

  return luminance > 0.25 ? DARK_INK : LIGHT_INK;
};

const relativeLuminance = (hex: string): number => {
  const value = parseInt(hex.slice(1), 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map(
    (c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    }
  );
  return (
    0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
  );
};

const contrastRatio = (a: string, b: string): number => {
  const la = relativeLuminance(a) + 0.05;
  const lb = relativeLuminance(b) + 0.05;
  return Math.max(la, lb) / Math.min(la, lb);
};

/** Shift a colour toward black (negative) or white (positive) by `amount`. */
const shade = (hex: string, amount: number): string => {
  const value = parseInt(hex.slice(1), 16);
  const next = [(value >> 16) & 255, (value >> 8) & 255, value & 255]
    .map((c) =>
      amount < 0
        ? Math.round(c * (1 + amount))
        : Math.round(c + (255 - c) * amount)
    )
    .map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, "0"))
    .join("");
  return `#${next}`;
};

export interface TeamBadge {
  /** Background for a small coloured badge. */
  bg: string;
  /** Ink that is readable on `bg`. */
  ink: string;
}

/**
 * Background + ink for a small club badge (player initials, team chips).
 *
 * Most club colours clear WCAG AA against one ink or the other straight away.
 * The bright reds — Arsenal, Sunderland, Sheffield Utd — sit just under 4.5:1
 * against BOTH white and black, and flipping those to black ink reads wrong for
 * the club, so the surface is deepened a few percent instead. The colour stays
 * recognisably theirs and the label becomes properly readable.
 */
export const teamBadge = (hex: string): TeamBadge => {
  const base = /^#[0-9a-f]{6}$/i.test(hex?.trim() ?? "") ? hex.trim() : "#6B7280";
  const ink = readableInk(base);

  // Push the surface away from the ink — deeper under white text, lighter under
  // dark text — so the club's hue survives while the label becomes readable.
  // Capped at 25%: past that it stops looking like the club.
  const direction = ink === LIGHT_INK ? -1 : 1;
  let bg = base;
  for (let step = 1; contrastRatio(bg, ink) < 4.5 && step <= 5; step++) {
    bg = shade(base, direction * 0.05 * step);
  }

  return { bg, ink };
};

export const TEAM_KITS: Record<string, TeamKit> = {
  ARS: {
    name: "Arsenal",
    shortName: "ARS",
    code: 3,
    primary: "#EF0107",
    secondary: "#FFFFFF",
    shirt: "#EF0107",
    shirtAlt: "#FFFFFF",
    sleeve: "#FFFFFF",
    trim: "#063672",
    pattern: "solid",
    gk: "#23B14D",
    onShirt: LIGHT_INK,
  },
  AVL: {
    name: "Aston Villa",
    shortName: "AVL",
    code: 7,
    primary: "#670E36",
    secondary: "#95BFE5",
    shirt: "#670E36",
    shirtAlt: "#95BFE5",
    sleeve: "#95BFE5",
    trim: "#FFE600",
    pattern: "solid",
    gk: "#2CE3A0",
    onShirt: LIGHT_INK,
  },
  BOU: {
    name: "Bournemouth",
    shortName: "BOU",
    code: 91,
    primary: "#DA291C",
    secondary: "#000000",
    shirt: "#DA291C",
    shirtAlt: "#000000",
    sleeve: "#000000",
    trim: "#FFFFFF",
    pattern: "stripes",
    gk: "#43C46A",
    onShirt: LIGHT_INK,
  },
  BRE: {
    name: "Brentford",
    shortName: "BRE",
    code: 94,
    primary: "#E30613",
    secondary: "#FFFFFF",
    shirt: "#E30613",
    shirtAlt: "#FFFFFF",
    sleeve: "#FFFFFF",
    trim: "#000000",
    pattern: "stripes",
    gk: "#F5D44C",
    onShirt: LIGHT_INK,
  },
  BHA: {
    name: "Brighton",
    shortName: "BHA",
    code: 36,
    primary: "#0057B8",
    secondary: "#FFCD00",
    shirt: "#0057B8",
    shirtAlt: "#FFFFFF",
    sleeve: "#FFFFFF",
    trim: "#FFCD00",
    pattern: "stripes",
    gk: "#F2F23C",
    onShirt: LIGHT_INK,
  },
  CHE: {
    name: "Chelsea",
    shortName: "CHE",
    code: 8,
    primary: "#034694",
    secondary: "#FFFFFF",
    shirt: "#034694",
    shirtAlt: "#FFFFFF",
    sleeve: "#034694",
    trim: "#FFFFFF",
    pattern: "solid",
    gk: "#F0E14A",
    onShirt: LIGHT_INK,
  },
  COV: {
    name: "Coventry City",
    shortName: "COV",
    code: 9,
    primary: "#4B92DB",
    secondary: "#FFFFFF",
    shirt: "#4B92DB",
    shirtAlt: "#FFFFFF",
    sleeve: "#4B92DB",
    trim: "#FFFFFF",
    pattern: "solid",
    gk: "#2ECC71",
    onShirt: DARK_INK,
  },
  CRY: {
    name: "Crystal Palace",
    shortName: "CRY",
    code: 31,
    primary: "#1B458F",
    secondary: "#C4122E",
    shirt: "#C4122E",
    shirtAlt: "#1B458F",
    sleeve: "#1B458F",
    trim: "#FFFFFF",
    pattern: "stripes",
    gk: "#F4E04D",
    onShirt: LIGHT_INK,
  },
  EVE: {
    name: "Everton",
    shortName: "EVE",
    code: 11,
    primary: "#003399",
    secondary: "#FFFFFF",
    shirt: "#003399",
    shirtAlt: "#FFFFFF",
    sleeve: "#003399",
    trim: "#FFFFFF",
    pattern: "solid",
    gk: "#F7E03C",
    onShirt: LIGHT_INK,
  },
  FUL: {
    // White shirt, black shorts — brand colour stays black so bars/text
    // built on `primary` remain visible on a light background.
    name: "Fulham",
    shortName: "FUL",
    code: 54,
    primary: "#000000",
    secondary: "#FFFFFF",
    shirt: "#FFFFFF",
    shirtAlt: "#000000",
    sleeve: "#FFFFFF",
    trim: "#000000",
    pattern: "solid",
    gk: "#E8453C",
    onShirt: DARK_INK,
  },
  HUL: {
    name: "Hull City",
    shortName: "HUL",
    code: 88,
    primary: "#F5A12D",
    secondary: "#000000",
    shirt: "#F5A12D",
    shirtAlt: "#000000",
    sleeve: "#000000",
    trim: "#FFFFFF",
    pattern: "stripes",
    gk: "#3FBF6F",
    onShirt: DARK_INK,
  },
  IPS: {
    name: "Ipswich Town",
    shortName: "IPS",
    code: 40,
    primary: "#3A64A3",
    secondary: "#FFFFFF",
    shirt: "#3A64A3",
    shirtAlt: "#FFFFFF",
    sleeve: "#FFFFFF",
    trim: "#FFFFFF",
    pattern: "solid",
    gk: "#E8E84A",
    onShirt: LIGHT_INK,
  },
  LEE: {
    // White shirt with blue/yellow trim — the old table had yellow as the
    // shirt colour, which is the away kit at best.
    name: "Leeds",
    shortName: "LEE",
    code: 2,
    primary: "#1D428A",
    secondary: "#FFCD00",
    shirt: "#FFFFFF",
    shirtAlt: "#1D428A",
    sleeve: "#FFFFFF",
    trim: "#1D428A",
    pattern: "solid",
    gk: "#FFCD00",
    onShirt: DARK_INK,
  },
  LIV: {
    name: "Liverpool",
    shortName: "LIV",
    code: 14,
    primary: "#C8102E",
    secondary: "#00B2A9",
    shirt: "#C8102E",
    shirtAlt: "#00B2A9",
    sleeve: "#C8102E",
    trim: "#F6EB61",
    pattern: "solid",
    gk: "#2FD566",
    onShirt: LIGHT_INK,
  },
  MCI: {
    name: "Man City",
    shortName: "MCI",
    code: 43,
    primary: "#6CABDD",
    secondary: "#1C2C5B",
    shirt: "#6CABDD",
    shirtAlt: "#FFFFFF",
    sleeve: "#6CABDD",
    trim: "#1C2C5B",
    pattern: "solid",
    gk: "#E6F24B",
    onShirt: DARK_INK,
  },
  MUN: {
    name: "Man Utd",
    shortName: "MUN",
    code: 1,
    primary: "#DA291C",
    secondary: "#FBE122",
    shirt: "#DA291C",
    shirtAlt: "#000000",
    sleeve: "#DA291C",
    trim: "#FBE122",
    pattern: "solid",
    gk: "#2FBF71",
    onShirt: LIGHT_INK,
  },
  NEW: {
    name: "Newcastle",
    shortName: "NEW",
    code: 4,
    primary: "#241F20",
    secondary: "#FFFFFF",
    shirt: "#241F20",
    shirtAlt: "#FFFFFF",
    sleeve: "#241F20",
    trim: "#FFFFFF",
    pattern: "stripes",
    gk: "#57E08A",
    onShirt: LIGHT_INK,
  },
  NFO: {
    name: "Nott'm Forest",
    shortName: "NFO",
    code: 17,
    primary: "#DD0000",
    secondary: "#FFFFFF",
    shirt: "#DD0000",
    shirtAlt: "#FFFFFF",
    sleeve: "#DD0000",
    trim: "#FFFFFF",
    pattern: "solid",
    gk: "#F2E34C",
    onShirt: LIGHT_INK,
  },
  TOT: {
    // White shirt, navy shorts — navy stays the brand colour.
    name: "Spurs",
    shortName: "TOT",
    code: 6,
    primary: "#132257",
    secondary: "#FFFFFF",
    shirt: "#FFFFFF",
    shirtAlt: "#132257",
    sleeve: "#FFFFFF",
    trim: "#132257",
    pattern: "solid",
    gk: "#1BE38B",
    onShirt: DARK_INK,
  },
  SUN: {
    name: "Sunderland",
    shortName: "SUN",
    code: 56,
    primary: "#EB172B",
    secondary: "#FFFFFF",
    shirt: "#EB172B",
    shirtAlt: "#FFFFFF",
    sleeve: "#000000",
    trim: "#FFFFFF",
    pattern: "stripes",
    gk: "#3CCB6E",
    onShirt: LIGHT_INK,
  },

  // --- Recently relegated / historical clubs -------------------------------
  // Kept so season-history pages and archived league tables still colour
  // correctly. `code` is only filled in where it has been verified.
  BUR: {
    name: "Burnley",
    shortName: "BUR",
    code: 90,
    primary: "#6C1D45",
    secondary: "#99D6EA",
    shirt: "#6C1D45",
    shirtAlt: "#99D6EA",
    sleeve: "#99D6EA",
    trim: "#FFFFFF",
    pattern: "solid",
    gk: "#F2E34C",
    onShirt: LIGHT_INK,
  },
  WHU: {
    name: "West Ham",
    shortName: "WHU",
    code: 21,
    primary: "#7A263A",
    secondary: "#1BB1E7",
    shirt: "#7A263A",
    shirtAlt: "#1BB1E7",
    sleeve: "#1BB1E7",
    trim: "#FFFFFF",
    pattern: "solid",
    gk: "#F4E04D",
    onShirt: LIGHT_INK,
  },
  WOL: {
    name: "Wolves",
    shortName: "WOL",
    code: 39,
    primary: "#FDB913",
    secondary: "#231F20",
    shirt: "#FDB913",
    shirtAlt: "#231F20",
    sleeve: "#FDB913",
    trim: "#231F20",
    pattern: "solid",
    gk: "#2F9E68",
    onShirt: DARK_INK,
  },
  LEI: {
    name: "Leicester",
    shortName: "LEI",
    code: 13,
    primary: "#003090",
    secondary: "#FDBE11",
    shirt: "#003090",
    shirtAlt: "#FDBE11",
    sleeve: "#003090",
    trim: "#FDBE11",
    pattern: "solid",
    gk: "#46D07A",
    onShirt: LIGHT_INK,
  },
  SOU: {
    name: "Southampton",
    shortName: "SOU",
    code: 20,
    primary: "#D71920",
    secondary: "#FFFFFF",
    shirt: "#D71920",
    shirtAlt: "#FFFFFF",
    sleeve: "#FFFFFF",
    trim: "#000000",
    pattern: "stripes",
    gk: "#F2E34C",
    onShirt: LIGHT_INK,
  },
  SHU: {
    name: "Sheffield Utd",
    shortName: "SHU",
    code: 49,
    primary: "#EE2737",
    secondary: "#FFFFFF",
    shirt: "#EE2737",
    shirtAlt: "#FFFFFF",
    sleeve: "#000000",
    trim: "#FFFFFF",
    pattern: "stripes",
    gk: "#3CCB6E",
    onShirt: LIGHT_INK,
  },
};

/**
 * Team ids for the CURRENT season (2026/27), read from FPL bootstrap-static on
 * 2026-09-22. Only a fallback — `registerFplTeams()` overrides it with live
 * data, so this going stale next August degrades to "slightly wrong until the
 * first bootstrap response", not "wrong all season".
 */
export const CURRENT_SEASON_TEAM_IDS: Record<number, string> = {
  1: "ARS",
  2: "AVL",
  3: "BOU",
  4: "BRE",
  5: "BHA",
  6: "CHE",
  7: "COV",
  8: "CRY",
  9: "EVE",
  10: "FUL",
  11: "HUL",
  12: "IPS",
  13: "LEE",
  14: "LIV",
  15: "MCI",
  16: "MUN",
  17: "NEW",
  18: "NFO",
  19: "TOT",
  20: "SUN",
};

const CODE_TO_SHORT = new Map<number, string>();
for (const kit of Object.values(TEAM_KITS)) {
  if (kit.code) CODE_TO_SHORT.set(kit.code, kit.shortName);
}

/** Season id → short name, populated from bootstrap-static at runtime. */
let seasonIdToShort: Record<number, string> = {};
/** Season id → display name, so a club with no kit on file still reads right. */
let seasonIdToName: Record<number, string> = {};

/**
 * Feed the live `teams` array from bootstrap-static so numeric team ids map to
 * the right club for whatever season the API is serving. Safe to call on every
 * bootstrap response — it simply replaces the map.
 */
export const registerFplTeams = (
  teams:
    | Array<{ id: number; short_name?: string; code?: number; name?: string }>
    | null
    | undefined
): void => {
  if (!Array.isArray(teams) || teams.length === 0) return;

  const nextShort: Record<number, string> = {};
  const nextName: Record<number, string> = {};
  for (const team of teams) {
    if (typeof team?.id !== "number") continue;
    const short =
      (team.short_name && TEAM_KITS[team.short_name.toUpperCase()]?.shortName) ||
      (typeof team.code === "number" ? CODE_TO_SHORT.get(team.code) : undefined) ||
      team.short_name?.toUpperCase();
    if (!short) continue;
    nextShort[team.id] = short;
    if (team.name) nextName[team.id] = team.name;
  }

  if (Object.keys(nextShort).length > 0) {
    seasonIdToShort = nextShort;
    seasonIdToName = nextName;
  }
};

const unknownKit = (label: string, name = label): TeamKit => ({
  name,
  shortName: label,
  code: 0,
  primary: "#6B7280",
  secondary: "#9CA3AF",
  shirt: "#6B7280",
  shirtAlt: "#9CA3AF",
  sleeve: "#6B7280",
  trim: "#E5E7EB",
  pattern: "solid",
  gk: "#9CA3AF",
  onShirt: LIGHT_INK,
});

export const getTeamIdFromShortName = (shortName: string): number => {
  const short = shortName?.toUpperCase();
  const fromSeason = Object.entries(seasonIdToShort).find(
    ([, value]) => value === short
  );
  if (fromSeason) return Number(fromSeason[0]);

  const fromCurrent = Object.entries(CURRENT_SEASON_TEAM_IDS).find(
    ([, value]) => value === short
  );
  return fromCurrent ? Number(fromCurrent[0]) : 0;
};

/**
 * Colours + kit for a club. Accepts a short name ("LIV"), a season team id
 * (`player.team`) or FPL's permanent club code (`player.team_code`).
 */
export const getTeamColors = (teamId: number | string): TeamKit => {
  if (typeof teamId === "string") {
    const short = teamId.toUpperCase();
    return TEAM_KITS[short] || unknownKit(short || "—");
  }

  const short = seasonIdToShort[teamId] || CURRENT_SEASON_TEAM_IDS[teamId];
  if (short && TEAM_KITS[short]) return TEAM_KITS[short];

  // A club FPL knows but this table does not — a freshly promoted side before
  // its kit is added. Keep its real identity and just render it neutral grey,
  // never another club's colours.
  return unknownKit(short || `T${teamId}`, seasonIdToName[teamId] || short || `Team ${teamId}`);
};

/**
 * Colours + kit from FPL's permanent club code (`team.code` /
 * `player.team_code`). Season-independent, so this never needs re-checking in
 * August. Returns null for a club with no kit on file.
 */
export const getTeamColorsByCode = (code: number): TeamKit | null => {
  const short = CODE_TO_SHORT.get(code);
  return (short && TEAM_KITS[short]) || null;
};

/**
 * Colours + kit for a player, preferring the permanent club code and falling
 * back to the season team id. This is the lookup UI components should use.
 */
export const getPlayerTeamColors = (player: {
  team?: number;
  team_code?: number;
}): TeamKit => {
  if (typeof player?.team_code === "number") {
    const byCode = getTeamColorsByCode(player.team_code);
    if (byCode) return byCode;
  }
  return getTeamColors(player?.team ?? 0);
};
