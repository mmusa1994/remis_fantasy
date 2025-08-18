import SubNavigation from "@/components/shared/SubNavigation";

const premierLeagueNavItems = [
  { name: "Registracija", href: "/premier-league/registracija" },
  { name: "Nagrade", href: "/premier-league/nagrade" },
  { name: "Galerija", href: "/premier-league/galerija" },
  { name: "Tabele", href: "/premier-league/tabele" },
];

export default function PremierLeagueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <SubNavigation
        items={premierLeagueNavItems}
        baseColor="purple"
        leagueBasePath="/premier-league"
      />
      <main className="relative">{children}</main>
    </div>
  );
}
