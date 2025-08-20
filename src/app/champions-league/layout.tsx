import SubNavigation from "@/components/shared/SubNavigation";

const championsLeagueNavItems = [
  { name: "Tabele", href: "/champions-league/tabele" },
  { name: "Nagrade", href: "/champions-league/nagrade" },
  { name: "Registracija", href: "/champions-league/registracija" },
  { name: "Galerija", href: "/champions-league/galerija" },
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
      <main className="relative pt-14 md:pt-16">{children}</main>
    </div>
  );
}
