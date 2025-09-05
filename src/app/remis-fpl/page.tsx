import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "REMIS FPL – Live FPL alatke, tabele i AI analitika",
  description:
    "REMIS FPL: sve na jednom mjestu za Fantasy Premier League – FPL Live praćenje uživo, mini lige i tabele, AI analiza tima, diferencijali, vijesti o ekipama i napredna statistika. | REMIS FPL: everything in one place for Fantasy Premier League – FPL Live real-time tracking, mini leagues and tables, AI team analysis, differentials, team news and advanced statistics.",
  keywords: [
    "REMIS FPL",
    "Remis FPL",
    "remis fpl",
    "FPL Live",
    "Fantasy Premier League",
    "FPL tabele",
    "FPL analitika",
    "AI FPL",
    "REMIS Fantasy",
  ],
  alternates: {
    canonical: "https://remis-fantasy.com/remis-fpl",
  },
  openGraph: {
    type: "website",
    url: "https://remis-fantasy.com/remis-fpl",
    title: "REMIS FPL – Sve za Fantasy Premier League",
    description:
      "Live FPL praćenje, mini lige i tabele, AI analiza tima, diferencijali i vijesti – REMIS FPL.",
    images: [
      {
        url: "/images/rf-logo.svg",
        width: 1200,
        height: 630,
        alt: "REMIS FPL – REMIS Fantasy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "REMIS FPL – Live FPL i AI analiza",
    description:
      "Najbolji alati za FPL: live praćenje, tabele, AI analiza i statistika.",
    images: ["/images/rf-logo.svg"],
  },
  robots: { index: true, follow: true },
};

export default function RemisFplLanding() {
  return (
    <main className="w-full min-h-screen overflow-x-hidden bg-theme-background">
      <section className="relative overflow-hidden pb-16 px-4 pt-28 max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-black mb-4 text-theme-foreground">
          REMIS FPL
        </h1>
        <div className="text-lg md:text-xl text-theme-text-secondary mb-8">
          <p>
            REMIS FPL je centralno mjesto za Fantasy Premier League igrače u
            regionu: praćenje uživo, mini lige i tabele, AI analiza tima,
            diferencijali, vijesti o ekipama i napredna statistika – sve na jednom
            mjestu.
          </p>
          <p className="text-sm md:text-base mt-2 opacity-80">
            REMIS FPL is the central hub for Fantasy Premier League players in the region:
            live tracking, mini leagues and tables, AI team analysis, differentials, team news
            and advanced stats — all in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/premier-league/fpl-live" className="group">
            <div className="p-5 rounded-xl border border-purple-400/40 hover:bg-purple-500/10 transition">
              <h2 className="font-bold text-xl text-theme-foreground">
                FPL Live
              </h2>
              <p className="text-theme-text-secondary">
                Praćenje bodova i bonusa u realnom vremenu.
              </p>
              <p className="text-theme-text-secondary text-sm mt-1 opacity-80">
                Real-time points and bonus tracking.
              </p>
            </div>
          </Link>
          <Link href="/premier-league/tabele" className="group">
            <div className="p-5 rounded-xl border border-blue-400/40 hover:bg-blue-500/10 transition">
              <h2 className="font-bold text-xl text-theme-foreground">
                Mini lige i tabele
              </h2>
              <p className="text-theme-text-secondary">
                Žive tabele i napredne poredbene metrike.
              </p>
              <p className="text-theme-text-secondary text-sm mt-1 opacity-80">
                Live tables and advanced comparative metrics.
              </p>
            </div>
          </Link>
          <Link href="/premier-league/ai-team-analysis" className="group">
            <div className="p-5 rounded-xl border border-emerald-400/40 hover:bg-emerald-500/10 transition">
              <h2 className="font-bold text-xl text-theme-foreground">
                AI analiza tima
              </h2>
              <p className="text-theme-text-secondary">
                Personalizirani savjeti i prijedlozi transfera.
              </p>
              <p className="text-theme-text-secondary text-sm mt-1 opacity-80">
                Personalized tips and transfer suggestions.
              </p>
            </div>
          </Link>
          <Link href="/premier-league/team-news" className="group">
            <div className="p-5 rounded-xl border border-orange-400/40 hover:bg-orange-500/10 transition">
              <h2 className="font-bold text-xl text-theme-foreground">
                Vijesti o ekipama
              </h2>
              <p className="text-theme-text-secondary">
                Povrede, najave sastava i korisne informacije.
              </p>
              <p className="text-theme-text-secondary text-sm mt-1 opacity-80">
                Injuries, lineup predictions and useful updates.
              </p>
            </div>
          </Link>
        </div>
        <div className="mt-10 text-theme-text-secondary">
          <p>
            Tražiš nas na Google-u? Probaj upite poput: <strong>remis fpl</strong>,
            <strong>remis fantasy fpl</strong> ili <strong>fpl live remis</strong>.
          </p>
          <p className="text-sm mt-1 opacity-80">
            Searching for us on Google? Try queries like <strong>remis fpl</strong>,
            <strong>remis fantasy fpl</strong> or <strong>fpl live remis</strong>.
          </p>
        </div>
      </section>
    </main>
  );
}
