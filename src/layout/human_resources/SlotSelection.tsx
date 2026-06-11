import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Briefcase } from "lucide-react";
import type { PositionSlotProps } from "@/interface/data";

interface Props {
  slots: PositionSlotProps[];
  onChange: (value: string) => void;
  value: string;
  className?: string;
  defaultValue?: string | undefined;
  /** When true (default), occupied slots are hidden from the dropdown.
   *  Set to false when you want to *display* an existing assignment. */
  vacantOnly?: boolean;
}

/**
 * Select a slot to fill. Slots are presented with a stable 1-based number
 * (derived from the order they're sent in — same convention as the slot-
 * history endpoint) plus the salary grade so HR can tell them apart.
 *
 * The legacy version of this component rendered every slot in the
 * dropdown including the occupied ones, which made the Fill Position
 * modal misleading. The default now filters them out.
 */
const SlotSelection = ({
  slots,
  className = "",
  value,
  defaultValue,
  onChange,
  vacantOnly = true,
}: Props) => {
  // Pair each slot with its stable index BEFORE filtering, so the user
  // still sees "Slot #3" if slot #1 and #2 are filled.
  const indexed = slots.map((s, i) => ({ slot: s, number: i + 1 }));
  const visible = vacantOnly ? indexed.filter((p) => !p.slot.occupied) : indexed;

  const totalCount = slots.length;
  const openCount = slots.filter((s) => !s.occupied).length;

  return (
    <Select value={value} onValueChange={onChange} defaultValue={defaultValue}>
      <SelectTrigger className={`${className} min-w-[200px]`}>
        <SelectValue placeholder={openCount === 0 ? "No open slots" : "Select slot"} />
      </SelectTrigger>
      <SelectContent className="max-h-[320px]">
        <div className="px-3 py-2 border-b">
          <p className="text-xs font-medium text-gray-900">
            {vacantOnly ? "Open slots" : "All slots"}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {openCount} open · {totalCount} total
          </p>
        </div>

        {visible.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-gray-500">
            No {vacantOnly ? "open " : ""}slots to show.
          </div>
        ) : (
          visible.map(({ slot, number }) => (
            <SelectItem key={slot.id} value={slot.id} className="py-2.5">
              <div className="flex items-center justify-between w-full gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center h-6 px-2 rounded bg-blue-50 border border-blue-100">
                    <Briefcase className="h-3 w-3 text-blue-600 mr-1" />
                    <span className="text-[11px] font-semibold text-blue-700">
                      Slot #{number}
                    </span>
                  </div>
                  {slot.salaryGrade?.grade != null && (
                    <span className="text-[11px] text-gray-600">
                      SG {slot.salaryGrade.grade}
                    </span>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={
                    slot.occupied
                      ? "bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0"
                  }
                >
                  {slot.occupied ? "Occupied" : "Open"}
                </Badge>
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};

export default SlotSelection;
