import { memo, useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { isAxiosError } from "axios";

import { removePosition } from "@/db/statements/position";

import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Modal from "@/components/custom/Modal";
import ConfirmDelete from "@/layout/ConfirmDelete";

import UpdateAccountStatus from "../UpdateAccountStatus";
import PositionInvitationForm from "../PositionInvitationForm";

import {
  Hash,
  Briefcase,
  User,
  Users,
  UserPlus,
  UserCog,
  ArrowRight,
  Trash2,
  Loader2,
  Inbox,
} from "lucide-react";

import type { UnitPositionProps } from "@/interface/data";

interface Props {
  item: UnitPositionProps;
  no: number;
  token: string;
  lineId: string;
  userId: string;
}

const surfaceErr = (err: unknown, fallback: string) =>
  isAxiosError(err)
    ? err.response?.data?.message ?? err.message
    : err instanceof Error
      ? err.message
      : fallback;

const slotChipCls = (filled: number, total: number) => {
  if (total === 0) return "bg-gray-50 text-gray-500 border-gray-200";
  if (filled === total) return "bg-amber-50 text-amber-700 border-amber-200";
  if (filled === 0) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  return "bg-blue-50 text-blue-700 border-blue-200";
};

const PositionItem = ({ item, no, token, lineId, userId }: Props) => {
  const [onOpen, setOnOpen] = useState(0); // 0 closed · 1 fill · 2 delete
  const nav = useNavigate();
  const queryClient = useQueryClient();

  const slotCount = item.slot?.length ?? 0;
  const filled = (item.slot ?? []).filter((s) => s.occupied === true).length;
  const vacant = slotCount - filled;
  const applicationCount = (item as any)._count?.applications ?? 0;

  const positionType = item.plantilla
    ? "Plantilla"
    : item.fixToUnit
      ? "Fixed to Unit"
      : null;
  const positionTypeCls = item.plantilla
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : item.fixToUnit
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-gray-50 text-gray-700 border-gray-200";

  const removeMut = useMutation({
    mutationFn: () => removePosition(token, item.id, lineId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["postions", item.departmentId],
        refetchType: "active",
      });
      toast.success("Position removed");
      setOnOpen(0);
    },
    onError: (err) =>
      toast.error(surfaceErr(err, "Failed to remove position")),
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <TableRow className="hover:bg-blue-50/40 cursor-pointer">
          <TableCell className="text-[10px] text-gray-500">{no}</TableCell>

          <TableCell>
            <div className="flex items-center gap-1">
              <Hash className="h-2.5 w-2.5 text-gray-400" />
              <span className="text-[11px] font-mono text-gray-800">
                {item.itemNumber || "—"}
              </span>
            </div>
          </TableCell>

          <TableCell>
            <div className="flex items-start gap-1.5">
              <div className="p-1 rounded bg-blue-50 flex-shrink-0">
                <Briefcase className="h-3 w-3 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">
                  {item.position?.name ?? "Untitled"}
                </p>
                {positionType && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 mt-0.5 ${positionTypeCls}`}
                  >
                    {positionType}
                  </Badge>
                )}
              </div>
            </div>
          </TableCell>

          <TableCell>
            <div className="flex items-center gap-1.5">
              <User className="h-2.5 w-2.5 text-gray-400" />
              <span className="text-[11px] text-gray-800 truncate">
                {item.designation && item.designation !== "N/A"
                  ? item.designation
                  : "—"}
              </span>
            </div>
          </TableCell>

          <TableCell className="text-center">
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 gap-1 ${slotChipCls(filled, slotCount)}`}
              title={`${filled} of ${slotCount} filled`}
            >
              <Users className="h-2.5 w-2.5" />
              {filled}/{slotCount}
            </Badge>
          </TableCell>

          <TableCell>
            <span className="text-[10px] text-gray-500">—</span>
          </TableCell>

          <TableCell className="text-center">
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${
                item.fixToUnit
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-blue-50 text-blue-700 border-blue-200"
              }`}
            >
              {item.fixToUnit ? "Fixed" : "Active"}
            </Badge>
          </TableCell>

          <TableCell className="text-center">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {applicationCount}
            </Badge>
          </TableCell>
        </TableRow>
      </PopoverTrigger>

      <PopoverContent
        className="w-72 p-2.5"
        align="end"
        side="bottom"
        sideOffset={4}
        collisionPadding={16}
      >
        <div className="space-y-2.5">
          {/* Header */}
          <div className="flex items-start gap-2 pb-2 border-b">
            <div className="p-1.5 bg-blue-50 rounded">
              <Briefcase className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">
                {item.position?.name ?? "Untitled"}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {positionType && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${positionTypeCls}`}
                  >
                    {positionType}
                  </Badge>
                )}
                {item.designation && item.designation !== "N/A" && (
                  <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                    <User className="h-2.5 w-2.5" />
                    {item.designation}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-1.5">
            <Stat label="Filled" value={filled} />
            <Stat label="Vacant" value={vacant} highlight={vacant > 0} />
            <Stat label="Total" value={slotCount} />
          </div>

          {/* Actions */}
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
              Actions
            </p>

            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 justify-start gap-1.5 text-[11px] hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
              disabled={vacant === 0}
              onClick={() => setOnOpen(1)}
              title={
                vacant === 0
                  ? "No vacant slots to fill"
                  : "Send an invitation to fill a slot"
              }
            >
              <UserPlus className="h-3 w-3" />
              <span>Fill Position</span>
              <ArrowRight className="h-2.5 w-2.5 ml-auto" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 justify-start gap-1.5 text-[11px] hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
              disabled={vacant === 0}
              onClick={() => nav(`position/${item.id}/select-applicant`)}
              title={
                vacant === 0
                  ? "No vacant slots — nobody to invite into"
                  : "Pick from existing applications and send an invitation email"
              }
            >
              <Inbox className="h-3 w-3" />
              <span>Select from Applications</span>
              <ArrowRight className="h-2.5 w-2.5 ml-auto" />
            </Button>

            <UpdateAccountStatus
              isAvailable={filled === 0}
              isOpen={onOpen}
              setOnOpen={setOnOpen}
              token={token}
              departmentId={item.departmentId}
              lineId={lineId}
              userId={userId}
              slots={item.slot ?? []}
            />

            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 justify-start gap-1.5 text-[11px]"
              onClick={() => nav(`position/${item.id}`)}
            >
              <UserCog className="h-3 w-3" />
              <span>View Details</span>
              <ArrowRight className="h-2.5 w-2.5 ml-auto" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 justify-start gap-1.5 text-[11px] text-red-600 hover:bg-red-50 hover:border-red-200"
              onClick={() => setOnOpen(2)}
              disabled={filled > 0}
              title={
                filled > 0
                  ? "Vacate or transfer occupied slots before removing"
                  : "Remove this position from the unit"
              }
            >
              {removeMut.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              <span>Remove</span>
              <ArrowRight className="h-2.5 w-2.5 ml-auto" />
            </Button>
          </div>

          {/* Fill (invitation) modal */}
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

          {/* Remove confirm */}
          <Modal
            title={undefined}
            children={
              <ConfirmDelete
                title="Remove position"
                confirmation="confirm"
                setOnOpen={() => {
                  if (!removeMut.isPending) setOnOpen(0);
                }}
                onFunction={() => {
                  if (!removeMut.isPending) removeMut.mutateAsync();
                }}
                isLoading={removeMut.isPending}
              />
            }
            onOpen={onOpen === 2}
            className=""
            setOnOpen={() => {
              if (removeMut.isPending) return;
              setOnOpen(0);
            }}
            footer={1}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};

const Stat = ({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) => (
  <div
    className={`border rounded text-center py-1.5 ${
      highlight ? "bg-emerald-50 border-emerald-200" : "bg-gray-50"
    }`}
  >
    <p
      className={`text-sm font-bold leading-none ${
        highlight ? "text-emerald-700" : "text-gray-800"
      }`}
    >
      {value}
    </p>
    <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
  </div>
);

export default memo(PositionItem);
