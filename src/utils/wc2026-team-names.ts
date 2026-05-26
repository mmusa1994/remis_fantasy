const BS_TO_EN: Record<string, string> = {
  "Meksiko": "Mexico",
  "Južna Afrika": "South Africa",
  "Južna Koreja": "South Korea",
  "Češka": "Czech Republic",
  "Kanada": "Canada",
  "Bosna i Hercegovina": "Bosnia & Herzegovina",
  "Katar": "Qatar",
  "Švicarska": "Switzerland",
  "Brazil": "Brazil",
  "Maroko": "Morocco",
  "Haiti": "Haiti",
  "Škotska": "Scotland",
  "SAD": "United States",
  "Paragvaj": "Paraguay",
  "Australija": "Australia",
  "Turska": "Turkey",
  "Njemačka": "Germany",
  "Kurasao": "Curaçao",
  "Obala Slonovače": "Ivory Coast",
  "Ekvador": "Ecuador",
  "Holandija": "Netherlands",
  "Japan": "Japan",
  "Švedska": "Sweden",
  "Tunis": "Tunisia",
  "Belgija": "Belgium",
  "Egipat": "Egypt",
  "Iran": "Iran",
  "Novi Zeland": "New Zealand",
  "Španija": "Spain",
  "Zelenortska": "Cape Verde",
  "Saudijska Arabija": "Saudi Arabia",
  "Urugvaj": "Uruguay",
  "Francuska": "France",
  "Senegal": "Senegal",
  "Irak": "Iraq",
  "Norveška": "Norway",
  "Argentina": "Argentina",
  "Alžir": "Algeria",
  "Austrija": "Austria",
  "Jordan": "Jordan",
  "Portugal": "Portugal",
  "DR Kongo": "DR Congo",
  "Uzbekistan": "Uzbekistan",
  "Kolumbija": "Colombia",
  "Engleska": "England",
  "Hrvatska": "Croatia",
  "Gana": "Ghana",
  "Panama": "Panama",
};

const EN_TO_BS: Record<string, string> = {};
Object.entries(BS_TO_EN).forEach(([bs, en]) => {
  EN_TO_BS[en] = bs;
});

export function localizeTeamName(name: string, lang: "en" | "bs"): string {
  if (lang === "en") return BS_TO_EN[name] || name;
  if (lang === "bs") return EN_TO_BS[name] || name;
  return name;
}
