import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import LayoutContent from "../components/shared/LayoutContent";
import JsonLd, {
  organizationSchema,
  websiteSchema,
  sportsEventSchema,
} from "../components/seo/JsonLd";

export const metadata: Metadata = {
  title:
    "REMIS Fantasy - Najuzbudljivije Fantasy Liga u Srbiji | Sezona 2025/26",
  description:
    "REMIS Fantasy - Unikatan brend fantasy liga za Premier League, Champions League i Formula 1. Kreiraj tim, osvojite nagrade i postanite šampion! Najbolja fantasy platforma u Srbiji.",
  keywords: [
    "REMIS Fantasy",
    "fantasy liga",
    "fantasy football",
    "Premier League fantasy",
    "Champions League fantasy",
    "Formula 1 fantasy",
    "Balkan fantasy liga",
    "REMIS",
    "fantasy sport",
    "online liga",
    "takmičenje",
  ],
  authors: [{ name: "REMIS Fantasy" }],
  creator: "REMIS Fantasy",
  publisher: "REMIS Fantasy",
  category: "Sports",
  classification: "Fantasy Sports Platform",
  openGraph: {
    type: "website",
    locale: "sr_RS",
    url: "https://remis-fantasy.com",
    siteName: "REMIS Fantasy",
    title: "REMIS Fantasy - Najuzbudljivije Fantasy Liga u Srbiji",
    description:
      "Unikatan brend fantasy liga za Premier League, Champions League i Formula 1. Kreiraj tim i postani šampion!",
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
    title: "REMIS Fantasy - Najuzbudljivije Fantasy Liga na Balkanu",
    description:
      "Unikatan brend fantasy liga za Premier League, Champions League i Formula 1.",
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
        <Providers>
          <LayoutContent>{children}</LayoutContent>
        </Providers>
      </body>
    </html>
  );
}
