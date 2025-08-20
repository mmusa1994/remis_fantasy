import { LeagueConfig, Prize, RegistrationFormConfig } from "./types";

// Premier League configuration
export const premierLeagueConfig: LeagueConfig = {
  id: "premier",
  name: "Premier League",
  title: "Premier League",
  subtitle: "Fantasy Liga",
  description:
    "Dobrodošli u najuzbudljiviju Premier League fantasy ligu! Registrujte se, osvojite nevjerovatne nagrade i pokažite svoje znanje fudbala.",
  logo: "/images/logos/pl-logo.png",
  baseColor: "purple",
  basePath: "/premier-league",
  available: true,
  stats: [
    { label: "Ukupan nagradni fond", value: "8000 KM", icon: "DollarSign" },
    { label: "Broj liga", value: "4", icon: "Trophy" },
    { label: "Mjesečne nagrade", value: "10x", icon: "Calendar" },
    { label: "Kup nagrade", value: "2x", icon: "Medal" },
  ],
  navigation: [
    { name: "Registracija", href: "/premier-league/registracija" },
    { name: "Nagrade", href: "/premier-league/nagrade" },
    { name: "Galerija", href: "/premier-league/galerija" },
    { name: "Tabele", href: "/premier-league/tabele" },
  ],
  quickNavigation: [
    {
      title: "Registracija",
      description: "Registruj se za sve dostupne lige",
      href: "/premier-league/registracija",
      icon: "PenTool",
      color: "purple",
      name: "Registracija",
    },
    {
      title: "Nagrade",
      description: "Pogledaj sve dostupne nagrade",
      href: "/premier-league/nagrade",
      icon: "Trophy",
      color: "yellow",
      name: "Nagrade",
    },
    {
      title: "Galerija",
      description: "Slike i memorije prethodnih sezona",
      href: "/premier-league/galerija",
      icon: "Camera",
      color: "blue",
      name: "Galerija",
    },
    {
      title: "Tabele",
      description: "Trenutni rezultati i tabele",
      href: "/premier-league/tabele",
      icon: "BarChart3",
      color: "green",
      name: "Tabele",
    },
  ],
};

// Premier League prizes
export const premierLeaguePrizes: Prize[] = [
  {
    id: 1,
    title: "Dobrodošli u novu sezonu",
    subtitle: "REMIS Fantasy 2025/26",
    image: "/images/new-season/Intro.png",
    description:
      "Spremite se za najuzbudljiviju sezonu fantasy footballa! Nove lige, veće nagrade, bolje iskustvo.",
    tier: "intro",
    league: "premier",
    features: [
      "Nova sezona kreće",
      "Povećane nagrade",
      "4 različite lige",
      "Najbolja i najzabavnija sezona ikad",
    ],
  },
  {
    id: 2,
    title: "Free Liga",
    subtitle: "Sezona 25/26 - Besplatno!",
    image: "/images/new-season/free.png",
    description:
      "Prošlogodišnji učesnici automatski ubačeni. Najbolji dobija originalni dres!",
    tier: "free",
    league: "premier",
    price: "Besplatno",
    features: ["1. mjesto: Originalni dres", "Kod za ulazak: 51kkl0"],
  },
  {
    id: 3,
    title: "H2H Liga",
    subtitle: "40 učesnika - Head-to-Head",
    image: "/images/new-season/h2h.png",
    description:
      "Najnepredvidivija liga sa bogatim nagradnim fondom od 720 KM / 368 €.",
    tier: "h2h",
    league: "premier",
    price: "20 KM / 10 €",
    features: [
      "1. mjesto: 300 KM / 155 € + pehar + medalja + plaketa",
      "2. mjesto: 200 KM / 102 € + medalja + plaketa",
      "3. mjesto: 130 KM / 67 € + medalja + plaketa",
      "4. mjesto: 90 KM / 46 €",
    ],
  },
  {
    id: 4,
    title: "Standard Liga",
    subtitle: "100 učesnika - Klasa i tradicija",
    image: "/images/new-season/standard.png",
    description:
      "Standardna liga s mjesečnim i kup nagradama. Nagradni fond 2.400 KM / 1.228 €.",
    tier: "standard",
    league: "premier",
    price: "30 KM / 15 €",
    features: [
      "1. mjesto: 500 KM / 255 € + pehar + medalja + plaketa",
      "2. mjesto: 350 KM / 179 € + medalja + plaketa",
      "3. mjesto: 250 KM / 128 € + medalja + plaketa",
      "4. mjesto: 200 KM / 103 €",
      "5. mjesto: 150 KM / 77 €",
      "6. mjesto: 100 KM / 52 €",
      "7. mjesto: 80 KM / 41 €",
      "8.-10. mjesto: Besplatno učešće naredne sezone",
      "Mjesečne nagrade: 75 KM / 38 € (*10)",
      "Kup nagrade: 100 KM / 52 €",
    ],
  },
  {
    id: 5,
    title: "Premium Liga",
    subtitle: "50 učesnika - Vrhunsko iskustvo",
    image: "/images/new-season/premium.png",
    description:
      "Najekskluzivnija liga s najvećim nagradama i posebnim privilegijama. Fond 4.000 KM / 2.050 €.",
    tier: "premium",
    league: "premier",
    price: "100 KM / 52 €",
    features: [
      "1. mjesto: 1.200 KM / 615 € + pehar + medalja + plaketa",
      "2. mjesto: 700 KM / 358 € + medalja + plaketa",
      "3. mjesto: 400 KM / 205 € + medalja + plaketa",
      "4. mjesto: Originalni dres PL 25/26",
      "5. mjesto: Besplatno učešće naredne sezone",
      "Mjesečne nagrade: 150 KM / 75 € (*10)",
      "Kup nagrade: 200 KM / 100 €",
    ],
  },
  {
    id: 6,
    title: "Specijalna nagrada",
    subtitle: "AUTENTIČNI DRES ARSENALA IZ SEZONE 2003/2004",
    image: "/images/form/arsenal.png",
    description:
      'Original! Ovo je sveti gral svakog fudbalskog fanatika. Dres iz legendarne "Invincibles" sezone - kada su Thierry Henry i Arsenal bez poraza osvojili Premier ligu.',
    tier: "arsenal",
    league: "premier",
    price: "Dres Thierry Henry 03/04",
    features: [
      "Hall of Fame Premier lige",
      "Henry - ikona igre, genije napada, umjetnik na terenu. Ovaj dres nosi DNK nepobjedivosti. Na aukcijama dostiže vrijednost preko 1.000€, rijetkost koja se ne pušta iz ruku.",
      "Igrač sa najviše poena u jednom kolu (PREMIUM liga) odnosi ovu istorijsku relikviju, zajedno sa certifikatom autentičnosti.",
      "OVO NIJE SAMO NAGRADA. OVO JE LEGENDA.",
      "Ovo je dres kojim ispisujete svoju stranicu u istoriji REMIS Fantasy lige",
      "Budi najbolji. Uđi u legendu. Osvoji dres nepobjedivih.",
    ],
  },
];

// Premier League registration form configuration
export const premierLeagueRegistrationConfig: RegistrationFormConfig = {
  leagueOptions: [
    {
      id: "standard",
      name: "Standard Liga",
      price: "15€ / 30KM",
      image: "/images/form/standard-form.png",
      description: "Klasična liga sa osnovnim nagradama",
      colors: {
        border: "border-sky-400",
        bg: "bg-sky-400/10",
        hover: "hover:border-sky-400/50",
        text: "text-sky-300",
        badge: "bg-gradient-to-r from-sky-400 to-gray-600",
        badgeRing: "ring-sky-400/50",
      },
    },
    {
      id: "premium",
      name: "Premium Liga",
      price: "50€ / 100KM",
      image: "/images/form/premium-form.png",
      description: "VIP liga sa ekskluzivnim nagradama",
      colors: {
        border: "border-yellow-400",
        bg: "bg-yellow-400/10",
        hover: "hover:border-yellow-400/50",
        text: "text-yellow-300",
        badge: "bg-gradient-to-r from-yellow-400 to-gray-600",
        badgeRing: "ring-yellow-400/50",
      },
    },
  ],
  h2hOption: {
    id: "h2h",
    name: "H2H Liga",
    price: "10€ / 20KM",
    image: "/images/form/h2h-form.png",
    description: "Head-to-Head dodatna liga sa posebnim nagradama",
    colors: {
      border: "border-red-500",
      bg: "bg-red-500/10",
      hover: "hover:border-red-500/50",
      text: "text-white",
      badge: "bg-gradient-to-r from-red-500 to-gray-600",
      badgeRing: "ring-red-500/50",
    },
  },
  paymentMethods: [
    {
      id: "bank",
      name: "Bankovni Račun",
      icon: "Building2Icon",
      color: "purple",
    },
    {
      id: "wise",
      name: "Wise",
      icon: "CreditCardIcon",
      color: "green",
    },
    {
      id: "paypal",
      name: "PayPal",
      icon: "CreditCardIcon",
      color: "blue",
    },
    {
      id: "cash",
      name: "Keš",
      icon: "BanknoteIcon",
      color: "yellow",
    },
  ],
  paymentInstructions: {
    wise: {
      title: "Wise Uplata",
      description:
        "Za Wise uplatu, pronađite korisnika putem email adrese i pošaljite novac:",
      details: {
        email: "muhamed.musa1994@gmail.com",
        note: "U opis uplate navedite vaše ime i tip lige koje se prijavljujete.",
      },
    },
    paypal: {
      title: "PayPal Uplata",
      description: "Za PayPal uplatu, pošaljite novac na:",
      details: {
        username: "@Majda598 (Majda Ahmečković)",
      },
      note: "Dodajte proviziju za PayPal od 3€. U opis uplate navedite vaše ime i tip lige.",
    },
  },
};
