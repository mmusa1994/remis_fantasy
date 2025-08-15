import { LeagueConfig } from './types';

// F1 Fantasy configuration
export const f1FantasyConfig: LeagueConfig = {
  id: "f1",
  name: "F1 Fantasy",
  title: "F1 Fantasy",
  subtitle: "Racing Liga",
  description: "Dobrodošli u najuzbudljiviju F1 Fantasy ligu! Registrujte se, kreirajte svoj tim i osvojite fantastične nagrade kroz sezonu Formule 1.",
  logo: "/images/logos/f1.png",
  baseColor: "red",
  basePath: "/f1-fantasy",
  available: true,
  stats: [
    { label: "Ukupan nagradni fond", value: "4.800 KM", icon: "DollarSign" },
    { label: "Broj liga", value: "3", icon: "Trophy" },
    { label: "Mjesečne nagrade", value: "8x", icon: "Calendar" },
    { label: "Sezonske nagrade", value: "5x", icon: "Medal" },
  ],
  navigation: [
    { name: "Registracija", href: "/f1-fantasy/registracija" },
    { name: "Nagrade", href: "/f1-fantasy/nagrade" },
    { name: "Galerija", href: "/f1-fantasy/galerija" },
    { name: "Tabele", href: "/f1-fantasy/tabele" },
  ],
  quickNavigation: [
    {
      title: "Registracija",
      description: "Registruj se za F1 Fantasy ligu",
      href: "/f1-fantasy/registracija",
      icon: "PenTool",
      color: "red",
      name: "Registracija"
    },
    {
      title: "Nagrade",
      description: "Pogledaj sve dostupne nagrade",
      href: "/f1-fantasy/nagrade",
      icon: "Trophy",
      color: "yellow",
      name: "Nagrade"
    },
    {
      title: "Galerija",
      description: "Slike i memorije prethodnih sezona",
      href: "/f1-fantasy/galerija",
      icon: "Camera",
      color: "blue",
      name: "Galerija"
    },
    {
      title: "Tabele",
      description: "Trenutni rezultati i tabele",
      href: "/f1-fantasy/tabele",
      icon: "BarChart3",
      color: "green",
      name: "Tabele"
    },
  ]
};

// F1 Fantasy prizes (placeholder - currently under construction)
export const f1FantasyPrizes = [];

// F1 Fantasy construction page config
export const f1FantasyConstruction = {
  title: "F1 Fantasy Nagrade",
  description: "Nagrade za F1 Fantasy ligu su u pripremi! Očekuje vas 4.800 KM nagradnog fonda za najbrži sport na svetu!"
};