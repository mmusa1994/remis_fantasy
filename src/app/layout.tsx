import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import LayoutContent from "../components/shared/LayoutContent";
import FlagLoader from "../components/shared/FlagLoader";
import JsonLd, {
  organizationSchema,
  websiteSchema,
  sportsEventSchema,
} from "../components/seo/JsonLd";

export const metadata: Metadata = {
  title:
    "REMIS Fantasy - Best Fantasy Football Platform | Premier League, Champions League, F1 | FPL Live",
  description:
    "REMIS Fantasy - The ultimate fantasy sports platform for Premier League, Champions League and Formula 1. Create your dream team, win prizes, become champion! Features FPL Live real-time tracking, bonus points prediction, and advanced analytics. Join thousands of fantasy managers worldwide!",
  keywords: [
    "REMIS Fantasy",
    "Remis Fantasy", 
    "remis-fantasy.com",
    "FPL Live",
    "Fantasy Premier League Live",
    "FPL real time",
    "fantasy liga",
    "fantasy football", 
    "fantasy sports",
    "Premier League fantasy",
    "Champions League fantasy",
    "Formula 1 fantasy",
    "FPL bonus points live",
    "Fantasy Premier League tracker",
    "FPL dashboard",
    "fantasy manager",
    "Premier League live",
    "football fantasy",
    "soccer fantasy",
    "sports betting alternative",
    "fantasy draft",
    "fantasy league",
    "FPL statistics",
    "gameweek analysis",
    "player statistics",
    "fantasy team builder",
    "REMIS",
    "fantasy sport",
    "online liga",
    "takmičenje",
    "best fantasy platform",
    "fantasy football platform",
    "European fantasy league",
    "Balkan fantasy liga",
  ],
  authors: [{ name: "REMIS Fantasy" }],
  creator: "REMIS Fantasy",
  publisher: "REMIS Fantasy",
  category: "Sports",
  classification: "Fantasy Sports Platform",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://remis-fantasy.com",
    siteName: "REMIS Fantasy",
    title: "REMIS Fantasy - Best Fantasy Football Platform | FPL Live Real-Time Tracking",
    description:
      "The ultimate fantasy sports platform for Premier League, Champions League and Formula 1. Features FPL Live real-time tracking, bonus points prediction, and advanced analytics. Join thousands of fantasy managers worldwide!",
    images: [
      {
        url: "/images/rf-logo.svg",
        width: 1200,
        height: 630,
        alt: "REMIS Fantasy Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@RemisFantasy",
    creator: "@RemisFantasy",
    title: "REMIS Fantasy - Best Fantasy Platform | FPL Live Real-Time Tracking",
    description:
      "Ultimate fantasy sports platform for Premier League, Champions League and Formula 1. Features FPL Live real-time tracking and bonus points prediction.",
    images: ["/images/rf-logo.svg"],
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
  verification: {
    google: "your-google-verification-code-here",
  },
  alternates: {
    canonical: "https://remis-fantasy.com",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bs">
      <head>
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
        <JsonLd data={sportsEventSchema} />
      </head>
      <body
        className="font-russo antialiased w-full"
        suppressHydrationWarning={true}
      >
        <FlagLoader />
        <Providers>
          <LayoutContent>{children}</LayoutContent>
        </Providers>
      </body>
    </html>
  );
}
