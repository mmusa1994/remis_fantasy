import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FPL Live | REMIS Fantasy - Real-Time Fantasy Premier League Tracking",
  description:
    "FPL Live - Best real-time Fantasy Premier League tracking platform. Live bonus points, manager rankings, team analysis, and gameweek statistics. Track your FPL team live with REMIS Fantasy!",
  keywords: [
    "FPL Live",
    "Fantasy Premier League Live",
    "FPL real time",
    "FPL bonus points live",
    "Fantasy Premier League tracker",
    "FPL Live tracker",
    "REMIS Fantasy FPL",
    "FPL dashboard",
    "Fantasy Premier League dashboard",
    "FPL manager tracker",
    "Premier League fantasy live",
    "FPL live scoring",
    "Fantasy football live",
    "FPL gameweek live",
    "FPL statistics live",
    "Real time FPL",
    "Live FPL updates",
    "FPL team tracker",
    "Fantasy Premier League analysis",
    "FPL live data",
  ],
  authors: [{ name: "REMIS Fantasy" }],
  creator: "REMIS Fantasy",
  publisher: "REMIS Fantasy", 
  category: "Sports",
  classification: "Fantasy Sports Live Tracker",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://remis-fantasy.com/premier-league/fpl-live",
    siteName: "REMIS Fantasy",
    title: "FPL Live - Real-Time Fantasy Premier League Tracking | REMIS Fantasy",
    description:
      "Track your Fantasy Premier League team live! Real-time bonus points, manager rankings, team analysis, and gameweek statistics. The ultimate FPL Live experience.",
    images: [
      {
        url: "/images/fpl-live-og.jpg",
        width: 1200,
        height: 630,
        alt: "FPL Live - Real-Time Fantasy Premier League Tracking",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@RemisFantasy",
    creator: "@RemisFantasy", 
    title: "FPL Live - Real-Time Fantasy Premier League Tracking",
    description:
      "Track your Fantasy Premier League team live! Real-time bonus points, manager rankings, team analysis.",
    images: ["/images/fpl-live-twitter.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://remis-fantasy.com/premier-league/fpl-live",
  },
};