import Script from "next/script";

interface JsonLdProps {
  data: Record<string, any>;
}

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <Script
      id="json-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "REMIS Fantasy",
  description:
    "The ultimate FPL analytics platform featuring live mini league tables, AI-powered team recommendations, advanced player statistics, team news, best differentials, gameweek analysis, captain picks, and comprehensive Fantasy Premier League tools for FPL managers worldwide.",
  url: "https://remis-fantasy.com",
  logo: "https://remis-fantasy.com/images/rf-logo.svg",
  foundingDate: "2024",
  foundingLocation: {
    "@type": "Place",
    name: "Europe",
  },
  sameAs: [
    "https://facebook.com/remis_fantasy",
    "https://instagram.com/remis_fantasy",
    "https://twitter.com/remis_fantasy",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: ["English", "Serbian", "Bosnian"],
  },
  applicationCategory: "SportsApplication",
  applicationSubCategory: "Fantasy Sports Analytics",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    description: "Advanced FPL analytics and tools",
    category: "Sports Analytics Software"
  }
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "REMIS Fantasy",
  description:
    "The ultimate FPL analytics platform with live mini league tables, AI-powered team recommendations, advanced player statistics, team news, best differentials, gameweek analysis, captain picks, transfer suggestions, fixture difficulty ratings, bonus points prediction, and comprehensive Premier League data for FPL managers.",
  url: "https://remis-fantasy.com",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://remis-fantasy.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
  publisher: {
    "@type": "Organization",
    name: "REMIS Fantasy",
  },
  inLanguage: ["en-US", "sr-RS", "bs-BA"],
  copyrightYear: "2025",
  keywords:
    "REMIS Fantasy, FPL analytics, live mini league tables, FPL team news, best differentials, FPL captain picks, FPL transfer suggestions, Fantasy Premier League tools, FPL advanced statistics, gameweek analysis, fixture difficulty FPL, bonus points prediction, FPL AI recommendations, Premier League data, FPL managers, fantasy football analytics",
  mainEntity: {
    "@type": "WebApplication",
    name: "REMIS Fantasy FPL Analytics Platform",
    applicationCategory: "SportsApplication",
    operatingSystem: "Web Browser",
    description: "Advanced Fantasy Premier League analytics and management tools"
  }
};

export const sportsEventSchema = {
  "@context": "https://schema.org",
  "@type": "SportsEvent",
  name: "Fantasy Premier League 2025/26 Season - REMIS Fantasy Analytics",
  description:
    "Follow the Fantasy Premier League 2025/26 season with advanced analytics, live mini league tables, team news, best differentials, captain picks, transfer suggestions, and comprehensive FPL data analysis tools.",
  startDate: "2025-08-15",
  endDate: "2026-05-25",
  location: {
    "@type": "VirtualLocation",
    url: "https://remis-fantasy.com",
  },
  organizer: {
    "@type": "Organization",
    name: "REMIS Fantasy",
  },
  sport: "Soccer",
  eventStatus: "https://schema.org/EventScheduled",
  offers: {
    "@type": "Offer",
    name: "FPL Analytics Tools",
    description: "Advanced Fantasy Premier League analytics and management tools",
    availability: "https://schema.org/InStock",
    validFrom: "2024-08-01"
  },
  about: [
    "Fantasy Premier League",
    "FPL Analytics",
    "Live Mini League Tables", 
    "Team News",
    "Best Differentials",
    "Captain Picks",
    "Transfer Suggestions",
    "Gameweek Analysis"
  ]
};
