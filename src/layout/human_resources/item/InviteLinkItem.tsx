import { memo, useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { isAxiosError } from "axios";

import { deleteInviteLink, suspendInviteLink } from "@/db/statement";
import { formatDate } from "@/utils/date";
import { inviteLinkStatus } from "@/utils/helper";

import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Modal from "@/components/custom/Modal";
import ConfirmDelete from "@/layout/ConfirmDelete";

import {
  Trash2,
  Pause,
  Play,
  Eye,
  Link as LinkIcon,
  Calendar,
  Clock,
  AlertCircle,
  Loader2,
  Copy,
  Check,
} from "lucide-react";

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

const statusBadgeClass = (status: number) => {
  switch (status) {
    case 1:
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case 2:
      return "bg-amber-50 text-amber-700 border-amber-200";
    case 3:
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

const InviteLinkItem = ({ no, item, auth, lineId }: Props) => {
  const [onOpen, setOnOpen] = useState(0);
  const [copied, setCopied] = useState(false);

  const nav = useNavigate();
  const queryClient = useQueryClient();

  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: ["invitations", lineId],
      refetchType: "active",
    });

  const deleteMut = useMutation({
    mutationFn: () =>
      deleteInviteLink(
        auth.token as string,
        item.id,
        auth.userId as string,
        lineId as string,
      ),
    onSuccess: async () => {
      await refresh();
      toast.success("Invitation link removed");
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

  const suspendMut = useMutation({
    mutationFn: (suspend: boolean) =>
      suspendInviteLink(
        auth.token as string,
        item.id,
        suspend,
        auth.userId as string,
        lineId as string,
      ),
    onSuccess: async (_, suspend) => {
      await refresh();
      toast.success(suspend ? "Link suspended" : "Link reactivated");
      setOnOpen(0);
    },
    onError: (err) => {
      const msg = isAxiosError(err)
        ? err.response?.data?.message ??
          err.response?.data?.error ??
          err.message
        : err instanceof Error
          ? err.message
          : "Failed to update status";
      toast.error(msg);
    },
  });

  const effective = item.effectiveStatus ?? item.status;
  const isActive = item.status === 1 && effective === 1;
  const isSuspended = item.status === 2;
  const isExpired = effective === 3;
  const baseStatus = item.status; // for actions, ignore expiration

  const fullUrl =
    typeof window !== "undefined" ? `${window.location.origin}${item.url}` : item.url;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <>
      <TableRow
        className="hover:bg-blue-50/40 cursor-pointer"
        onClick={() => setOnOpen(1)}
      >
        <TableCell className="text-[10px] text-gray-500">{no}</TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5">
            <LinkIcon className="h-2.5 w-2.5 text-gray-400" />
            <code className="text-[11px] font-mono text-gray-800">
              {item.code}
            </code>
          </div>
        </TableCell>
        <TableCell className="text-[10px] text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="h-2.5 w-2.5 text-gray-400" />
            {formatDate(item.createdAt)}
          </div>
        </TableCell>
        <TableCell className="text-[10px] text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="h-2.5 w-2.5 text-gray-400" />
            {formatDate(item.expiresAt)}
          </div>
        </TableCell>
        <TableCell className="text-center">
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${statusBadgeClass(effective)}`}
          >
            {inviteLinkStatus(effective)}
          </Badge>
        </TableCell>
      </TableRow>

      {/* Details modal */}
      <Modal
        title="Invitation Link"
        onOpen={onOpen === 1}
        className="max-w-md"
        setOnOpen={() => setOnOpen(0)}
      >
        <div className="space-y-3">
          {/* Code header */}
          <div className="flex items-center gap-2 pb-2 border-b">
            <div className="p-1.5 bg-blue-600 rounded-md">
              <LinkIcon className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900">
                Code{" "}
                <code className="font-mono text-blue-700">{item.code}</code>
              </p>
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 mt-0.5 ${statusBadgeClass(effective)}`}
              >
                {inviteLinkStatus(effective)}
              </Badge>
            </div>
          </div>

          {/* Field list */}
          <div className="space-y-2">
            <Row label="Created" value={formatDate(item.createdAt)} />
            <Row label="Expires" value={formatDate(item.expiresAt)} />
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                Link URL
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <code className="flex-1 text-[10px] font-mono text-gray-700 break-all bg-gray-50 border rounded px-2 py-1.5">
                  {fullUrl}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="h-7 w-7 p-0 flex-shrink-0"
                  title="Copy link"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 pt-2 border-t">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px] gap-1.5 flex-1"
              onClick={() => nav(item.url)}
            >
              <Eye className="h-3 w-3" />
              Visit
            </Button>
            {!isExpired && baseStatus !== 0 && (
              <Button
                size="sm"
                variant="outline"
                className={`h-7 text-[10px] gap-1.5 flex-1 ${
                  isSuspended
                    ? "hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                    : "hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
                }`}
                onClick={() => suspendMut.mutateAsync(!isSuspended)}
                disabled={suspendMut.isPending}
              >
                {suspendMut.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : isSuspended ? (
                  <Play className="h-3 w-3" />
                ) : (
                  <Pause className="h-3 w-3" />
                )}
                {isSuspended ? "Reactivate" : "Suspend"}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px] gap-1.5 flex-1 text-red-600 hover:bg-red-50 hover:border-red-200"
              onClick={() => setOnOpen(2)}
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        title={undefined}
        onOpen={onOpen === 2}
        className=""
        footer={1}
        setOnOpen={() => {
          if (deleteMut.isPending) return;
          setOnOpen(0);
        }}
      >
        <div className="space-y-2.5">
          <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-100 rounded-md">
            <AlertCircle className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-semibold text-amber-800">
                This action can't be undone
              </p>
              <p className="text-[10px] text-amber-700 mt-0.5">
                Deleting <code className="font-mono">{item.code}</code> hides it
                from this list. Users who already registered with this code
                are unaffected.
              </p>
            </div>
          </div>
          <ConfirmDelete
            title="Delete invitation link"
            confirmation="confirm"
            setOnOpen={() => {
              if (!deleteMut.isPending) setOnOpen(0);
            }}
            onFunction={() => {
              if (!deleteMut.isPending) deleteMut.mutateAsync();
            }}
            isLoading={deleteMut.isPending}
          />
        </div>
      </Modal>

      {/* Activity / loading toast (handled via mutation onSuccess) */}
      {isActive ? null : null}
    </>
  );
};

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-2 text-[10px]">
    <span className="text-gray-500 uppercase tracking-wide">{label}</span>
    <span className="text-gray-800 text-right">{value ?? "—"}</span>
  </div>
);

export default memo(InviteLinkItem);
