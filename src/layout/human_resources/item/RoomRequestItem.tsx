import { memo, useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { isAxiosError } from "axios";

import {
  upadateRequestStatus,
  deleteDocumentRoomRequest,
} from "@/db/statements/document";

import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Modal from "@/components/custom/Modal";
import ConfirmDelete from "@/layout/ConfirmDelete";

import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  MapPin,
  MoreVertical,
  Trash2,
  Info,
} from "lucide-react";

import type { RoomRegistration } from "@/interface/data";

interface Props {
  item: RoomRegistration;
  userId: string;
  lineId: string;
  token: string;
  queryClient: QueryClient;
}

const statusBadge = (status: number) => {
  switch (status) {
    case 0:
      return {
        cls: "bg-amber-50 text-amber-700 border-amber-200",
        icon: <Clock className="h-2.5 w-2.5 mr-1" />,
        label: "Pending",
      };
    case 1:
      return {
        cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: <CheckCircle className="h-2.5 w-2.5 mr-1" />,
        label: "Approved",
      };
    case 2:
      return {
        cls: "bg-red-50 text-red-700 border-red-200",
        icon: <AlertCircle className="h-2.5 w-2.5 mr-1" />,
        label: "Rejected",
      };
    default:
      return {
        cls: "bg-gray-50 text-gray-700 border-gray-200",
        icon: null,
        label: "Unknown",
      };
  }
};

const RoomRequestItem = ({
  item,
  token,
  userId,
  lineId,
  queryClient,
}: Props) => {
  const [onOpen, setOnOpen] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const nav = useNavigate();

  const updateMut = useMutation({
    mutationFn: ({ status }: { status: number }) =>
      upadateRequestStatus(token, item.id, lineId, userId, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["room-request", lineId],
        refetchType: "active",
      });
      toast.success("Request status updated");
      setOnOpen(0);
    },
    onError: (err) => {
      const msg = isAxiosError(err)
        ? err.response?.data?.message ?? err.message
        : err instanceof Error
          ? err.message
          : "Failed to update status";
      toast.error(msg);
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteDocumentRoomRequest(token, item.id, userId, lineId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["room-request", lineId],
        refetchType: "active",
      });
      toast.success("Request deleted");
      setOnOpen(0);
    },
    onError: (err) => {
      const msg = isAxiosError(err)
        ? err.response?.data?.message ?? err.message
        : err instanceof Error
          ? err.message
          : "Failed to delete";
      toast.error(msg);
    },
  });

  const handleDeleteClick = () => {
    setDropdownOpen(false);
    setTimeout(() => setOnOpen(1), 80);
  };

  const status = statusBadge(item.status);
  const fullName =
    [item.user?.firstName, item.user?.lastName].filter(Boolean).join(" ") ||
    "Unknown user";

  return (
    <>
      <TableRow className="hover:bg-blue-50/40">
        <TableCell className="text-[10px] font-mono text-gray-700">
          <div className="flex items-center gap-1">
            <FileText className="h-2.5 w-2.5 text-gray-400" />
            {item.id.slice(0, 8)}
          </div>
        </TableCell>
        <TableCell>
          <p className="text-[11px] font-medium text-gray-900 truncate max-w-[200px]">
            {fullName}
          </p>
          {item.user?.email && (
            <p className="text-[10px] text-gray-500 truncate max-w-[200px]">
              {item.user.email}
            </p>
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5 max-w-[220px]">
            <MapPin className="h-2.5 w-2.5 text-gray-400 flex-shrink-0" />
            <span className="text-[11px] text-gray-800 truncate">
              {item.address ?? "—"}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {item.line?.name || "—"}
          </Badge>
        </TableCell>
        <TableCell className="text-center">
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${status.cls}`}
          >
            {status.icon}
            {status.label}
          </Badge>
        </TableCell>
        <TableCell className="text-[10px] text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="h-2.5 w-2.5 text-gray-400" />
            {item.timestamp
              ? new Date(item.timestamp).toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "—"}
          </div>
        </TableCell>
        <TableCell className="text-right">
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-[11px] gap-1.5"
                onClick={() => nav(`request/${item.id}`)}
              >
                <Info className="h-3 w-3" />
                View details
              </DropdownMenuItem>
              {item.status === 0 && (
                <>
                  <DropdownMenuItem
                    className="text-[11px] gap-1.5 text-emerald-700 focus:bg-emerald-50"
                    onClick={() =>
                      !updateMut.isPending && updateMut.mutateAsync({ status: 1 })
                    }
                  >
                    <CheckCircle className="h-3 w-3" />
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-[11px] gap-1.5 text-amber-700 focus:bg-amber-50"
                    onClick={() =>
                      !updateMut.isPending && updateMut.mutateAsync({ status: 2 })
                    }
                  >
                    <AlertCircle className="h-3 w-3" />
                    Reject
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem
                className="text-[11px] gap-1.5 text-red-600 focus:bg-red-50 focus:text-red-700"
                onClick={handleDeleteClick}
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {/* Delete confirm */}
      <Modal
        title={undefined}
        onOpen={onOpen === 1}
        footer={1}
        className="z-[60]"
        setOnOpen={() => {
          if (deleteMut.isPending) return;
          setOnOpen(0);
        }}
      >
        <ConfirmDelete
          title="Delete request"
          confirmation="confirm"
          setOnOpen={() => {
            if (!deleteMut.isPending) setOnOpen(0);
          }}
          onFunction={() => {
            if (!deleteMut.isPending) deleteMut.mutateAsync();
          }}
          isLoading={deleteMut.isPending}
        />
      </Modal>
    </>
  );
};

export default memo(RoomRequestItem);
