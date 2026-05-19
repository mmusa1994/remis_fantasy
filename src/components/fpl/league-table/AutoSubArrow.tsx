import { MdSwapHoriz } from "react-icons/md";

interface AutoSubArrowProps {
  outName: string;
  inName: string;
  outMinutes?: number;
  inPoints?: number;
  reason?: string;
}

export default function AutoSubArrow({
  outName,
  inName,
  outMinutes,
  inPoints,
  reason,
}: AutoSubArrowProps) {
  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs">
      <span className="text-red-600 dark:text-red-400 line-through font-medium">
        {outName}
        {typeof outMinutes === "number" && (
          <span className="ml-1 opacity-70">({outMinutes}m)</span>
        )}
      </span>
      <MdSwapHoriz className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
      <span className="text-green-700 dark:text-green-400 font-semibold">
        {inName}
        {typeof inPoints === "number" && (
          <span className="ml-1 opacity-80">+{inPoints}</span>
        )}
      </span>
      {reason && (
        <span className="ml-auto text-[10px] uppercase text-amber-700 dark:text-amber-300">
          {reason}
        </span>
      )}
    </div>
  );
}
