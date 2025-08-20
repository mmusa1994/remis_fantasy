import { LeagueConfig } from "./types";

// Champions League configuration
export const championsLeagueConfig: LeagueConfig = {
  id: "champions",
  name: "Champions League",
  title: "Champions League",
  subtitle: "Fantasy Liga",
  description:
    "Dobrodošli u najprestižniju Champions League fantasy ligu! Registrujte se, kreirajte svoj evropski tim i takmičite se za fantastične nagrade u najjačem takmičenju.",
  logo: "/images/logos/cl-logo.png",
  baseColor: "blue",
  basePath: "/champions-league",
  available: true,
  stats: [
    { label: "Ukupan nagradni fond", value: "0 KM", icon: "DollarSign" },
    { label: "Broj liga", value: "0", icon: "Trophy" },
    { label: "Mjesečne nagrade", value: "0x", icon: "Calendar" },
    { label: "Finalne nagrade", value: "0x", icon: "Medal" },
  ],
  navigation: [
    { name: "Registracija", href: "/champions-league/registracija" },
    { name: "Nagrade", href: "/champions-league/nagrade" },
    { name: "Galerija", href: "/champions-league/galerija" },
    { name: "Tabele", href: "/champions-league/tabele" },
  ],
  quickNavigation: [
    {
      title: "Registracija",
      description: "Registruj se za Champions League",
      href: "/champions-league/registracija",
      icon: "PenTool",
      color: "blue",
      name: "Registracija",
    },
    {
      title: "Nagrade",
      description: "Pogledaj sve dostupne nagrade",
      href: "/champions-league/nagrade",
      icon: "Trophy",
      color: "yellow",
      name: "Nagrade",
    },
    {
      title: "Galerija",
      description: "Slike i memorije prethodnih sezona",
      href: "/champions-league/galerija",
      icon: "Camera",
      color: "purple",
      name: "Galerija",
    },
    {
      title: "Tabele",
      description: "Trenutni rezultati i tabele",
      href: "/champions-league/tabele",
      icon: "BarChart3",
      color: "green",
      name: "Tabele",
    },
  ],
};

// Champions League prizes (placeholder - currently under construction)
export const championsLeaguePrizes = [];

// Champions League construction page config
export const championsLeagueConstruction = {
  title: "Champions League Nagrade",
  description:
    "Nagrade za Champions League Fantasy ligu su u pripremi. Priprema se spektakularnih 5.200 KM nagradnog fonda za najjači evropski turnir!",
};
