import SubNavigation from "@/components/shared/SubNavigation";

const premierLeagueNavItems = [
  { name: "Tabele", href: "/premier-league/tabele" },
  { name: "Nagrade", href: "/premier-league/nagrade" },
  { name: "Registracija", href: "/premier-league/registracija" },
  { name: "Galerija", href: "/premier-league/galerija" },
];

export default function PremierLeagueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full">
      <SubNavigation
        items={premierLeagueNavItems}
        baseColor="purple"
        leagueBasePath="/premier-league"
      />
      <main className="relative">{children}</main>
    </div>
  );
}
