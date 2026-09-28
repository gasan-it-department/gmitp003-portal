/**
 * A count that is meant to be noticed.
 *
 * Three tones, and the difference between them is the whole point:
 *
 *   urgent — somebody must act. Solid red, white figures, a soft halo.
 *   warn   — should be dealt with, but nothing is blocked. Solid amber.
 *   quiet  — a fact, not a task. Grey outline.
 *
 * Zero renders nothing at all. An empty badge saying "0" is noise that
 * trains people to stop reading badges, and once they stop reading them
 * the red one stops working too — which is the only one that matters.
 */
interface Props {
  count: number | null | undefined;
  tone?: "urgent" | "warn" | "quiet";
  /** What the number means, read out on hover. Always worth giving. */
  title?: string;
  /** Sits on the top-right corner of a relatively-positioned parent. */
  corner?: boolean;
  className?: string;
}

const TONES = {
  urgent:
    "bg-red-600 text-white ring-2 ring-red-200 shadow-sm font-bold",
  warn: "bg-amber-500 text-white ring-2 ring-amber-100 font-bold",
  quiet: "bg-gray-100 text-gray-600 border border-gray-200 font-semibold",
} as const;

const CountBadge = ({
  count,
  tone = "urgent",
  title,
  corner = false,
  className = "",
}: Props) => {
  if (!count || count < 1) return null;
  // Past a hundred the exact figure stops being information and the badge
  // stops fitting. Both problems, one answer.
  const label = count > 99 ? "99+" : String(count);

  /*
    One position, not two. `relative` and `absolute` on the same element is
    a coin toss decided by stylesheet order, not by the order the classes
    are written — which is how the corner badge ended up in the top-LEFT
    corner the first time.
  */
  return (
    <span
      title={title}
      className={`inline-flex ${
        corner ? "absolute -top-1.5 -right-1.5 z-10" : "relative"
      } ${className}`}
    >
      {/* The halo. Urgent only — if everything pulses, nothing does. */}
      {tone === "urgent" ? (
        <span className="absolute inset-0 rounded-full bg-red-500/60 animate-ping motion-reduce:hidden" />
      ) : null}
      <span
        className={`relative inline-flex items-center justify-center rounded-full px-1.5 h-[18px] min-w-[18px] text-[10px] leading-none tabular-nums ${TONES[tone]}`}
      >
        {label}
      </span>
    </span>
  );
};

export default CountBadge;
