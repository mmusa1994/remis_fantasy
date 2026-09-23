// Loading skeletons that mirror the real table layouts 1:1 (same paddings,
// grids and row heights) so nothing jumps when the data arrives.

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export function Bone({ className }: { className?: string }) {
  const rounded = className?.includes("rounded-") ? "" : "rounded-md";
  return <div aria-hidden className={cx("skeleton-bone", rounded, className)} />;
}

function StandingRow({ avatar }: { avatar?: boolean }) {
  return (
    <div className="flex items-center gap-3 border-b border-theme-border px-3 py-2.5 last:border-b-0 sm:px-5 sm:py-3">
      <div className="flex w-9 shrink-0 justify-center">
        <Bone className="h-8 w-8 rounded-lg" />
      </div>
      {avatar && <Bone className="h-9 w-9 shrink-0 rounded-full" />}
      <div className="min-w-0 flex-1 space-y-1.5">
        <Bone className="h-3.5 w-2/5 max-w-[180px]" />
        <Bone className="h-2.5 w-1/4 max-w-[110px]" />
        <Bone className="h-1 w-full max-w-[200px] rounded-full" />
      </div>
      <div className="flex w-16 shrink-0 flex-col items-end gap-1.5 sm:w-20">
        <Bone className="h-5 w-12" />
        <Bone className="h-2 w-8" />
      </div>
    </div>
  );
}

function PodiumCard({ first }: { first?: boolean }) {
  return (
    <div
      className={cx(
        "rounded-2xl bg-theme-card p-4 sm:p-5",
        first && "order-first sm:order-none sm:pb-8 sm:pt-7"
      )}
    >
      <div className="flex items-center gap-3.5 sm:flex-col">
        <Bone className={cx("shrink-0 rounded-full", first ? "h-16 w-16 sm:h-20 sm:w-20" : "h-14 w-14 sm:h-16 sm:w-16")} />
        <div className="flex flex-1 flex-col gap-2 sm:w-full sm:items-center">
          <Bone className="h-4 w-28" />
          <Bone className="h-3 w-20" />
          <Bone className={cx("mt-1", first ? "h-9 w-24" : "h-7 w-20")} />
        </div>
      </div>
      <div className="mt-3 flex sm:justify-center">
        <Bone className="h-5 w-20 rounded-full" />
      </div>
    </div>
  );
}

function Podium() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
      <PodiumCard />
      <PodiumCard first />
      <PodiumCard />
    </div>
  );
}

function StandingsCard({ rows = 8, avatar }: { rows?: number; avatar?: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-theme-card shadow-sm">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-2">
          <Bone className="h-5 w-1 rounded-full" />
          <Bone className="h-5 w-32" />
          <Bone className="h-4 w-7 rounded-full" />
        </div>
        <Bone className="h-9 w-full rounded-xl sm:w-64" />
      </div>
      <div className="hidden h-8 bg-theme-card-secondary sm:block" />
      {Array.from({ length: rows }).map((_, i) => (
        <StandingRow key={i} avatar={avatar} />
      ))}
    </div>
  );
}

/** Premier League tables (ReusableLeagueTable) */
export function LeagueTableSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl" role="status" aria-busy="true">
      {/* hero */}
      <div className="rounded-3xl bg-theme-card p-5 sm:p-8">
        <Bone className="h-3 w-40" />
        <Bone className="mt-3 h-8 w-56 sm:h-12 sm:w-80" />
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Bone key={i} className="h-[68px] rounded-2xl sm:h-[74px]" />
          ))}
        </div>
      </div>

      <div className="mt-5">
        <Podium />
      </div>

      {/* prizes */}
      <div className="mt-5 rounded-2xl bg-theme-card px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between">
          <Bone className="h-4 w-24" />
          <Bone className="h-3 w-36" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Bone className="h-2.5 w-16" />
              <Bone className="h-6 w-24" />
              <Bone className="h-2.5 w-12" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <StandingsCard />
      </div>
    </div>
  );
}

/** Champions League table (hero + podium + list with avatars) */
export function ClTableSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-busy="true">
      <div className="rounded-3xl bg-theme-card p-5 pt-[44vw] sm:p-8 sm:pt-[40vw] md:pt-8">
        <Bone className="h-3 w-48" />
        <Bone className="mt-3 h-8 w-64 sm:h-10 sm:w-96" />
        <Bone className="mt-2 h-8 w-32 sm:h-10 sm:w-40" />
        <Bone className="mt-4 h-12 w-56 rounded-2xl" />
        <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3 md:max-w-2xl">
          {[0, 1, 2].map((i) => (
            <Bone key={i} className="h-[92px] rounded-2xl sm:h-[108px]" />
          ))}
        </div>
      </div>
      <Podium />
      <StandingsCard avatar />
    </div>
  );
}

/** F1 tables page (title + season tabs + hero + leaderboard) */
export function F1TableSkeleton() {
  return (
    <div role="status" aria-busy="true">
      <div className="mb-2 flex justify-center">
        <Bone className="h-9 w-72 md:h-10 md:w-96" />
      </div>
      <div className="mb-8 flex items-center justify-center gap-8 py-3">
        <Bone className="h-4 w-14" />
        <Bone className="h-4 w-14" />
      </div>
      <div className="mb-10 rounded-3xl bg-theme-card p-5 sm:p-7">
        <Bone className="h-2.5 w-40" />
        <Bone className="mt-[22vw] h-4 w-3/4 sm:mt-3 sm:w-1/2" />
        <div className="mt-6 grid max-w-md grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <Bone key={i} className="h-[84px] rounded-2xl" />
          ))}
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl bg-theme-card">
        <div className="h-9 bg-theme-card-secondary" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-theme-border px-4 py-3 last:border-b-0 md:px-5">
            <Bone className="h-4 w-6" />
            <Bone className="h-3 w-6" />
            <div className="flex-1 space-y-1.5">
              <Bone className="h-3.5 w-36" />
              <Bone className="h-2.5 w-20" />
            </div>
            <Bone className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
