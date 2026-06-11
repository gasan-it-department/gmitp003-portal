import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { isAxiosError } from "axios";

import { removeRoom, updateRoomStatus } from "@/db/statements/document";

import { Button } from "@/components/ui/button";
import Modal from "@/components/custom/Modal";
import ConfirmDelete from "@/layout/ConfirmDelete";

import {
  AlertCircle,
  Trash2,
  Power,
  PowerOff,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface Props {
  id: string;
  userId: string;
  lineId: string;
  token: string;
  status: number;
}

const surfaceErr = (err: unknown, fallback: string) =>
  isAxiosError(err)
    ? err.response?.data?.message ?? err.message
    : err instanceof Error
      ? err.message
      : fallback;

const ManageRoom = ({ id, userId, lineId, token, status }: Props) => {
  const [isOpen, setIsOpen] = useState(0); // 0 closed · 1 delete · 2 status
  const nav = useNavigate();
  const queryClient = useQueryClient();

  const isActive = status === 1;

  const removeMut = useMutation({
    mutationFn: () => removeRoom(token, id, userId, lineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms", lineId] });
      toast.success("Room removed");
      nav(-1);
    },
    onError: (err) => toast.error(surfaceErr(err, "Failed to remove room")),
  });

  const statusMut = useMutation({
    mutationFn: ({ next }: { next: number }) =>
      updateRoomStatus(token, id, userId, next),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["room", id] });
      await queryClient.invalidateQueries({ queryKey: ["rooms", lineId] });
      toast.success(
        variables.next === 1 ? "Room activated" : "Room deactivated",
      );
      setIsOpen(0);
    },
    onError: (err) => toast.error(surfaceErr(err, "Failed to update status")),
  });

  const confirmStatusChange = () =>
    statusMut.mutateAsync({ next: isActive ? 0 : 1 });

  return (
    <div className="p-3 space-y-3">
      {/* Status strip */}
      <div className="flex items-center justify-between gap-2 px-2.5 py-2 border rounded-md bg-gray-50">
        <div className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${
              isActive ? "bg-emerald-500" : "bg-gray-400"
            }`}
          />
          <span className="text-[11px] font-medium text-gray-800">
            Status
          </span>
          <span
            className={`text-[11px] ${
              isActive ? "text-emerald-700" : "text-gray-500"
            }`}
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <span className="text-[10px] text-gray-400 font-mono">
          {id.slice(0, 8)}
        </span>
      </div>

      {/* Action buttons */}
      <div className="space-y-2">
        <Button
          variant={isActive ? "outline" : "default"}
          className={`w-full h-8 text-[11px] justify-start gap-1.5 ${
            isActive
              ? "border-amber-200 text-amber-700 hover:bg-amber-50"
              : "bg-emerald-600 hover:bg-emerald-700 text-white"
          }`}
          onClick={() => setIsOpen(2)}
          disabled={statusMut.isPending}
        >
          {statusMut.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : isActive ? (
            <PowerOff className="h-3 w-3" />
          ) : (
            <Power className="h-3 w-3" />
          )}
          {isActive ? "Deactivate Room" : "Activate Room"}
        </Button>

        <Button
          variant="destructive"
          className="w-full h-8 text-[11px] justify-start gap-1.5 bg-red-600 hover:bg-red-700"
          onClick={() => setIsOpen(1)}
          disabled={removeMut.isPending}
        >
          {removeMut.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
          Remove Room
        </Button>
      </div>

      {/* Info callout */}
      <div className="flex items-start gap-1.5 p-2 bg-amber-50 border border-amber-100 rounded-md">
        <AlertCircle className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-amber-800">
            {isActive ? "Room is active" : "Room is inactive"}
          </p>
          <p className="text-[10px] text-amber-700 mt-0.5">
            {isActive
              ? "Active rooms can receive documents and are visible to authorized users."
              : "Inactive rooms cannot receive new documents. Reactivate any time."}
          </p>
        </div>
      </div>

      {/* Delete modal */}
      <Modal
        title={undefined}
        onOpen={isOpen === 1}
        className=""
        footer={1}
        loading={removeMut.isPending}
        setOnOpen={() => {
          if (removeMut.isPending) return;
          setIsOpen(0);
        }}
      >
        <ConfirmDelete
          title="Remove room"
          confirmation="confirm"
          setOnOpen={() => {
            if (!removeMut.isPending) setIsOpen(0);
          }}
          onFunction={() => {
            if (!removeMut.isPending) removeMut.mutateAsync();
          }}
          isLoading={removeMut.isPending}
        />
      </Modal>

      {/* Status toggle modal */}
      <Modal
        title={undefined}
        onOpen={isOpen === 2}
        className=""
        footer={1}
        loading={statusMut.isPending}
        setOnOpen={() => {
          if (statusMut.isPending) return;
          setIsOpen(0);
        }}
      >
        <div className="p-3 space-y-3">
          <div className="flex items-start gap-2 pb-2 border-b">
            <div
              className={`p-1.5 rounded-md ${
                isActive
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {isActive ? (
                <XCircle className="h-3.5 w-3.5" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900">
                {isActive ? "Deactivate room?" : "Activate room?"}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {isActive
                  ? "Hides this room from new documents. Reactivate any time."
                  : "Allows this room to receive documents again."}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px]"
              onClick={() => setIsOpen(0)}
              disabled={statusMut.isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className={`h-7 text-[10px] gap-1.5 ${
                isActive
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
              onClick={confirmStatusChange}
              disabled={statusMut.isPending}
            >
              {statusMut.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : isActive ? (
                <PowerOff className="h-3 w-3" />
              ) : (
                <Power className="h-3 w-3" />
              )}
              {isActive ? "Deactivate" : "Activate"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManageRoom;
