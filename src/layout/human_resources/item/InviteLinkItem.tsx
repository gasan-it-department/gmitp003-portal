import { useState, memo } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
//components and layout
import { TableRow, TableCell } from "@/components/ui/table";
import Modal from "@/components/custom/Modal";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
//icons
import {
  Trash,
  Pause,
  Eye,
  Link,
  Calendar,
  Clock,
  AlertCircle,
} from "lucide-react";
//utils
import { formatDate } from "@/utils/date";
import { inviteLinkStatus } from "@/utils/helper";

//db
import { deleteInviteLink } from "@/db/statement";
//interface and Props
import type {
  InvitationLinkProps,
  ProtectedRouteProps,
} from "@/interface/data";

interface Props {
  no: number;
  item: InvitationLinkProps;
  auth: ProtectedRouteProps;
  lineId: string | undefined;
}

const InviteLinkItem = ({ no, item, auth, lineId }: Props) => {
  const [onOpen, setOnOpen] = useState(0);

  const nav = useNavigate();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () =>
      deleteInviteLink(
        auth.token as string,
        item.id,
        auth.userId as string,
        lineId as string,
      ),
    mutationKey: ["delete-link", item.id],
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["invitations", lineId],
        refetchType: "active",
      });
      setOnOpen(0);
      toast.success("Invitation link deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete.", {
        closeButton: false,
        description: "Something went wrong",
      });
    },
  });

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1:
        return "bg-green-100 text-green-700 border-green-200";
      case 2:
        return "bg-red-100 text-red-700 border-red-200";
      case 0:
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <>
      <TableRow
        className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
        onClick={() => setOnOpen(1)}
      >
        <TableCell className="py-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
            {no}
          </div>
        </TableCell>
        <TableCell className="py-3">
          <div className="flex items-center gap-2">
            <Link className="h-3.5 w-3.5 text-gray-400" />
            <span className="font-mono text-sm font-medium text-gray-800">
              {item.code}
            </span>
          </div>
        </TableCell>
        <TableCell className="py-3 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            {formatDate(item.createdAt)}
          </div>
        </TableCell>
        <TableCell className="py-3 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            {formatDate(item.expiresAt)}
          </div>
        </TableCell>
        <TableCell className="py-3">
          <Badge
            variant="outline"
            className={`text-xs font-normal ${getStatusColor(item.status)}`}
          >
            {inviteLinkStatus(item.status)}
          </Badge>
        </TableCell>
      </TableRow>

      {/* View Details Modal */}
      <Modal
        title={`Invite Link Details`}
        onOpen={onOpen === 1}
        className="max-w-md"
        setOnOpen={() => setOnOpen(0)}
      >
        <div className="space-y-4 p-1">
          {/* Header with icon */}
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <Link className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Invitation Link</h3>
              <p className="text-xs text-gray-500">Code: {item.code}</p>
            </div>
          </div>

          {/* Link Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm font-medium text-gray-600">Status</span>
              <Badge
                variant="outline"
                className={`text-xs ${getStatusColor(item.status)}`}
              >
                {inviteLinkStatus(item.status)}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm font-medium text-gray-600">
                Date Created
              </span>
              <span className="text-sm text-gray-800">
                {formatDate(item.createdAt)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm font-medium text-gray-600">
                Expiration Date
              </span>
              <span className="text-sm text-gray-800">
                {formatDate(item.expiresAt)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-gray-600">
                Link URL
              </span>
              <span className="text-xs text-gray-500 font-mono truncate max-w-[200px]">
                {item.url}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                setOnOpen(2);
              }}
              className="gap-2 flex-1"
            >
              <Trash className="h-4 w-4" />
              Delete
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setOnOpen(3)}
              className="gap-2 flex-1 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
              disabled={item.status !== 0}
            >
              <Pause className="h-4 w-4" />
              Suspend
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => nav(item.url)}
              className="gap-2 flex-1 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
            >
              <Eye className="h-4 w-4" />
              Visit
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Invitation Link"
        onOpen={onOpen === 2}
        className="max-w-md"
        setOnOpen={() => {
          if (isPending) return;
          setOnOpen(0);
        }}
        footer={true}
        yesTitle="Confirm Delete"
        onFunction={() => mutateAsync()}
        loading={isPending}
      >
        <div className="space-y-3 p-1">
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Delete Link: {item.code}
              </h3>
              <p className="text-xs text-gray-500">
                This action cannot be undone
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              Are you sure you want to delete this invitation link?
            </p>
            <div className="rounded-md bg-amber-50 p-3 border border-amber-200">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-amber-800 mb-0.5">
                    Warning: This action is irreversible
                  </p>
                  <p className="text-xs text-amber-700">
                    Deleting this link will not affect users who have already
                    registered using it. However, the link can no longer be used
                    for new registrations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Suspend Link Modal */}
      <Modal
        title="Suspend Invitation Link"
        onOpen={onOpen === 3}
        className="max-w-md"
        setOnOpen={() => {
          if (isPending) return;
          setOnOpen(0);
        }}
      >
        <div className="space-y-3 p-1">
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Pause className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Suspend Link: {item.code}
              </h3>
              <p className="text-xs text-gray-500">
                Temporarily disable this invitation link
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              Are you sure you want to suspend this invitation link?
            </p>
            <div className="rounded-md bg-blue-50 p-3 border border-blue-200">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-blue-800 mb-0.5">
                    Information
                  </p>
                  <p className="text-xs text-blue-700">
                    Suspended links cannot be used for new registrations. You
                    can reactivate them later if needed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setOnOpen(0)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => {
                // Handle suspend action here
                toast.info("Suspend functionality coming soon");
                setOnOpen(0);
              }}
              className="flex-1 bg-amber-600 hover:bg-amber-700"
            >
              Confirm Suspend
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default memo(InviteLinkItem);
