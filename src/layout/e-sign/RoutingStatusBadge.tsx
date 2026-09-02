import { Badge } from "@/components/ui/badge";

/**
 * The state of one routing, as a badge.
 *
 * Outbox and Inbox each carried their own copy of this palette, identical
 * down to the hex step, which is exactly how two lists end up disagreeing
 * about what "Active" looks like. One definition now.
 *
 * On the visibility: the fill used to be the 50 step, which against a white
 * row measures 1.09:1. That is not a faint colour, it is no colour — you had
 * to read the word to learn the state, which defeats the point of a badge.
 * Darkening the wash barely helps (the 100 step only reaches 1.22), so these
 * are solid instead, and every one clears 4.5:1 for its white label.
 *
 * Draft is deliberately the grey one: it is the absence of a state rather
 * than a state, so it should be legible without competing with the three
 * that a sender actually scans for.
 */
const STATUS: Record<number, { label: string; pill: string }> = {
  0: { label: "Draft", pill: "bg-slate-500 text-white border-slate-500" },
  1: { label: "Active", pill: "bg-blue-600 text-white border-blue-600" },
  2: {
    label: "Completed",
    pill: "bg-emerald-700 text-white border-emerald-700",
  },
  3: { label: "Cancelled", pill: "bg-rose-600 text-white border-rose-600" },
};

export const routingStatus = (status: number | null | undefined) =>
  STATUS[status ?? 0] ?? STATUS[0];

const RoutingStatusBadge = ({
  status,
  className = "",
}: {
  status: number | null | undefined;
  className?: string;
}) => {
  const s = routingStatus(status);
  return (
    <Badge
      variant="outline"
      className={`text-[10px] h-5 px-2 font-semibold ${s.pill} ${className}`}
    >
      {s.label}
    </Badge>
  );
};

export default RoutingStatusBadge;
