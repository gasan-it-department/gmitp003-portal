import { memo, useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { deleleteApplication } from "@/db/statements/application";
import { formatDate } from "@/utils/date";
import { applicationStatus } from "@/utils/helper";
import { searchedChar } from "@/utils/element";

import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import Modal from "@/components/custom/Modal";
import ConfirmDelete from "@/layout/ConfirmDelete";
import { History } from "lucide-react";

import type { SubmittedApplicationProps } from "@/interface/data";

interface Props {
  item: SubmittedApplicationProps;
  no: number;
  query: string;
  onMultiSelect: boolean;
  handleCheckSelected: (id: string) => boolean;
  handleAddSelected: (id: string) => void;
  token: string;
  userId: string;
  lineId: string;
  statusColor?: (s: number) => string;
}

const ApplicationItem = ({
  no,
  item,
  query,
  onMultiSelect,
  handleCheckSelected,
  handleAddSelected,
  userId,
  token,
  lineId,
  statusColor,
}: Props) => {
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const [onOpen, setOnOpen] = useState(0);
  const checked = handleCheckSelected(item.id);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: () => deleleteApplication(item.id, token, userId, lineId),
    onSuccess: () => {
      setOnOpen(0);
      toast.success("Application deleted");
      queryClient.invalidateQueries({
        queryKey: ["applications", item.lineId],
      });
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ??
          (err instanceof Error ? err.message : "Delete failed"),
      );
    },
  });

  const sCls =
    statusColor?.(item.status) ??
    "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <TableRow
          className={`hover:bg-blue-50/40 cursor-pointer ${
            checked ? "bg-blue-50/50" : ""
          }`}
          onClick={() => {
            if (onMultiSelect) handleAddSelected(item.id);
            else nav(item.id);
          }}
        >
          {onMultiSelect && (
            <TableCell onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={checked}
                onCheckedChange={() => handleAddSelected(item.id)}
                className="border-gray-300"
              />
            </TableCell>
          )}
          <TableCell className="text-[10px] text-gray-500">{no}</TableCell>
          <TableCell className="text-[11px] text-gray-800 truncate max-w-[200px]">
            {item?.forPosition?.name || "—"}
          </TableCell>
          <TableCell className="text-[11px] text-gray-900 font-medium max-w-[240px]">
            <span className="inline-flex items-center gap-1.5">
              <span className="truncate">
                {searchedChar(query, item.lastname)},{" "}
                {searchedChar(query, item.firstname)}
              </span>
              {item.hasRecord && (
                <Badge
                  variant="outline"
                  title="This applicant already has a record in this line (previously hired, invited, or applied before)."
                  className="text-[9px] px-1 py-0 gap-0.5 bg-amber-50 text-amber-700 border-amber-200 flex-none"
                >
                  <History className="h-2.5 w-2.5" />
                  Record
                </Badge>
              )}
            </span>
          </TableCell>
          <TableCell className="text-[10px] text-gray-600">
            {formatDate(item.timestamp)}
          </TableCell>
          <TableCell className="text-center">
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${sCls}`}
            >
              {applicationStatus[item.status] ?? "—"}
            </Badge>
          </TableCell>
        </TableRow>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel className="text-[10px]">Actions</ContextMenuLabel>
        <ContextMenuItem
          className="text-[11px]"
          onClick={() => nav(item.id)}
        >
          Open
        </ContextMenuItem>
        <ContextMenuItem
          className="text-[11px] text-red-600 focus:text-red-700 focus:bg-red-50"
          disabled={isPending}
          onClick={() => setOnOpen(1)}
        >
          Delete
        </ContextMenuItem>
      </ContextMenuContent>

      <Modal
        title={undefined}
        onOpen={onOpen === 1}
        className=""
        footer={1}
        setOnOpen={() => {
          if (isPending) return;
          setOnOpen(0);
        }}
      >
        <ConfirmDelete
          title="Delete application"
          confirmation="confirm"
          setOnOpen={() => {
            if (!isPending) setOnOpen(0);
          }}
          onFunction={() => {
            if (!isPending) mutateAsync();
          }}
          isLoading={isPending}
        />
      </Modal>
    </ContextMenu>
  );
};

export default memo(ApplicationItem);
