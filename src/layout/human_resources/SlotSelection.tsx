import {} from "react";

//
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
//
import type { PositionSlotProps } from "@/interface/data";

interface Props {
  slots: PositionSlotProps[];
  onChange: (...event: any[]) => void;
  className: string;
  value: string;
  defaultValue: string | undefined;
}

const SlotSelection = ({
  slots,
  className = "",
  value,
  defaultValue,
  onChange,
}: Props) => {
  return (
    <Select value={value} onValueChange={(e) => onChange(e)}>
      <SelectTrigger
        defaultValue={defaultValue}
        className={`${className} min-w-[200px]`}
      >
        <div className="flex items-center justify-between w-full">
          <SelectValue placeholder="Select slot" />
          {slots.length > 0 && (
            <div className="text-sm text-gray-500 ml-2">
              {slots.length} slot{slots.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-[280px]">
        <div className="px-3 py-2 border-b">
          <p className="text-sm font-medium text-gray-900">Available Slots</p>
          <p className="text-xs text-gray-500 mt-1">
            {slots.length} slot{slots.length !== 1 ? "s" : ""} total
          </p>
        </div>

        {slots.map((slot, i) => (
          <SelectItem key={slot.id} value={slot.id} className="py-3">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-auto h-6 rounded-full bg-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    Slot {i + 1}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">
                    Grade {slot.salaryGrade.grade}
                  </p>
                </div>
              </div>
              <Badge
                variant={slot.occupied ? "default" : "outline"}
                className={
                  slot.occupied
                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                    : "bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200"
                }
              >
                {slot.occupied ? "Occupied" : "Open"}
              </Badge>
            </div>
          </SelectItem>
        ))}

        {slots.length > 0 && (
          <div className="px-3 py-2 border-t">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>{slots.filter((s) => !s.occupied).length} open</span>
              <span>{slots.filter((s) => s.occupied).length} occupied</span>
            </div>
          </div>
        )}
      </SelectContent>
    </Select>
  );
};

export default SlotSelection;
