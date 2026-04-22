import { memo, useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import UpdateAccountStatus from "../UpdateAccountStatus";
//
import { removePosition } from "@/db/statements/position";
//
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Modal from "@/components/custom/Modal";
import ConfirmDelete from "@/layout/ConfirmDelete";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TableCell, TableRow } from "@/components/ui/table";
import PositionInvitationForm from "../PositionInvitationForm";
//
import {
  Hash,
  Briefcase,
  User,
  Users,
  DollarSign,
  UserPlus,
  UserCog,
  ArrowRight,
  Trash2,
} from "lucide-react";
//import { getSlotSalaryGradeRange } from "@/utils/helper";

//interface/schema/props
import type { UnitPositionProps } from "@/interface/data";

interface Props {
  item: UnitPositionProps;
  no: number;
  token: string;
  lineId: string;
  userId: string;
}

const PositionItem = ({ item, no, token, lineId, userId }: Props) => {
  const [onOpen, setOnOpen] = useState(0);

  const nav = useNavigate();
  const queryClient = useQueryClient();
  const slotCount = item.slot.length;
  // const salaryGradeRange =
  //   item.slot.length > 0 ? getSlotSalaryGradeRange(item.slot) : "N/A";
  const isOpenPosition = item.slot.filter(
    (slot) => slot.occupied === true,
  ).length;

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
    return "";
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

  const removeUnitPositionMutation = useMutation({
    mutationFn: () => removePosition(token, item.id, lineId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["postions", item.departmentId],
        refetchType: "active",
      });
      toast.success("Position removed successfully");
      setOnOpen(0);
    },
    onError: (err) => {
      toast.error("Failed to remove position. Please try again.", {
        description: err.message,
      });
    },
  });

  return (
    <TooltipProvider>
      <Popover>
        <PopoverTrigger asChild>
          <TableRow className="hover:bg-gray-50/50 cursor-pointer">
            {/* Serial Number */}
            <TableCell className="py-2 md:py-3">
              <div className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                <span className="text-xs md:text-sm font-semibold text-gray-700">
                  {no}
                </span>
              </div>
            </TableCell>

            {/* Item Number */}
            <TableCell className="py-2 md:py-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Hash className="h-2.5 w-2.5 md:h-3 md:w-3 text-gray-500" />
                    <span className="text-xs md:text-sm font-medium text-gray-800">
                      {item.itemNumber || "N/A"}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Item Number</p>
                </TooltipContent>
              </Tooltip>
            </TableCell>

            {/* Position Title */}
            <TableCell className="py-2 md:py-3">
              <div className="flex items-start gap-1.5 md:gap-2">
                <div className="mt-0.5 p-0.5 md:p-1 rounded bg-primary/10">
                  <Briefcase className="h-2.5 w-2.5 md:h-3 md:w-3 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-xs md:text-sm leading-tight">
                    {item.position.name}
                  </h3>
                  <div className="mt-0.5 md:mt-1">
                    <Badge
                      variant="outline"
                      className={`text-[10px] md:text-xs font-normal ${getPositionTypeColor(getPositionType())}`}
                    >
                      {getPositionType()}
                    </Badge>
                  </div>
                </div>
              </div>
            </TableCell>

            {/* Designation - Hide on small screens */}
            <TableCell className="hidden sm:table-cell py-2 md:py-3">
              <div className="flex items-start gap-1.5 md:gap-2">
                <div className="mt-0.5 p-0.5 md:p-1 rounded bg-blue/10">
                  <User className="h-2.5 w-2.5 md:h-3 md:w-3 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-xs md:text-sm">
                    {item.designation || "N/A"}
                  </p>
                  {item.designation && item.designation !== "N/A" && (
                    <p className="text-[10px] md:text-xs text-gray-500 mt-0.5">
                      Designation
                    </p>
                  )}
                </div>
              </div>
            </TableCell>

            {/* Slots */}
            <TableCell className="py-2 md:py-3 text-center">
              <div className="flex flex-col items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`px-2 md:px-3 py-1 md:py-1.5 rounded-full border ${getSlotStatusColor(slotCount)}`}
                    >
                      <div className="flex items-center gap-0.5 md:gap-1">
                        <Users className="h-2.5 w-2.5 md:h-3 md:w-3" />
                        <span className="font-bold text-xs md:text-sm">
                          {isOpenPosition}/{slotCount}
                        </span>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{getSlotStatusText(slotCount)} available</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TableCell>

            {/* Salary Grade Range - Hide on small screens */}
            <TableCell className="hidden lg:table-cell py-2 md:py-3">
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="p-0.5 md:p-1 rounded bg-emerald/10">
                  <DollarSign className="h-2.5 w-2.5 md:h-3 md:w-3 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-xs md:text-sm">
                    {/* {salaryGradeRange} */}
                  </p>
                  <p className="text-[10px] md:text-xs text-gray-500">
                    Salary Grade
                  </p>
                </div>
              </div>
            </TableCell>

            {/* Status */}
            <TableCell className="py-2 md:py-3 text-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className={`font-normal text-[10px] md:text-xs ${
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
            </TableCell>

            {/* Applications - Hide on small screens */}
            <TableCell className="hidden md:table-cell py-2 md:py-3 text-center">
              <div className="text-xs md:text-sm text-gray-600">-</div>
            </TableCell>
          </TableRow>
        </PopoverTrigger>

        <PopoverContent
          className="w-72 sm:w-80 p-3 sm:p-4"
          align="end"
          side="bottom"
          sideOffset={5}
          collisionPadding={16}
        >
          <div className="space-y-3 sm:space-y-4">
            {/* Header */}
            <div className="space-y-2 pb-2 sm:pb-3 border-b">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg">
                    <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">
                      {item.position.name}
                    </h3>
                    {getPositionType() && (
                      <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                        <Badge
                          variant="outline"
                          className={`text-[10px] sm:text-xs ${getPositionTypeColor(getPositionType())}`}
                        >
                          {getPositionType()}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {item.designation && item.designation !== "N/A" && (
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                  <User className="h-3 w-3" />
                  <span className="font-medium">{item.designation}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1 sm:pt-2">
              <div className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide">
                Position Actions
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 h-8 sm:h-9 text-xs sm:text-sm hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                  disabled={isOpenPosition === 0}
                  onClick={() => setOnOpen(1)}
                >
                  <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Fill Position</span>
                  <ArrowRight className="h-3 w-3 ml-auto" />
                </Button>

                <UpdateAccountStatus
                  isAvailable={isOpenPosition === 0}
                  isOpen={onOpen}
                  setOnOpen={setOnOpen}
                  token={token}
                  id={item.id}
                  lineId={lineId}
                  userId={userId}
                />

                <Button
                  disabled
                  onClick={() => nav(`position/${item.id}`)}
                  variant="outline"
                  className="w-full justify-start gap-2 h-8 sm:h-9 text-xs sm:text-sm hover:bg-gray-100 hover:text-gray-800 hover:border-gray-300"
                >
                  <UserCog className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>View Details</span>
                  <ArrowRight className="h-3 w-3 ml-auto" />
                </Button>

                <Button
                  onClick={() => setOnOpen(2)}
                  variant="destructive"
                  className="w-full justify-start gap-2 h-8 sm:h-9 text-xs sm:text-sm"
                >
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Remove</span>
                  <ArrowRight className="h-3 w-3 ml-auto" />
                </Button>
              </div>
            </div>

            <Modal
              title={undefined}
              children={
                <PositionInvitationForm
                  slots={item.slot}
                  setOnOpen={setOnOpen}
                  token={token}
                  lineId={lineId}
                  userId={userId}
                  unitPositionId={item.id}
                />
              }
              onOpen={onOpen === 1}
              className="max-h-[95vh] overflow-auto"
              setOnOpen={() => setOnOpen(0)}
              footer={1}
            />

            <Modal
              title="Remove Unit Position"
              children={
                <ConfirmDelete
                  confirmation="confirm"
                  setOnOpen={setOnOpen}
                  onFunction={() => {
                    removeUnitPositionMutation.mutateAsync();
                  }}
                  isLoading={removeUnitPositionMutation.isPending}
                />
              }
              onOpen={onOpen === 2}
              className="max-w-md"
              setOnOpen={() => setOnOpen(0)}
              footer={1}
            />
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
};

export default memo(PositionItem);
