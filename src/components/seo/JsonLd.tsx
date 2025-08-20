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
    "Unikatan brend fantasy liga za Premier League, Champions League i Formula 1 u Srbiji",
  url: "https://remis-fantasy.com",
  logo: "https://remis-fantasy.com/images/rf-logo.svg",
  foundingDate: "2024",
  foundingLocation: {
    "@type": "Place",
    name: "Srbija",
  },
  sameAs: [
    "https://facebook.com/remis_fantasy",
    "https://instagram.com/remis_fantasy",
    "https://twitter.com/remis_fantasy",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: ["Serbian", "Bosnian", "English"],
  },
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "REMIS Fantasy",
  description:
    "Najuzbudljivije fantasy liga u Srbiji - Premier League, Champions League i Formula 1",
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
  inLanguage: "sr-RS",
  copyrightYear: "2025",
  keywords:
    "REMIS Fantasy, fantasy liga, Premier League, Champions League, Formula 1, Srbija",
};

export const sportsEventSchema = {
  "@context": "https://schema.org",
  "@type": "SportsEvent",
  name: "REMIS Fantasy Liga - Sezona 2025/26",
  description:
    "Fantasy takmičenje za Premier League, Champions League i Formula 1",
  startDate: "2025-08-01",
  endDate: "2026-07-31",
  location: {
    "@type": "VirtualLocation",
    url: "https://remis-fantasy.com",
  },
  organizer: {
    "@type": "Organization",
    name: "REMIS Fantasy",
  },
  sport: ["Soccer", "Formula 1", "Football"],
  eventStatus: "https://schema.org/EventScheduled",
};
