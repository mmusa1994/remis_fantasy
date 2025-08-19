import SubNavigation from "@/components/shared/SubNavigation";

const f1FantasyNavItems = [
  { name: "Tabele", href: "/f1-fantasy/tabele" },
  { name: "Nagrade", href: "/f1-fantasy/nagrade" },
  { name: "Registracija", href: "/f1-fantasy/registracija" },
  { name: "Galerija", href: "/f1-fantasy/galerija" },
];

export default function F1FantasyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <SubNavigation
        items={f1FantasyNavItems}
        baseColor="red"
        leagueBasePath="/f1-fantasy"
      />
      <main className="relative">{children}</main>
    </div>
  );
}
