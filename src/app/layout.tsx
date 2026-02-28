import type { Metadata } from "next";
import { Anta } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import LayoutContent from "../components/shared/LayoutContent";
import FlagLoader from "../components/shared/FlagLoader";
import JsonLd, {
  organizationSchema,
  websiteSchema,
  sportsEventSchema,
} from "../components/seo/JsonLd";

const anta = Anta({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-anta",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://remis-fantasy.com"),
  title: {
    default:
      "REMIS Fantasy – Best FPL Analytics Platform | Live Mini League Tables, Team News, Differentials & Advanced Statistics",
    template: "%s | REMIS Fantasy",
  },
  description:
    "REMIS Fantasy - The ultimate FPL analytics platform with live mini league tables, AI-powered team recommendations, advanced player statistics, team news, best differentials, gameweek analysis, captain picks, transfer suggestions, fixture difficulty ratings, bonus points prediction, price change alerts, and comprehensive Premier League data. Join thousands of FPL managers using our cutting-edge tools to dominate their leagues!",
  keywords: [
    "REMIS Fantasy",
    "Remis Fantasy", 
    "REMIS FPL",
    "Remis FPL",
    "remis fpl",
    "remis-fantasy.com",
    "FPL Live",
    "Fantasy Premier League Live",
    "FPL analytics platform",
    "FPL mini league tables",
    "live FPL tables",
    "FPL team news",
    "best FPL differentials",
    "FPL captain picks",
    "FPL transfer suggestions",
    "FPL AI recommendations", 
    "FPL advanced statistics",
    "FPL gameweek analysis",
    "FPL fixture difficulty",
    "FPL bonus points prediction",
    "FPL price change alerts",
    "Fantasy Premier League tracker",
    "FPL dashboard",
    "FPL tools",
    "FPL statistics",
    "FPL data analysis",
    "Premier League player stats",
    "FPL ownership percentages",
    "FPL form guide",
    "FPL injury updates",
    "fantasy football analytics",
    "Premier League fantasy",
    "FPL real time tracking",
    "FPL league management",
    "fantasy premier league tools",
    "FPL performance analysis",
    "Premier League live scores",
    "FPL chips strategy",
    "wildcard planning FPL",
    "bench boost FPL",
    "triple captain FPL",
    "free hit FPL",
    "fantasy manager tools",
    "REMIS",
    "best fantasy platform",
    "European fantasy league",
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
    title: "REMIS Fantasy - Best FPL Analytics Platform | Live Mini League Tables & Advanced Statistics",
    description:
      "The ultimate FPL analytics platform with live mini league tables, AI team recommendations, team news, best differentials, gameweek analysis, captain picks, transfer suggestions, fixture difficulty ratings, bonus points prediction, and comprehensive Premier League data for FPL managers.",
    images: [
      {
        url: "/images/rf-logo.svg",
        width: 1200,
        height: 630,
        alt: "REMIS Fantasy - FPL Analytics Platform Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@RemisFantasy",
    creator: "@RemisFantasy",
    title: "REMIS Fantasy - FPL Analytics Platform | Live Tables, Team News & AI Recommendations",
    description:
      "Ultimate FPL analytics platform with live mini league tables, AI team recommendations, team news, best differentials, gameweek analysis, and advanced statistics for FPL managers.",
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
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
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
    <html lang="bs" className={anta.variable}>
      <head>
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
        <JsonLd data={sportsEventSchema} />
      </head>
      <body
        className="font-anta antialiased w-full"
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
