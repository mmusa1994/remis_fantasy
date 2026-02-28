"use client";

export default function PremierLeagueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <main className="relative pt-0 sm:pt-4 md:pt-8 pb-8 sm:pb-12">{children}</main>
    </div>
  );
}
