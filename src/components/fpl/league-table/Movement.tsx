import { cx, formatNumber } from "@/components/fpl/live/ui";

/** Rank movement: ▲3 in emerald, ▼2 in rose, nothing when unchanged. */
export default function Movement({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  if (!value) return null;
  const up = value > 0;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-0.5 text-[10px] font-semibold leading-none tabular-nums",
        up ? "text-emerald-500" : "text-rose-500",
        className
      )}
    >
      <span className="text-[7px]">{up ? "▲" : "▼"}</span>
      {formatNumber(Math.abs(value))}
    </span>
  );
}
