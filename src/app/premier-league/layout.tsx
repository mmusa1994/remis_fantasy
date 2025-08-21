import SubNavigation from "@/components/shared/SubNavigation";

const premierLeagueNavItems = [
  { name: "Tabele", href: "/premier-league/tabele" },
  {
    name: "FPL Live",
    href: "/premier-league/fpl-live",
    badge: { color: "red" as const, pulse: true },
  },
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
      <main className="relative pt-14 md:pt-16">{children}</main>
    </div>
  );
}
