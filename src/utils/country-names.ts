/**
 * ISO 3166 country code → localized name lookup for football reps.
 * Includes the 48 confirmed/eligible nations at World Cup 2026 plus extras.
 */

type Lang = "bs" | "en";

const NAMES: Record<string, { bs: string; en: string }> = {
  // CONMEBOL
  ar: { bs: "Argentina", en: "Argentina" },
  br: { bs: "Brazil", en: "Brazil" },
  bo: { bs: "Bolivija", en: "Bolivia" },
  cl: { bs: "Čile", en: "Chile" },
  co: { bs: "Kolumbija", en: "Colombia" },
  ec: { bs: "Ekvador", en: "Ecuador" },
  py: { bs: "Paragvaj", en: "Paraguay" },
  pe: { bs: "Peru", en: "Peru" },
  uy: { bs: "Urugvaj", en: "Uruguay" },
  ve: { bs: "Venezuela", en: "Venezuela" },

  // CONCACAF
  mx: { bs: "Meksiko", en: "Mexico" },
  us: { bs: "SAD", en: "USA" },
  ca: { bs: "Kanada", en: "Canada" },
  cr: { bs: "Kostarika", en: "Costa Rica" },
  hn: { bs: "Honduras", en: "Honduras" },
  pa: { bs: "Panama", en: "Panama" },
  jm: { bs: "Jamajka", en: "Jamaica" },
  ht: { bs: "Haiti", en: "Haiti" },
  cw: { bs: "Curaçao", en: "Curaçao" },
  sv: { bs: "Salvador", en: "El Salvador" },

  // UEFA
  de: { bs: "Njemačka", en: "Germany" },
  es: { bs: "Španija", en: "Spain" },
  fr: { bs: "Francuska", en: "France" },
  it: { bs: "Italija", en: "Italy" },
  nl: { bs: "Holandija", en: "Netherlands" },
  pt: { bs: "Portugal", en: "Portugal" },
  be: { bs: "Belgija", en: "Belgium" },
  ch: { bs: "Švicarska", en: "Switzerland" },
  hr: { bs: "Hrvatska", en: "Croatia" },
  rs: { bs: "Srbija", en: "Serbia" },
  pl: { bs: "Poljska", en: "Poland" },
  at: { bs: "Austrija", en: "Austria" },
  dk: { bs: "Danska", en: "Denmark" },
  no: { bs: "Norveška", en: "Norway" },
  se: { bs: "Švedska", en: "Sweden" },
  fi: { bs: "Finska", en: "Finland" },
  is: { bs: "Island", en: "Iceland" },
  cz: { bs: "Češka", en: "Czechia" },
  sk: { bs: "Slovačka", en: "Slovakia" },
  hu: { bs: "Mađarska", en: "Hungary" },
  ro: { bs: "Rumunija", en: "Romania" },
  bg: { bs: "Bugarska", en: "Bulgaria" },
  ua: { bs: "Ukrajina", en: "Ukraine" },
  tr: { bs: "Turska", en: "Turkey" },
  gr: { bs: "Grčka", en: "Greece" },
  ba: { bs: "Bosna i Hercegovina", en: "Bosnia & Herzegovina" },
  mk: { bs: "Sjeverna Makedonija", en: "North Macedonia" },
  me: { bs: "Crna Gora", en: "Montenegro" },
  si: { bs: "Slovenija", en: "Slovenia" },
  al: { bs: "Albanija", en: "Albania" },
  ie: { bs: "Irska", en: "Ireland" },
  "gb-eng": { bs: "Engleska", en: "England" },
  "gb-sct": { bs: "Škotska", en: "Scotland" },
  "gb-wls": { bs: "Vels", en: "Wales" },
  "gb-nir": { bs: "Sjeverna Irska", en: "Northern Ireland" },
  gb: { bs: "Velika Britanija", en: "United Kingdom" },
  ru: { bs: "Rusija", en: "Russia" },
  by: { bs: "Bjelorusija", en: "Belarus" },

  // AFC
  jp: { bs: "Japan", en: "Japan" },
  kr: { bs: "Južna Koreja", en: "South Korea" },
  ir: { bs: "Iran", en: "Iran" },
  sa: { bs: "Saudijska Arabija", en: "Saudi Arabia" },
  qa: { bs: "Katar", en: "Qatar" },
  au: { bs: "Australija", en: "Australia" },
  uz: { bs: "Uzbekistan", en: "Uzbekistan" },
  jo: { bs: "Jordan", en: "Jordan" },
  iq: { bs: "Irak", en: "Iraq" },
  ae: { bs: "UAE", en: "UAE" },
  cn: { bs: "Kina", en: "China" },

  // CAF
  ma: { bs: "Maroko", en: "Morocco" },
  sn: { bs: "Senegal", en: "Senegal" },
  ng: { bs: "Nigerija", en: "Nigeria" },
  gh: { bs: "Gana", en: "Ghana" },
  ci: { bs: "Obala Slonovače", en: "Ivory Coast" },
  eg: { bs: "Egipat", en: "Egypt" },
  tn: { bs: "Tunis", en: "Tunisia" },
  dz: { bs: "Alžir", en: "Algeria" },
  cm: { bs: "Kamerun", en: "Cameroon" },
  cd: { bs: "DR Kongo", en: "DR Congo" },
  cv: { bs: "Kape Verde", en: "Cape Verde" },
  za: { bs: "Južna Afrika", en: "South Africa" },
  ml: { bs: "Mali", en: "Mali" },

  // OFC
  nz: { bs: "Novi Zeland", en: "New Zealand" },
};

export function localizeTeamName(
  name: string | null | undefined,
  code: string | null | undefined,
  lang: Lang,
): string {
  if (code) {
    const entry = NAMES[code.toLowerCase()];
    if (entry) return entry[lang];
  }
  return name || "";
}

export function localizedCountry(
  code: string | null | undefined,
  fallback: string,
  lang: Lang,
): string {
  if (!code) return fallback;
  const entry = NAMES[code.toLowerCase()];
  return entry ? entry[lang] : fallback;
}
