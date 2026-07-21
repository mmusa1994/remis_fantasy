// FPL invite kodovi za sezonu 26/27. Popuniti kad lige budu kreirane na
// fantasy.premierleague.com — dok je vrijednost null, potvrdni email šalje
// napomenu da kod stiže naknadno umjesto koda.
export type PLLeagueKey = "standard" | "premium" | "h2h";

export const PL_LEAGUE_CODES: Record<PLLeagueKey, string | null> = {
  standard: null,
  premium: null,
  h2h: null,
};

// Koje lige pripadaju kojem registracijskom tieru — kombinovani tieri
// dobijaju kodove za obje lige.
export const PL_TIER_LEAGUES: Record<string, PLLeagueKey[]> = {
  standard: ["standard"],
  premium: ["premium"],
  h2h_only: ["h2h"],
  standard_h2h: ["standard", "h2h"],
  premium_h2h: ["premium", "h2h"],
};

export const PL_LEAGUE_NAMES: Record<PLLeagueKey, string> = {
  standard: "Standard liga",
  premium: "Premium liga",
  h2h: "H2H liga",
};
