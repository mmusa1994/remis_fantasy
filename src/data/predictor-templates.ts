// =============================================================
// Predictor Templates — predefinisani turniri koje admin uvozi
// jednim klikom (sve ekipe, kategorije, pravila, nagrade ubacene).
// =============================================================

import type {
  CategoryType,
  PrizeType,
  RuleKind,
  AccentColor,
} from "@/types/predictor";

export interface TemplateOption {
  label: string;
  value?: string;
  group_label?: string;
  image_url?: string;
  metadata?: Record<string, unknown>;
}

export interface TemplateCategory {
  name: string;
  slug: string;
  description?: string;
  category_type: CategoryType;
  points_correct: number;
  points_partial?: number;
  points_ranked_bonus?: number;
  max_selections?: number;
  sort_order: number;
  rules_md?: string;
  options?: TemplateOption[];
}

export interface TemplateRule {
  kind: RuleKind;
  title: string;
  body_md?: string;
  sort_order?: number;
}

export interface TemplateReward {
  rank_position?: number | null;
  title: string;
  description?: string;
  prize_type: PrizeType;
  prize_value?: number;
  prize_currency?: string;
  sponsor_name?: string;
  sort_order?: number;
}

export interface PredictorTemplate {
  id: string;
  name: string;
  short_description: string;
  long_description?: string;
  accent_color: AccentColor;
  banner_image_url?: string;
  hero_image_url?: string;
  logo_url?: string;
  prize_pool_amount?: number;
  prize_pool_currency?: string;
  rules_md?: string;
  point_system_md?: string;
  eligibility_md?: string;
  categories: TemplateCategory[];
  rules?: TemplateRule[];
  rewards?: TemplateReward[];
}

// helper to attach a country flag image (flagcdn.com is free, no key)
const flag = (cc: string) => `https://flagcdn.com/w80/${cc}.png`;

// -------------------------------------------------------------
// 1) FIFA Svjetsko prvenstvo 2026 — 48 KVALIFIKOVANIH EKIPA
// Grupe nakon ždrijeba decembra 2025 (zvanični raspored FIFA)
// -------------------------------------------------------------
const T = (label: string, code: string, group: string): TemplateOption => ({
  label,
  group_label: group,
  value: code,
  image_url: flag(code),
});

const WC_2026_TEAMS: TemplateOption[] = [
  // Grupa A
  T("Meksiko", "mx", "Grupa A"),
  T("Južna Afrika", "za", "Grupa A"),
  T("Južna Koreja", "kr", "Grupa A"),
  T("Češka", "cz", "Grupa A"),
  // Grupa B
  T("Kanada", "ca", "Grupa B"),
  T("Bosna i Hercegovina", "ba", "Grupa B"),
  T("Katar", "qa", "Grupa B"),
  T("Švicarska", "ch", "Grupa B"),
  // Grupa C
  T("Brazil", "br", "Grupa C"),
  T("Maroko", "ma", "Grupa C"),
  T("Haiti", "ht", "Grupa C"),
  T("Škotska", "gb-sct", "Grupa C"),
  // Grupa D
  T("SAD", "us", "Grupa D"),
  T("Paragvaj", "py", "Grupa D"),
  T("Australija", "au", "Grupa D"),
  T("Turska", "tr", "Grupa D"),
  // Grupa E
  T("Njemačka", "de", "Grupa E"),
  T("Kurasao", "cw", "Grupa E"),
  T("Obala Slonovače", "ci", "Grupa E"),
  T("Ekvador", "ec", "Grupa E"),
  // Grupa F
  T("Holandija", "nl", "Grupa F"),
  T("Japan", "jp", "Grupa F"),
  T("Švedska", "se", "Grupa F"),
  T("Tunis", "tn", "Grupa F"),
  // Grupa G
  T("Belgija", "be", "Grupa G"),
  T("Egipat", "eg", "Grupa G"),
  T("Iran", "ir", "Grupa G"),
  T("Novi Zeland", "nz", "Grupa G"),
  // Grupa H
  T("Španija", "es", "Grupa H"),
  T("Zelenortska", "cv", "Grupa H"),
  T("Saudijska Arabija", "sa", "Grupa H"),
  T("Urugvaj", "uy", "Grupa H"),
  // Grupa I
  T("Francuska", "fr", "Grupa I"),
  T("Senegal", "sn", "Grupa I"),
  T("Irak", "iq", "Grupa I"),
  T("Norveška", "no", "Grupa I"),
  // Grupa J
  T("Argentina", "ar", "Grupa J"),
  T("Alžir", "dz", "Grupa J"),
  T("Austrija", "at", "Grupa J"),
  T("Jordan", "jo", "Grupa J"),
  // Grupa K
  T("Portugal", "pt", "Grupa K"),
  T("DR Kongo", "cd", "Grupa K"),
  T("Uzbekistan", "uz", "Grupa K"),
  T("Kolumbija", "co", "Grupa K"),
  // Grupa L
  T("Engleska", "gb-eng", "Grupa L"),
  T("Hrvatska", "hr", "Grupa L"),
  T("Gana", "gh", "Grupa L"),
  T("Panama", "pa", "Grupa L"),
];

const worldCup2026: PredictorTemplate = {
  id: "world-cup-2026",
  name: "Svjetsko prvenstvo 2026",
  short_description:
    "FIFA Svjetsko prvenstvo 2026 — predikcije za pobjednika, top strijelca, najboljeg igrača i još mnogo toga.",
  long_description:
    "Najveći fudbalski događaj na svijetu se vraća — prvi put sa 48 reprezentacija na 3 kontinenta. Predvidi sve i bori se za nagrade.",
  accent_color: "gold",
  logo_url: "/images/logos/wc-logo.png",
  banner_image_url: "/images/logos/wc-logo.png",
  prize_pool_amount: 1000,
  prize_pool_currency: "EUR",
  rules_md:
    "Predikcije se zaključavaju prije utakmice otvaranja Svjetskog prvenstva. Svaka kategorija se boduje nezavisno. Konačni rezultati se objavljuju nakon finala.",
  point_system_md:
    "Pobjednik turnira — 100 poena\nFinalisti (oba) — 60 poena\nTop 4 ekipe (tačan redoslijed) — 80 poena, parcijalni 10 po pogotku, 5 bonus za tačan rang\nZlatna kopačka — 50 poena\nNajbolji igrač — 50 poena\nNajbolji golman — 40 poena\nIznenađenje / razočarenje — 30 poena\nUkupno golova — 30 poena",
  eligibility_md:
    "Otvoreno za sve registrovane korisnike Remis Fantasy platforme.",
  categories: [
    {
      name: "Pobjednik turnira",
      slug: "pobjednik",
      description: "Koja reprezentacija osvaja Svjetsko prvenstvo 2026?",
      category_type: "single_choice",
      points_correct: 100,
      points_partial: 0,
      max_selections: 1,
      sort_order: 1,
      options: WC_2026_TEAMS,
    },
    {
      name: "Top 4 ekipe (po redoslijedu)",
      slug: "top-4",
      description:
        "Predvidi prva 4 mjesta — 1. mjesto, 2. mjesto, polufinalisti.",
      category_type: "ranked_top_n",
      points_correct: 80,
      points_partial: 10,
      points_ranked_bonus: 5,
      max_selections: 4,
      sort_order: 2,
      options: WC_2026_TEAMS,
    },
    {
      name: "Zlatna kopačka (najbolji strijelac)",
      slug: "zlatna-kopacka",
      description: "Ko će biti najbolji strijelac turnira?",
      category_type: "free_text",
      points_correct: 50,
      points_partial: 0,
      sort_order: 3,
    },
    {
      name: "Najbolji igrač turnira (Zlatna lopta)",
      slug: "najbolji-igrac",
      description: "Ko će biti proglašen najboljim igračem turnira?",
      category_type: "free_text",
      points_correct: 50,
      points_partial: 0,
      sort_order: 4,
    },
    {
      name: "Najbolji golman (Zlatna rukavica)",
      slug: "najbolji-golman",
      description: "Ko će biti najbolji golman turnira?",
      category_type: "free_text",
      points_correct: 40,
      points_partial: 0,
      sort_order: 5,
    },
    {
      name: "Najbolji asistent",
      slug: "najbolji-asistent",
      description: "Igrač sa najviše asistencija na turniru.",
      category_type: "free_text",
      points_correct: 40,
      points_partial: 0,
      sort_order: 6,
    },
    {
      name: "Iznenađenje turnira",
      slug: "iznenadjenje",
      description:
        "Ekipa koja prevaziđe sva očekivanja (npr. doseže polufinale kao autsajder).",
      category_type: "team_selection",
      points_correct: 30,
      max_selections: 1,
      sort_order: 7,
      options: WC_2026_TEAMS,
    },
    {
      name: "Najveće razočarenje turnira",
      slug: "razocarenje",
      description:
        "Favorit koji ispada u ranoj fazi i podbacuje sva očekivanja.",
      category_type: "team_selection",
      points_correct: 30,
      max_selections: 1,
      sort_order: 8,
      options: WC_2026_TEAMS,
    },
    {
      name: "Ukupan broj golova na turniru",
      slug: "ukupno-golova",
      description: "Pogodi tačan broj golova postignutih u svim utakmicama.",
      category_type: "numeric",
      points_correct: 30,
      points_partial: 10,
      sort_order: 9,
    },
    {
      name: "Tačan rezultat finala",
      slug: "rezultat-finala",
      description: "Predvidi tačan rezultat finala (regularno vrijeme).",
      category_type: "exact_score",
      points_correct: 75,
      points_partial: 15,
      sort_order: 10,
    },
  ],
  rules: [
    {
      kind: "deadline",
      title: "Rok za predikcije",
      body_md:
        "Predikcije za sve kategorije se zaključavaju u trenutku početka prve utakmice turnira. Nakon toga izmjene nisu moguće.",
      sort_order: 1,
    },
    {
      kind: "bonus",
      title: "Bonus za tačan rang u Top 4",
      body_md:
        "Pored 10 poena za svaku ekipu u Top 4, dobijaš dodatnih 5 poena ako je tvoja ekipa tačno na pravom mjestu (1., 2., 3., 4.).",
      sort_order: 2,
    },
    {
      kind: "rule",
      title: "Bodovanje rezultata",
      body_md:
        "Tačan rezultat finala = 75 poena. Tačan pobjednik finala (bez pogađanja golova) = 15 poena.",
      sort_order: 3,
    },
    {
      kind: "eligibility",
      title: "Pravo učešća",
      body_md:
        "Mogu učestvovati svi registrovani korisnici sa potvrđenim e-mailom.",
      sort_order: 4,
    },
  ],
  rewards: [
    {
      rank_position: 1,
      title: "1. mjesto",
      description: "Glavna nagrada — pobjednik Predictor turnira.",
      prize_type: "cash",
      prize_value: 500,
      prize_currency: "EUR",
      sort_order: 1,
    },
    {
      rank_position: 2,
      title: "2. mjesto",
      description: "Druga nagrada.",
      prize_type: "cash",
      prize_value: 300,
      prize_currency: "EUR",
      sort_order: 2,
    },
    {
      rank_position: 3,
      title: "3. mjesto",
      description: "Treća nagrada.",
      prize_type: "cash",
      prize_value: 200,
      prize_currency: "EUR",
      sort_order: 3,
    },
  ],
};

// -------------------------------------------------------------
// 2) UEFA Liga prvaka 2025/26 — skeleton sa najjačim klubovima
// -------------------------------------------------------------
const CL_2526_TEAMS: TemplateOption[] = [
  { label: "Real Madrid", group_label: "La Liga" },
  { label: "Barcelona", group_label: "La Liga" },
  { label: "Atlético Madrid", group_label: "La Liga" },
  { label: "Athletic Bilbao", group_label: "La Liga" },
  { label: "Manchester City", group_label: "Premier League" },
  { label: "Liverpool", group_label: "Premier League" },
  { label: "Arsenal", group_label: "Premier League" },
  { label: "Chelsea", group_label: "Premier League" },
  { label: "Aston Villa", group_label: "Premier League" },
  { label: "Bayern Munich", group_label: "Bundesliga" },
  { label: "Bayer Leverkusen", group_label: "Bundesliga" },
  { label: "Borussia Dortmund", group_label: "Bundesliga" },
  { label: "RB Leipzig", group_label: "Bundesliga" },
  { label: "Eintracht Frankfurt", group_label: "Bundesliga" },
  { label: "PSG", group_label: "Ligue 1" },
  { label: "Monaco", group_label: "Ligue 1" },
  { label: "Marseille", group_label: "Ligue 1" },
  { label: "Inter Milan", group_label: "Serie A" },
  { label: "AC Milan", group_label: "Serie A" },
  { label: "Juventus", group_label: "Serie A" },
  { label: "Napoli", group_label: "Serie A" },
  { label: "Atalanta", group_label: "Serie A" },
  { label: "Bologna", group_label: "Serie A" },
  { label: "Benfica", group_label: "Portugal" },
  { label: "Sporting CP", group_label: "Portugal" },
  { label: "Porto", group_label: "Portugal" },
  { label: "PSV Eindhoven", group_label: "Eredivisie" },
  { label: "Feyenoord", group_label: "Eredivisie" },
  { label: "Ajax", group_label: "Eredivisie" },
  { label: "Celtic", group_label: "Scotland" },
  { label: "Galatasaray", group_label: "Turska" },
  { label: "Club Brugge", group_label: "Belgium" },
  { label: "Red Bull Salzburg", group_label: "Austria" },
  { label: "Sturm Graz", group_label: "Austria" },
  { label: "Young Boys", group_label: "Switzerland" },
  { label: "Slavia Prague", group_label: "Czech Republic" },
];

const championsLeague2526: PredictorTemplate = {
  id: "champions-league-25-26",
  name: "Liga prvaka 2025/26",
  short_description:
    "UEFA Liga prvaka 2025/26 — predikcije za pobjednika, finalu i najboljeg strijelca.",
  long_description:
    "Najjača klupska liga svijeta — predvidi ko će dignuti trofej.",
  accent_color: "blue",
  logo_url: "/images/logos/cl-logo.png",
  banner_image_url: "/images/logos/cl-logo.png",
  prize_pool_amount: 500,
  prize_pool_currency: "EUR",
  rules_md:
    "Predikcije se zaključavaju prije prve utakmice nokaut faze (osmina finala).",
  point_system_md:
    "Pobjednik LP — 80 poena\nFinalisti — 50 poena\nPolufinalisti (4 ekipe) — 40 poena, 10 po pogotku\nNajbolji strijelac — 40 poena",
  categories: [
    {
      name: "Pobjednik Lige prvaka",
      slug: "pobjednik",
      description: "Klub koji osvaja Ligu prvaka 2025/26.",
      category_type: "single_choice",
      points_correct: 80,
      max_selections: 1,
      sort_order: 1,
      options: CL_2526_TEAMS,
    },
    {
      name: "Finalisti (oba kluba)",
      slug: "finalisti",
      description: "Predvidi 2 kluba koja igraju finale.",
      category_type: "multiple_choice",
      points_correct: 50,
      points_partial: 20,
      max_selections: 2,
      sort_order: 2,
      options: CL_2526_TEAMS,
    },
    {
      name: "Polufinalisti (4 kluba)",
      slug: "polufinalisti",
      description: "4 kluba koja prolaze u polufinale.",
      category_type: "multiple_choice",
      points_correct: 40,
      points_partial: 10,
      max_selections: 4,
      sort_order: 3,
      options: CL_2526_TEAMS,
    },
    {
      name: "Najbolji strijelac",
      slug: "najbolji-strijelac",
      description: "Najbolji strijelac u sezoni Lige prvaka.",
      category_type: "free_text",
      points_correct: 40,
      sort_order: 4,
    },
    {
      name: "Najbolji igrač sezone",
      slug: "najbolji-igrac",
      description: "UEFA Player of the Season.",
      category_type: "free_text",
      points_correct: 40,
      sort_order: 5,
    },
  ],
  rules: [
    {
      kind: "deadline",
      title: "Rok za predikcije",
      body_md:
        "Predikcije se zaključavaju u trenutku prve utakmice osmine finala.",
      sort_order: 1,
    },
  ],
  rewards: [
    {
      rank_position: 1,
      title: "1. mjesto",
      prize_type: "cash",
      prize_value: 250,
      prize_currency: "EUR",
      sort_order: 1,
    },
    {
      rank_position: 2,
      title: "2. mjesto",
      prize_type: "cash",
      prize_value: 150,
      prize_currency: "EUR",
      sort_order: 2,
    },
    {
      rank_position: 3,
      title: "3. mjesto",
      prize_type: "cash",
      prize_value: 100,
      prize_currency: "EUR",
      sort_order: 3,
    },
  ],
};

// -------------------------------------------------------------
// 3) Premier League 2025/26 — sezonske predikcije
// -------------------------------------------------------------
const PL_2526_TEAMS: TemplateOption[] = [
  { label: "Liverpool" },
  { label: "Arsenal" },
  { label: "Manchester City" },
  { label: "Chelsea" },
  { label: "Manchester United" },
  { label: "Tottenham" },
  { label: "Newcastle United" },
  { label: "Aston Villa" },
  { label: "Brighton" },
  { label: "West Ham" },
  { label: "Crystal Palace" },
  { label: "Brentford" },
  { label: "Fulham" },
  { label: "Bournemouth" },
  { label: "Everton" },
  { label: "Wolves" },
  { label: "Nottingham Forest" },
  { label: "Leeds United" },
  { label: "Burnley" },
  { label: "Sunderland" },
];

const premierLeague2526: PredictorTemplate = {
  id: "premier-league-25-26",
  name: "Premier League 2025/26",
  short_description:
    "Sezonske predikcije za Premier League — prvak, top 4, ispadanja, najbolji strijelac.",
  accent_color: "purple",
  logo_url: "/images/logos/pl-logo.png",
  banner_image_url: "/images/logos/pl-logo.png",
  prize_pool_amount: 300,
  prize_pool_currency: "EUR",
  categories: [
    {
      name: "Šampion Premier Lige",
      slug: "sampion",
      category_type: "single_choice",
      points_correct: 60,
      sort_order: 1,
      options: PL_2526_TEAMS,
    },
    {
      name: "Top 4 ekipe (Liga prvaka)",
      slug: "top-4",
      description: "Ekipe koje završavaju u top 4 i kvalifikuju se za LP.",
      category_type: "multiple_choice",
      points_correct: 40,
      points_partial: 10,
      max_selections: 4,
      sort_order: 2,
      options: PL_2526_TEAMS,
    },
    {
      name: "3 ekipe koje ispadaju",
      slug: "ispadanja",
      description: "Ekipe koje završavaju na pozicijama 18, 19, 20.",
      category_type: "multiple_choice",
      points_correct: 40,
      points_partial: 12,
      max_selections: 3,
      sort_order: 3,
      options: PL_2526_TEAMS,
    },
    {
      name: "Najbolji strijelac (Zlatna kopačka)",
      slug: "zlatna-kopacka",
      category_type: "free_text",
      points_correct: 30,
      sort_order: 4,
    },
    {
      name: "Najbolji asistent",
      slug: "najbolji-asistent",
      category_type: "free_text",
      points_correct: 25,
      sort_order: 5,
    },
    {
      name: "Player of the Season",
      slug: "pots",
      category_type: "free_text",
      points_correct: 30,
      sort_order: 6,
    },
    {
      name: "Manager of the Season",
      slug: "mots",
      category_type: "free_text",
      points_correct: 20,
      sort_order: 7,
    },
  ],
  rules: [
    {
      kind: "deadline",
      title: "Rok",
      body_md: "Predikcije se zaključavaju prije prve utakmice sezone.",
      sort_order: 1,
    },
  ],
  rewards: [
    {
      rank_position: 1,
      title: "1. mjesto",
      prize_type: "cash",
      prize_value: 150,
      prize_currency: "EUR",
      sort_order: 1,
    },
    {
      rank_position: 2,
      title: "2. mjesto",
      prize_type: "cash",
      prize_value: 100,
      prize_currency: "EUR",
      sort_order: 2,
    },
    {
      rank_position: 3,
      title: "3. mjesto",
      prize_type: "cash",
      prize_value: 50,
      prize_currency: "EUR",
      sort_order: 3,
    },
  ],
};

// -------------------------------------------------------------
export const PREDICTOR_TEMPLATES: PredictorTemplate[] = [
  worldCup2026,
  championsLeague2526,
  premierLeague2526,
];

export function getTemplate(id: string): PredictorTemplate | undefined {
  return PREDICTOR_TEMPLATES.find((t) => t.id === id);
}
