"use client";

export default function PremierLeagueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <main className="relative pt-0">{children}</main>
    </div>
  );
}
