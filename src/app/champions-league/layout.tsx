import SubNavigation from "@/components/shared/SubNavigation";

const championsLeagueNavItems = [
  { name: "Registracija", href: "/champions-league/registracija" },
  { name: "Nagrade", href: "/champions-league/nagrade" },
  { name: "Galerija", href: "/champions-league/galerija" },
  { name: "Tabele", href: "/champions-league/tabele" },
];

export default function ChampionsLeagueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <SubNavigation
        items={championsLeagueNavItems}
        baseColor="blue"
        leagueBasePath="/champions-league"
      />
      <main className="relative">{children}</main>
    </div>
  );
}
