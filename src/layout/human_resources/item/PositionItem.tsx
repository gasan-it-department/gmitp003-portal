import { memo } from "react";
//
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
//
import {
  Hash,
  Briefcase,
  User,
  Users,
  DollarSign,
  Calendar,
  //FileText,
  Building,
} from "lucide-react";
import { getSlotSalaryGradeRange } from "@/utils/helper";

//interface/schema/props
import type { UnitPositionProps } from "@/interface/data";

interface Props {
  item: UnitPositionProps;
  no: number;
}

const PositionItem = ({ item, no }: Props) => {
  const slotCount = item.slot.length;
  const salaryGradeRange = getSlotSalaryGradeRange(item.slot);
  const isOpenPosition = slotCount > 0;

  const getSlotStatusColor = (count: number) => {
    if (count === 0) return "bg-gray-100 text-gray-700 border-gray-200";
    if (count <= 2) return "bg-green-50 text-green-700 border-green-200";
    if (count <= 5) return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-purple-50 text-purple-700 border-purple-200";
  };

  const getSlotStatusText = (count: number) => {
    if (count === 0) return "No slots";
    if (count === 1) return "1 slot";
    return `${count} slots`;
  };

  const getPositionType = () => {
    if (item.plantilla) return "Plantilla";
    if (item.fixToUnit) return "Fixed to Unit";
    return "Regular";
  };

  const getPositionTypeColor = (type: string) => {
    switch (type) {
      case "Plantilla":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Fixed to Unit":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <TooltipProvider>
      <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 items-center">
        {/* Serial Number */}
        <div className="col-span-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
            <span className="text-sm font-semibold text-gray-700">{no}</span>
          </div>
        </div>

        {/* Item Number */}
        <div className="col-span-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <Hash className="h-3 w-3 text-gray-500" />
                <span className="text-sm font-medium text-gray-800">
                  {item.itemNumber || "N/A"}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Item Number</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Position Title */}
        <div className="col-span-2">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 p-1 rounded bg-primary/10">
              <Briefcase className="h-3 w-3 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                {item.position.name}
              </h3>
              <div className="mt-1">
                <Badge
                  variant="outline"
                  className={`text-xs font-normal ${getPositionTypeColor(getPositionType())}`}
                >
                  {getPositionType()}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Designation */}
        <div className="col-span-2">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 p-1 rounded bg-blue/10">
              <User className="h-3 w-3 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800 text-sm">
                {item.designation || "N/A"}
              </p>
              {item.designation && item.designation !== "N/A" && (
                <p className="text-xs text-gray-500 mt-0.5">Designation</p>
              )}
            </div>
          </div>
        </div>

        {/* Slots */}
        <div className="col-span-1">
          <div className="flex flex-col items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`px-3 py-1.5 rounded-full border ${getSlotStatusColor(slotCount)}`}
                >
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span className="font-bold">{slotCount}</span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getSlotStatusText(slotCount)} available</p>
              </TooltipContent>
            </Tooltip>
            <span className="text-xs text-gray-500 mt-1">Slots</span>
          </div>
        </div>

        {/* Open Status */}
        <div className="col-span-1">
          <div className="flex justify-center">
            {isOpenPosition ? (
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200 font-normal"
              >
                Open
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-gray-100 text-gray-600 border-gray-200 font-normal"
              >
                Closed
              </Badge>
            )}
          </div>
        </div>

        {/* Salary Grade Range */}
        <div className="col-span-2">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-emerald/10">
              <DollarSign className="h-3 w-3 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-gray-800 text-sm">
                {salaryGradeRange}
              </p>
              <p className="text-xs text-gray-500">Salary Grade</p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="col-span-1">
          <div className="flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={`font-normal ${
                    item.fixToUnit
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}
                >
                  {item.fixToUnit ? "Fixed" : "Active"}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {item.fixToUnit
                    ? "Position is fixed to this unit"
                    : "Position is active"}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Additional Info on the right side */}
        <div className="col-span-12 mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                Created:{" "}
                {new Date(item.timestamp).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            {item.unit && (
              <div className="flex items-center gap-1">
                <Building className="h-3 w-3" />
                <span>Unit: {item.unit.name}</span>
              </div>
            )}
            <div className="ml-auto">
              <span className="text-xs text-gray-400">
                ID: {item.id.substring(0, 8)}...
              </span>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default memo(PositionItem);
