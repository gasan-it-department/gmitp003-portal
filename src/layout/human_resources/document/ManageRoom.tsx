import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";

//
import { removeRoom, updateRoomStatus } from "@/db/statements/document";
//
import { Button } from "@/components/ui/button";
import Modal from "@/components/custom/Modal";
import ConfirmDelete from "@/layout/ConfirmDelete";
import { toast } from "sonner";
import {
  AlertCircle,
  Trash2,
  Power,
  PowerOff,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

//
interface Props {
  id: string;
  userId: string;
  lineId: string;
  token: string;
  status: number;
}

// Confirmation component for status change
const ConfirmStatusChange = ({
  action,
  onConfirm,
  onCancel,
  isLoading,
}: {
  action: "activate" | "deactivate";
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) => {
  const isActivate = action === "activate";

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`p-2 rounded-full ${isActivate ? "bg-green-100" : "bg-amber-100"}`}
        >
          {isActivate ? (
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          ) : (
            <XCircle className="h-6 w-6 text-amber-600" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {isActivate ? "Activate Room" : "Deactivate Room"}
          </h3>
          <p className="text-sm text-gray-500">
            {isActivate
              ? "This will enable the room to receive documents and be accessible to users."
              : "This will prevent the room from receiving documents and being accessed by users."}
          </p>
        </div>
      </div>

      <div
        className={`mb-6 p-3 rounded-md ${isActivate ? "bg-green-50" : "bg-amber-50"}`}
      >
        <p
          className={`text-sm ${isActivate ? "text-green-700" : "text-amber-700"}`}
        >
          <span className="font-medium">Are you sure?</span> This action can be
          reversed at any time.
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          variant={isActivate ? "default" : "destructive"}
          className={`flex-1 ${isActivate ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"}`}
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {isActivate ? "Activating..." : "Deactivating..."}
            </>
          ) : (
            <>{isActivate ? "Yes, Activate" : "Yes, Deactivate"}</>
          )}
        </Button>
      </div>
    </div>
  );
};

const ManageRoom = ({ id, userId, lineId, token, status }: Props) => {
  const [isOpen, setIsOpen] = useState(0); // 0: closed, 1: delete, 2: status change
  const nav = useNavigate();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: () => removeRoom(token, id, userId, lineId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["rooms", lineId],
      });
      toast.success("Room removed successfully", {
        description: "The room has been deleted from the system.",
      });
      nav(-1);
    },
    onError: (err) => {
      toast.error("Transaction Failed", {
        description: err.message,
      });
    },
  });

  const updateRoomStatusMutation = useMutation({
    mutationFn: ({ status }: { status: number }) =>
      updateRoomStatus(token, id, userId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["room", id],
      });
      toast.success(
        `Room ${variables.status === 1 ? "activated" : "deactivated"} successfully`,
      );
      setIsOpen(0); // Close modal on success
    },
    onError: (err) => {
      toast.error("Transaction Failed", {
        description: err.message,
      });
    },
  });

  // Status: 0 - Inactive, 1 - Active
  const isActive = status === 1;

  const handleStatusToggle = () => {
    setIsOpen(2); // Open status change modal
  };

  const confirmStatusChange = () => {
    updateRoomStatusMutation.mutateAsync({ status: isActive ? 0 : 1 });
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500 animate-pulse" : "bg-gray-300"}`}
          />
          <span className="text-sm font-medium text-gray-600">
            Room Status:
            <span
              className={`ml-1 ${isActive ? "text-green-600" : "text-gray-500"}`}
            >
              {isActive ? "Active" : "Inactive"}
            </span>
          </span>
        </div>
        <span className="text-xs text-gray-400">ID: {id.slice(0, 8)}...</span>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Status Toggle Button */}
        <Button
          variant={isActive ? "outline" : "default"}
          size="default"
          className={`w-full justify-start gap-2 ${
            isActive
              ? "border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
          onClick={handleStatusToggle}
          disabled={updateRoomStatusMutation.isPending}
        >
          {updateRoomStatusMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isActive ? (
            <PowerOff className="h-4 w-4" />
          ) : (
            <Power className="h-4 w-4" />
          )}
          <span className="flex-1 text-left">
            {updateRoomStatusMutation.isPending
              ? "Updating..."
              : isActive
                ? "Deactivate Room"
                : "Activate Room"}
          </span>
        </Button>

        {/* Remove Button */}
        <Button
          variant="destructive"
          size="default"
          className="w-full justify-start gap-2 bg-red-600 hover:bg-red-700 text-white"
          onClick={() => setIsOpen(1)}
        >
          <Trash2 className="h-4 w-4" />
          <span className="flex-1 text-left">Remove Room</span>
        </Button>

        {/* Status Info Alert */}
        <div className="mt-4 p-3 bg-amber-50 rounded-md border border-amber-200">
          <div className="flex gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-amber-800">
                {isActive ? "Room is active" : "Room is inactive"}
              </p>
              <p className="text-xs text-amber-600">
                {isActive
                  ? "Active rooms can receive documents and be accessed by users."
                  : "Inactive rooms cannot receive documents. Activate to restore functionality."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Remove Room"
        children={
          <ConfirmDelete
            confirmation="confirm"
            setOnOpen={setIsOpen}
            onFunction={() => {
              mutateAsync();
            }}
            isLoading={isPending}
          />
        }
        onOpen={isOpen === 1}
        className="max-w-md"
        setOnOpen={() => {
          if (isPending) return;
          setIsOpen(0);
        }}
        loading={isPending}
      />

      {/* Status Change Confirmation Modal */}
      <Modal
        footer={1}
        title={undefined}
        children={
          <ConfirmStatusChange
            action={isActive ? "deactivate" : "activate"}
            onConfirm={confirmStatusChange}
            onCancel={() => setIsOpen(0)}
            isLoading={updateRoomStatusMutation.isPending}
          />
        }
        onOpen={isOpen === 2}
        className="max-w-md"
        setOnOpen={() => setIsOpen(0)}
        loading={updateRoomStatusMutation.isPending}
      />
    </div>
  );
};

export default ManageRoom;
