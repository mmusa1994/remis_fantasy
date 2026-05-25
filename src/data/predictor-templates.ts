// =============================================================
// Predictor Templates. predefinisani turniri koje admin uvozi
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
  label_en?: string;
  value?: string;
  group_label?: string;
  group_label_en?: string;
  image_url?: string;
  metadata?: Record<string, unknown>;
}

export interface TemplateCategory {
  name: string;
  name_en?: string;
  slug: string;
  description?: string;
  description_en?: string;
  category_type: CategoryType;
  points_correct: number;
  points_partial?: number;
  points_ranked_bonus?: number;
  max_selections?: number;
  sort_order: number;
  rules_md?: string;
  rules_md_en?: string;
  options?: TemplateOption[];
}

export interface TemplateRule {
  kind: RuleKind;
  title: string;
  title_en?: string;
  body_md?: string;
  body_md_en?: string;
  sort_order?: number;
}

export interface TemplateReward {
  rank_position?: number | null;
  title: string;
  title_en?: string;
  description?: string;
  description_en?: string;
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
  logo_url?: string;
  starts_at?: string;
  ends_at?: string;
  registration_lock_at?: string;
  prize_pool_amount?: number;
  prize_pool_currency?: string;
  rules_md?: string;
  point_system_md?: string;
  eligibility_md?: string;
  categories: TemplateCategory[];
  rules?: TemplateRule[];
  rewards?: TemplateReward[];
  /**
   * If set, the seeding helper will also import the matching match-set
   * template (see predictor-match-templates.ts). This is how WC 2026 gets
   * its 104 official matches imported on a single "Pick template + create"
   * click for the end user.
   */
  defaultMatchTemplateId?: string;
  /** Default scoring values applied to every match in the template */
  defaultMatchScoring?: {
    points_exact: number;
    points_diff: number;
    points_winner: number;
  };
  /** Auto-enable music player on tournament page */
  theme_music_enabled?: boolean;
  /** Auto-set background image */
  theme_background_image?: string;
}

// helper to attach a country flag image (flagcdn.com is free, no key)
const flag = (cc: string) => `https://flagcdn.com/w40/${cc}.png`;

// -------------------------------------------------------------
// 1) FIFA Svjetsko prvenstvo 2026. 48 KVALIFIKOVANIH EKIPA
// Grupe nakon ždrijeba decembra 2025 (zvanični raspored FIFA)
// -------------------------------------------------------------
const T = (
  label: string,
  code: string,
  group: string,
  label_en?: string,
): TemplateOption => ({
  label,
  label_en: label_en ?? label,
  group_label: group,
  group_label_en: group.replace("Grupa", "Group"),
  value: code,
  image_url: flag(code),
});

const WC_2026_TEAMS: TemplateOption[] = [
  // Grupa A
  T("Meksiko", "mx", "Grupa A", "Mexico"),
  T("Južna Afrika", "za", "Grupa A", "South Africa"),
  T("Južna Koreja", "kr", "Grupa A", "South Korea"),
  T("Češka", "cz", "Grupa A", "Czech Republic"),
  // Grupa B
  T("Kanada", "ca", "Grupa B", "Canada"),
  T("Bosna i Hercegovina", "ba", "Grupa B", "Bosnia and Herzegovina"),
  T("Katar", "qa", "Grupa B", "Qatar"),
  T("Švicarska", "ch", "Grupa B", "Switzerland"),
  // Grupa C
  T("Brazil", "br", "Grupa C"),
  T("Maroko", "ma", "Grupa C", "Morocco"),
  T("Haiti", "ht", "Grupa C"),
  T("Škotska", "gb-sct", "Grupa C", "Scotland"),
  // Grupa D
  T("SAD", "us", "Grupa D", "USA"),
  T("Paragvaj", "py", "Grupa D", "Paraguay"),
  T("Australija", "au", "Grupa D", "Australia"),
  T("Turska", "tr", "Grupa D", "Turkey"),
  // Grupa E
  T("Njemačka", "de", "Grupa E", "Germany"),
  T("Kurasao", "cw", "Grupa E", "Curaçao"),
  T("Obala Slonovače", "ci", "Grupa E", "Ivory Coast"),
  T("Ekvador", "ec", "Grupa E", "Ecuador"),
  // Grupa F
  T("Holandija", "nl", "Grupa F", "Netherlands"),
  T("Japan", "jp", "Grupa F"),
  T("Švedska", "se", "Grupa F", "Sweden"),
  T("Tunis", "tn", "Grupa F", "Tunisia"),
  // Grupa G
  T("Belgija", "be", "Grupa G", "Belgium"),
  T("Egipat", "eg", "Grupa G", "Egypt"),
  T("Iran", "ir", "Grupa G"),
  T("Novi Zeland", "nz", "Grupa G", "New Zealand"),
  // Grupa H
  T("Španija", "es", "Grupa H", "Spain"),
  T("Zelenortska", "cv", "Grupa H", "Cape Verde"),
  T("Saudijska Arabija", "sa", "Grupa H", "Saudi Arabia"),
  T("Urugvaj", "uy", "Grupa H", "Uruguay"),
  // Grupa I
  T("Francuska", "fr", "Grupa I", "France"),
  T("Senegal", "sn", "Grupa I"),
  T("Irak", "iq", "Grupa I", "Iraq"),
  T("Norveška", "no", "Grupa I", "Norway"),
  // Grupa J
  T("Argentina", "ar", "Grupa J"),
  T("Alžir", "dz", "Grupa J", "Algeria"),
  T("Austrija", "at", "Grupa J", "Austria"),
  T("Jordan", "jo", "Grupa J"),
  // Grupa K
  T("Portugal", "pt", "Grupa K"),
  T("DR Kongo", "cd", "Grupa K", "DR Congo"),
  T("Uzbekistan", "uz", "Grupa K"),
  T("Kolumbija", "co", "Grupa K", "Colombia"),
  // Grupa L
  T("Engleska", "gb-eng", "Grupa L", "England"),
  T("Hrvatska", "hr", "Grupa L", "Croatia"),
  T("Gana", "gh", "Grupa L", "Ghana"),
  T("Panama", "pa", "Grupa L"),
];

// Group advancement categories. user predicts which teams advance from each group.
// FIFA WC 2026 format: 48 teams, 12 groups of 4 → 32 advance.
// Groups A–H: top 3 advance (8 × 3 = 24)
// Groups I–L: top 2 advance (4 × 2 = 8)
// Total: 24 + 8 = 32
const WC_2026_GROUPS_3 = ["A", "B", "C", "D", "E", "F", "G", "H"];
const WC_2026_GROUPS_2 = ["I", "J", "K", "L"];
const WC_2026_GROUP_LETTERS = [...WC_2026_GROUPS_3, ...WC_2026_GROUPS_2];

// All 12 groups allow 2 or 3 selections. The cross-category constraint
// (max 8 groups with 3 picks, rest must have 2, total = 32) is enforced
// on the public prediction page via the "grupa-prolaz" slug pattern.
const wc2026GroupCategories: TemplateCategory[] = WC_2026_GROUP_LETTERS.map(
  (letter, idx) => {
    const groupLabel = `Grupa ${letter}`;
    const groupLabelEn = `Group ${letter}`;
    const teams = WC_2026_TEAMS.filter((t) => t.group_label === groupLabel);
    return {
      name: `Ko prolazi - ${groupLabel}`,
      name_en: `Who advances - ${groupLabelEn}`,
      slug: `grupa-${letter.toLowerCase()}-prolaz`,
      description:
        `Odaberi 2 ili 3 ekipe koje prolaze iz ${groupLabel.toLowerCase()}. Ukupno 32 ekipe moraju proći (max 8 grupa sa po 3).`,
      description_en:
        `Pick 2 or 3 teams advancing from ${groupLabelEn.toLowerCase()}. Total 32 teams must advance (max 8 groups with 3).`,
      category_type: "ranked_top_n" as CategoryType,
      points_correct: 15,
      points_partial: 3,
      points_ranked_bonus: 2,
      max_selections: 3,
      sort_order: 20 + idx,
      rules_md:
        "Odaberi 2 ili 3 ekipe po grupi. Max 8 grupa smije imati 3 odabrane ekipe (ukupno 32 prolaze).",
      rules_md_en:
        "Pick 2 or 3 teams per group. Max 8 groups can have 3 picks (32 total advance).",
      options: teams,
    };
  },
);

const worldCup2026: PredictorTemplate = {
  id: "world-cup-2026",
  name: "Svjetsko prvenstvo 2026",
  short_description:
    "FIFA Svjetsko prvenstvo 2026. predikcije za pobjednika, top strijelca, najboljeg igrača i još mnogo toga.",
  long_description:
    "Najveći fudbalski događaj na svijetu se vraća. prvi put sa 48 reprezentacija na 3 kontinenta. Predvidi sve i bori se za nagrade.",
  accent_color: "gold",
  logo_url: "/images/logos/wc-logo.png",
  starts_at: "2026-06-11T19:00:00.000Z",
  ends_at: "2026-07-19T21:00:00.000Z",
  registration_lock_at: "2026-06-11T18:00:00.000Z",
  defaultMatchTemplateId: "wc-2026-full",
  defaultMatchScoring: {
    points_exact: 3,
    points_diff: 0,
    points_winner: 1,
  },
  theme_music_enabled: true,
  theme_background_image: "/wc2026/wc-bg-2.webp",
  prize_pool_amount: 1000,
  prize_pool_currency: "EUR",
  rules_md:
    "Predikcije se zaključavaju prije utakmice otvaranja Svjetskog prvenstva. Svaka kategorija se boduje nezavisno. Konačni rezultati se objavljuju nakon finala.",
  point_system_md:
    "Pobjednik turnira. 100 poena\nFinalisti (oba). 60 poena\nTop 4 ekipe (tačan redoslijed). 80 poena, parcijalni 10 po pogotku, 5 bonus za tačan rang\nZlatna kopačka. 50 poena\nNajbolji igrač. 50 poena\nNajbolji golman. 40 poena\nIznenađenje / razočarenje. 30 poena\nUkupno golova. 30 poena",
  eligibility_md:
    "Otvoreno za sve registrovane korisnike Remis Fantasy platforme.",
  categories: [
    {
      name: "Pobjednik turnira",
      name_en: "Tournament winner",
      slug: "pobjednik",
      description: "Koja reprezentacija osvaja Svjetsko prvenstvo 2026?",
      description_en: "Which national team wins the 2026 World Cup?",
      category_type: "single_choice",
      points_correct: 100,
      points_partial: 0,
      max_selections: 1,
      sort_order: 1,
      options: WC_2026_TEAMS,
    },
    {
      name: "Zlatna kopačka (najbolji strijelac)",
      name_en: "Golden Boot (top scorer)",
      slug: "zlatna-kopacka",
      description: "Ko će biti najbolji strijelac turnira?",
      description_en: "Who will be the tournament's top scorer?",
      category_type: "free_text",
      points_correct: 50,
      points_partial: 0,
      sort_order: 2,
    },
    {
      name: "Najbolji asistent",
      name_en: "Top assister",
      slug: "najbolji-asistent",
      description: "Igrač sa najviše asistencija na turniru.",
      description_en: "Player with most assists in the tournament.",
      category_type: "free_text",
      points_correct: 40,
      points_partial: 0,
      sort_order: 3,
    },
    ...wc2026GroupCategories,
  ],
  rules: [
    {
      kind: "deadline",
      title: "Rok za predikcije",
      title_en: "Predictions deadline",
      body_md:
        "Predikcije za sve kategorije se zaključavaju u trenutku početka prve utakmice turnira. Nakon toga izmjene nisu moguće.",
      body_md_en:
        "All categories lock at the kick-off of the tournament's opening match. No edits after that.",
      sort_order: 1,
    },
    {
      kind: "bonus",
      title: "Bonus za tačan rang u Top 4",
      title_en: "Top 4 exact-position bonus",
      body_md:
        "Pored 10 poena za svaku ekipu u Top 4, dobijaš dodatnih 5 poena ako je tvoja ekipa tačno na pravom mjestu (1., 2., 3., 4.).",
      body_md_en:
        "On top of 10 points per Top 4 team, you get +5 if your team lands in the exact position (1st, 2nd, 3rd, 4th).",
      sort_order: 2,
    },
    {
      kind: "rule",
      title: "Bodovanje utakmica",
      title_en: "Match scoring",
      body_md:
        "Tačan rezultat = 3 boda. Pogođen pobjednik ili neriješeno = 1 bod. Promašen ishod = 0 bodova.",
      body_md_en:
        "Exact score = 3 points. Correct outcome (winner or draw) = 1 point. Wrong prediction = 0 points.",
      sort_order: 3,
    },
    {
      kind: "eligibility",
      title: "Pravo učešća",
      title_en: "Eligibility",
      body_md:
        "Mogu učestvovati svi registrovani korisnici sa potvrđenim e-mailom.",
      body_md_en:
        "Open to all registered users with a confirmed e-mail.",
      sort_order: 4,
    },
  ],
  rewards: [
    {
      rank_position: 1,
      title: "1. mjesto",
      title_en: "1st place",
      description: "Glavna nagrada. pobjednik Predictor turnira.",
      description_en: "Main prize. Predictor tournament winner.",
      prize_type: "cash",
      prize_value: 500,
      prize_currency: "EUR",
      sort_order: 1,
    },
    {
      rank_position: 2,
      title: "2. mjesto",
      title_en: "2nd place",
      description: "Druga nagrada.",
      description_en: "Runner-up prize.",
      prize_type: "cash",
      prize_value: 300,
      prize_currency: "EUR",
      sort_order: 2,
    },
    {
      rank_position: 3,
      title: "3. mjesto",
      title_en: "3rd place",
      description: "Treća nagrada.",
      description_en: "Third place prize.",
      prize_type: "cash",
      prize_value: 200,
      prize_currency: "EUR",
      sort_order: 3,
    },
  ],
};

// -------------------------------------------------------------
// 2) UEFA Liga prvaka 2025/26. skeleton sa najjačim klubovima
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
    "UEFA Liga prvaka 2025/26. predikcije za pobjednika, finalu i najboljeg strijelca.",
  long_description:
    "Najjača klupska liga svijeta. predvidi ko će dignuti trofej.",
  accent_color: "blue",
  logo_url: "/images/logos/cl-logo.png",
  prize_pool_amount: 500,
  prize_pool_currency: "EUR",
  rules_md:
    "Predikcije se zaključavaju prije prve utakmice nokaut faze (osmina finala).",
  point_system_md:
    "Pobjednik LP. 80 poena\nFinalisti. 50 poena\nPolufinalisti (4 ekipe). 40 poena, 10 po pogotku\nNajbolji strijelac. 40 poena",
  categories: [
    {
      name: "Pobjednik Lige prvaka",
      name_en: "Champions League winner",
      slug: "pobjednik",
      description: "Klub koji osvaja Ligu prvaka 2025/26.",
      description_en: "The club that wins the 2025/26 Champions League.",
      category_type: "single_choice",
      points_correct: 80,
      max_selections: 1,
      sort_order: 1,
      options: CL_2526_TEAMS,
    },
    {
      name: "Finalisti (oba kluba)",
      name_en: "Finalists (both clubs)",
      slug: "finalisti",
      description: "Predvidi 2 kluba koja igraju finale.",
      description_en: "Pick the 2 clubs playing the final.",
      category_type: "multiple_choice",
      points_correct: 50,
      points_partial: 20,
      max_selections: 2,
      sort_order: 2,
      options: CL_2526_TEAMS,
    },
    {
      name: "Polufinalisti (4 kluba)",
      name_en: "Semi-finalists (4 clubs)",
      slug: "polufinalisti",
      description: "4 kluba koja prolaze u polufinale.",
      description_en: "The 4 clubs that reach the semi-finals.",
      category_type: "multiple_choice",
      points_correct: 40,
      points_partial: 10,
      max_selections: 4,
      sort_order: 3,
      options: CL_2526_TEAMS,
    },
    {
      name: "Najbolji strijelac",
      name_en: "Top scorer",
      slug: "najbolji-strijelac",
      description: "Najbolji strijelac u sezoni Lige prvaka.",
      description_en: "Top scorer across the Champions League season.",
      category_type: "free_text",
      points_correct: 40,
      sort_order: 4,
    },
    {
      name: "Najbolji igrač sezone",
      name_en: "Player of the season",
      slug: "najbolji-igrac",
      description: "UEFA Player of the Season.",
      description_en: "UEFA Player of the Season.",
      category_type: "free_text",
      points_correct: 40,
      sort_order: 5,
    },
  ],
  rules: [
    {
      kind: "deadline",
      title: "Rok za predikcije",
      title_en: "Predictions deadline",
      body_md:
        "Predikcije se zaključavaju u trenutku prve utakmice osmine finala.",
      body_md_en:
        "Predictions lock at the kick-off of the first Round of 16 match.",
      sort_order: 1,
    },
  ],
  rewards: [
    {
      rank_position: 1,
      title: "1. mjesto",
      title_en: "1st place",
      prize_type: "cash",
      prize_value: 250,
      prize_currency: "EUR",
      sort_order: 1,
    },
    {
      rank_position: 2,
      title: "2. mjesto",
      title_en: "2nd place",
      prize_type: "cash",
      prize_value: 150,
      prize_currency: "EUR",
      sort_order: 2,
    },
    {
      rank_position: 3,
      title: "3. mjesto",
      title_en: "3rd place",
      prize_type: "cash",
      prize_value: 100,
      prize_currency: "EUR",
      sort_order: 3,
    },
  ],
};

// -------------------------------------------------------------
// 3) Premier League 2025/26. sezonske predikcije
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
    "Sezonske predikcije za Premier League. prvak, top 4, ispadanja, najbolji strijelac.",
  accent_color: "purple",
  logo_url: "/images/logos/pl-logo.png",
  prize_pool_amount: 300,
  prize_pool_currency: "EUR",
  categories: [
    {
      name: "Šampion Premier Lige",
      name_en: "Premier League champion",
      slug: "sampion",
      category_type: "single_choice",
      points_correct: 60,
      sort_order: 1,
      options: PL_2526_TEAMS,
    },
    {
      name: "Top 4 ekipe (Liga prvaka)",
      name_en: "Top 4 teams (Champions League)",
      slug: "top-4",
      description: "Ekipe koje završavaju u top 4 i kvalifikuju se za LP.",
      description_en: "Teams finishing top 4 and qualifying for the Champions League.",
      category_type: "multiple_choice",
      points_correct: 40,
      points_partial: 10,
      max_selections: 4,
      sort_order: 2,
      options: PL_2526_TEAMS,
    },
    {
      name: "3 ekipe koje ispadaju",
      name_en: "3 relegated teams",
      slug: "ispadanja",
      description: "Ekipe koje završavaju na pozicijama 18, 19, 20.",
      description_en: "The teams finishing 18th, 19th, and 20th.",
      category_type: "multiple_choice",
      points_correct: 40,
      points_partial: 12,
      max_selections: 3,
      sort_order: 3,
      options: PL_2526_TEAMS,
    },
    {
      name: "Najbolji strijelac (Zlatna kopačka)",
      name_en: "Top scorer (Golden Boot)",
      slug: "zlatna-kopacka",
      category_type: "free_text",
      points_correct: 30,
      sort_order: 4,
    },
    {
      name: "Najbolji asistent",
      name_en: "Top assister",
      slug: "najbolji-asistent",
      category_type: "free_text",
      points_correct: 25,
      sort_order: 5,
    },
    {
      name: "Player of the Season",
      name_en: "Player of the Season",
      slug: "pots",
      category_type: "free_text",
      points_correct: 30,
      sort_order: 6,
    },
    {
      name: "Manager of the Season",
      name_en: "Manager of the Season",
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
      title_en: "Deadline",
      body_md: "Predikcije se zaključavaju prije prve utakmice sezone.",
      body_md_en: "Predictions lock at the kick-off of the first match of the season.",
      sort_order: 1,
    },
  ],
  rewards: [
    {
      rank_position: 1,
      title: "1. mjesto",
      title_en: "1st place",
      prize_type: "cash",
      prize_value: 150,
      prize_currency: "EUR",
      sort_order: 1,
    },
    {
      rank_position: 2,
      title: "2. mjesto",
      title_en: "2nd place",
      prize_type: "cash",
      prize_value: 100,
      prize_currency: "EUR",
      sort_order: 2,
    },
    {
      rank_position: 3,
      title: "3. mjesto",
      title_en: "3rd place",
      prize_type: "cash",
      prize_value: 50,
      prize_currency: "EUR",
      sort_order: 3,
    },
  ],
};

// -------------------------------------------------------------
// 4) Bundesliga 2025/26. lightweight (no teams seeded, user fills)
// -------------------------------------------------------------
const bundesliga2526: PredictorTemplate = {
  id: "bundesliga-25-26",
  name: "Bundesliga 2025/26",
  short_description:
    "Sezonske predikcije za Bundesligu. prvak, top 3, ispadanja, najbolji strijelac.",
  accent_color: "red",
  logo_url: "/logos/bundes.png",
  prize_pool_currency: "EUR",
  categories: [
    {
      name: "Prvak Bundeslige",
      name_en: "Bundesliga champion",
      slug: "prvak",
      category_type: "free_text",
      points_correct: 60,
      sort_order: 1,
    },
    {
      name: "Top 3 ekipe",
      name_en: "Top 3 teams",
      slug: "top-3",
      description: "Tri najbolja na kraju sezone.",
      description_en: "Top three teams at the end of the season.",
      category_type: "free_text",
      points_correct: 40,
      points_partial: 12,
      sort_order: 2,
    },
    {
      name: "Najbolji strijelac",
      name_en: "Top scorer",
      slug: "top-scorer",
      category_type: "free_text",
      points_correct: 30,
      sort_order: 3,
    },
    {
      name: "Ekipe koje ispadaju",
      name_en: "Relegated teams",
      slug: "ispada",
      category_type: "free_text",
      points_correct: 30,
      sort_order: 4,
    },
  ],
};

// -------------------------------------------------------------
// 5) La Liga 2025/26. lightweight
// -------------------------------------------------------------
const laLiga2526: PredictorTemplate = {
  id: "la-liga-25-26",
  name: "La Liga 2025/26",
  short_description:
    "Sezonske predikcije za La Ligu. prvak, top 4, najbolji strijelac, Zamora trofej.",
  accent_color: "red",
  logo_url: "/logos/la-liga-logo.png",
  prize_pool_currency: "EUR",
  categories: [
    {
      name: "Prvak La Lige",
      name_en: "La Liga champion",
      slug: "prvak",
      category_type: "free_text",
      points_correct: 60,
      sort_order: 1,
    },
    {
      name: "Top 4 (Liga prvaka)",
      name_en: "Top 4 (Champions League)",
      slug: "top-4",
      category_type: "free_text",
      points_correct: 40,
      points_partial: 10,
      sort_order: 2,
    },
    {
      name: "Pichichi. najbolji strijelac",
      name_en: "Pichichi. top scorer",
      slug: "pichichi",
      category_type: "free_text",
      points_correct: 30,
      sort_order: 3,
    },
    {
      name: "Zamora. najbolji golman",
      name_en: "Zamora. best goalkeeper",
      slug: "zamora",
      category_type: "free_text",
      points_correct: 25,
      sort_order: 4,
    },
  ],
};

// -------------------------------------------------------------
// 6) EuroLeague Basketball. lightweight
// -------------------------------------------------------------
const euroleagueBasket: PredictorTemplate = {
  id: "euroleague-basket",
  name: "EuroLeague Košarka",
  short_description:
    "EuroLeague predikcije. Final Four, prvak, MVP, najbolji strijelac.",
  accent_color: "amber",
  logo_url: "/logos/eurliga.png",
  prize_pool_currency: "EUR",
  categories: [
    {
      name: "Prvak EuroLeague",
      name_en: "EuroLeague champion",
      slug: "prvak",
      category_type: "free_text",
      points_correct: 50,
      sort_order: 1,
    },
    {
      name: "Final Four",
      name_en: "Final Four",
      slug: "final-four",
      description: "Četiri ekipe koje se plasiraju na Final Four.",
      description_en: "The four teams that make it to the Final Four.",
      category_type: "free_text",
      points_correct: 35,
      points_partial: 8,
      sort_order: 2,
    },
    {
      name: "MVP sezone",
      name_en: "Season MVP",
      slug: "mvp",
      category_type: "free_text",
      points_correct: 25,
      sort_order: 3,
    },
    {
      name: "Najbolji strijelac",
      name_en: "Top scorer",
      slug: "top-scorer",
      category_type: "free_text",
      points_correct: 20,
      sort_order: 4,
    },
  ],
};

// -------------------------------------------------------------
// 7) Formula 1 2026. lightweight
// -------------------------------------------------------------
const formula1_2026: PredictorTemplate = {
  id: "formula-1-2026",
  name: "Formula 1 2026",
  short_description:
    "F1 sezona. prvak vozač, prvak konstruktor, najviše pobjeda, prva pole position.",
  accent_color: "red",
  logo_url: "/images/logos/f1.png",
  prize_pool_currency: "EUR",
  categories: [
    {
      name: "Prvak vozač",
      name_en: "Drivers' champion",
      slug: "drivers-champion",
      category_type: "free_text",
      points_correct: 60,
      sort_order: 1,
    },
    {
      name: "Prvak konstruktor",
      name_en: "Constructors' champion",
      slug: "constructors-champion",
      category_type: "free_text",
      points_correct: 50,
      sort_order: 2,
    },
    {
      name: "Najviše pobjeda u sezoni",
      name_en: "Most race wins in season",
      slug: "most-wins",
      category_type: "free_text",
      points_correct: 25,
      sort_order: 3,
    },
    {
      name: "Prva pole position sezone",
      name_en: "Season's first pole position",
      slug: "first-pole",
      category_type: "free_text",
      points_correct: 20,
      sort_order: 4,
    },
    {
      name: "Rookie of the season",
      name_en: "Rookie of the season",
      slug: "rookie",
      category_type: "free_text",
      points_correct: 15,
      sort_order: 5,
    },
  ],
};

// -------------------------------------------------------------
export const PREDICTOR_TEMPLATES: PredictorTemplate[] = [
  worldCup2026,
  championsLeague2526,
  premierLeague2526,
  bundesliga2526,
  laLiga2526,
  euroleagueBasket,
  formula1_2026,
];

export function getTemplate(id: string): PredictorTemplate | undefined {
  return PREDICTOR_TEMPLATES.find((t) => t.id === id);
}

/**
 * UI metadata for the public template picker. Lives next to the templates
 * so adding a new template auto-extends the picker.
 *
 * `brandBg` is rendered as a solid backdrop behind logos that have
 * transparent backgrounds (Premier League, Champions League). It keeps
 * the logo readable on white themes without resorting to loud gradients.
 */
export interface TemplatePickerMeta {
  id: string;
  /** i18n key under create.templates.items.{key} */
  i18nKey: string;
  /** Path to a public logo image, or null to render the monogram fallback. */
  logo: string | null;
  /** Two-letter monogram for the fallback chip */
  monogram: string;
  /** Solid backdrop colour for the logo tile (HEX). Null = transparent tile. */
  brandBg: string | null;
  /** Optional tailwind gradient if monogram fallback is used (no logo). */
  gradient?: string;
}

export const TEMPLATE_PICKER_META: TemplatePickerMeta[] = [
  {
    id: "world-cup-2026",
    i18nKey: "wc",
    logo: "/images/logos/wc-logo.png",
    monogram: "WC",
    brandBg: null,
  },
  {
    id: "premier-league-25-26",
    i18nKey: "pl",
    logo: "/images/logos/pl-logo.png",
    monogram: "PL",
    // Official Premier League purple
    brandBg: "#37003c",
  },
  {
    id: "champions-league-25-26",
    i18nKey: "cl",
    logo: "/images/logos/cl-logo.png",
    monogram: "CL",
    // Royal blue used by UEFA Champions League branding
    brandBg: "#0a1e54",
  },
  {
    id: "bundesliga-25-26",
    i18nKey: "bundes",
    logo: "/logos/bundes.png",
    monogram: "BL",
    brandBg: null,
  },
  {
    id: "la-liga-25-26",
    i18nKey: "laliga",
    logo: "/logos/la-liga-logo.png",
    monogram: "LL",
    brandBg: null,
  },
  {
    id: "euroleague-basket",
    i18nKey: "euroleague",
    logo: "/logos/eurliga.png",
    monogram: "EL",
    brandBg: null,
  },
  {
    id: "formula-1-2026",
    i18nKey: "f1",
    logo: "/images/logos/f1.png",
    monogram: "F1",
    brandBg: null,
  },
];
