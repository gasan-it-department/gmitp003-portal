import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { isAxiosError } from "axios";

import { useAuth } from "@/provider/ProtectedRoute";
import {
  documentRoomRequestDetails,
  upadateRequestStatus,
} from "@/db/statements/document";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Modal from "@/components/custom/Modal";

// (imports referenced below) — keep grouped above


import {
  User,
  MapPin,
  Calendar,
  Users,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  ArrowLeft,
  FileText,
  ShieldAlert,
} from "lucide-react";

import type { RoomRegistration } from "@/interface/data";

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
        icon: <XCircle className="h-2.5 w-2.5 mr-1" />,
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

const surfaceErr = (err: unknown, fallback: string) =>
  isAxiosError(err)
    ? err.response?.data?.message ?? err.message
    : err instanceof Error
      ? err.message
      : fallback;

const fmt = (d?: string | Date | null) =>
  d
    ? new Date(d).toLocaleString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const RequestDetail = () => {
  const [onOpen, setOnOpen] = useState(0); // 0 closed · 1 reject · 2 approve
  const { requestId, lineId } = useParams();
  const auth = useAuth();
  const nav = useNavigate();
  const queryClient = useQueryClient();

  const { data, isFetching, isError, error } = useQuery<RoomRegistration>({
    queryKey: ["request-details", requestId],
    queryFn: () =>
      documentRoomRequestDetails(auth.token as string, requestId as string),
    enabled: !!requestId && !!auth.token,
    refetchOnWindowFocus: false,
  });

  const statusMut = useMutation({
    mutationFn: (status: number) =>
      upadateRequestStatus(
        auth.token as string,
        requestId as string,
        lineId as string,
        auth.userId as string,
        status,
      ),
    onSuccess: async (_, status) => {
      await queryClient.invalidateQueries({
        queryKey: ["request-details", requestId],
      });
      await queryClient.invalidateQueries({ queryKey: ["room-request", lineId] });
      toast.success(
        status === 1
          ? "Request approved"
          : status === 2
            ? "Request rejected"
            : "Status updated",
      );
      setOnOpen(0);
    },
    onError: (err) => toast.error(surfaceErr(err, "Failed to update status")),
  });

  if (isFetching && !data) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center gap-1.5 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="text-xs">Loading request...</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-3">
        <div className="border rounded-lg bg-white p-6 text-center max-w-sm w-full">
          <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-gray-800">
            Request not found
          </p>
          <p className="text-[10px] text-gray-500 mt-1">
            {(error as any)?.message ??
              "This request may have been removed."}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[10px] gap-1.5 mt-3"
            onClick={() => nav(-1)}
          >
            <ArrowLeft className="h-3 w-3" />
            Back
          </Button>
        </div>
      </div>
    );
  }

  const status = statusBadge(data.status);
  const initials =
    `${data.user?.firstName?.[0] ?? ""}${data.user?.lastName?.[0] ?? ""}`.toUpperCase() ||
    "U";
  const isPending = data.status === 0;
  const isPendingMut = statusMut.isPending;

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">

      {/* Header */}
      <div className="bg-white border-b flex-shrink-0">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => nav(-1)}
            >
              <ArrowLeft className="h-3 w-3" />
            </Button>
            <div className="p-1.5 bg-blue-600 rounded-md flex-shrink-0">
              <FileText className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-semibold text-gray-900 truncate">
                Room Request Details
              </h1>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5 font-mono">
                #{data.id.slice(0, 8)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${status.cls}`}
            >
              {status.icon}
              {status.label}
            </Badge>
            {isPending && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] gap-1.5 text-red-700 hover:bg-red-50 hover:border-red-200"
                  onClick={() => setOnOpen(1)}
                  disabled={isPendingMut}
                >
                  <XCircle className="h-3 w-3" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-[10px] gap-1.5 bg-blue-600 hover:bg-blue-700"
                  onClick={() => setOnOpen(2)}
                  disabled={isPendingMut}
                >
                  <CheckCircle className="h-3 w-3" />
                  Approve
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-auto p-3">
        <div className="max-w-4xl mx-auto space-y-3">

          {/* Applicant */}
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
              <User className="h-3 w-3 text-blue-500" />
              <h3 className="text-xs font-semibold text-gray-800">
                Applicant
              </h3>
            </div>
            <div className="p-3 flex items-start gap-2.5">
              <Avatar className="h-9 w-9 flex-shrink-0">
                <AvatarFallback className="text-[11px] bg-blue-100 text-blue-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900">
                  {data.user?.firstName} {data.user?.lastName}
                </p>
                <p className="text-[10px] text-gray-500">
                  @{data.user?.username ?? "—"}
                </p>
                {data.user?.email && (
                  <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                    <Mail className="h-2.5 w-2.5" />
                    {data.user.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Request meta */}
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-blue-500" />
              <h3 className="text-xs font-semibold text-gray-800">
                Request Information
              </h3>
            </div>
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Field
                icon={<MapPin className="h-2.5 w-2.5" />}
                label="Address"
                value={data.address}
              />
              <Field
                label="Line"
                value={data.line?.name || data.lineId || "—"}
              />
              <Field
                icon={<Calendar className="h-2.5 w-2.5" />}
                label="Submitted"
                value={fmt(data.timestamp)}
              />
              {data.dateApproved && (
                <Field label="Approved" value={fmt(data.dateApproved)} />
              )}
              {data.dateRejected && (
                <Field label="Rejected" value={fmt(data.dateRejected)} />
              )}
            </div>
          </div>

          {/* Signature */}
          {data.roomRegistrationSignatures?.file_url && (
            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
                <ShieldAlert className="h-3 w-3 text-amber-500" />
                <h3 className="text-xs font-semibold text-gray-800">
                  Signature
                </h3>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200 ml-auto"
                >
                  Confidential
                </Badge>
              </div>
              <div
                className="p-3 relative overflow-hidden bg-gray-50"
                onContextMenu={(e) => e.preventDefault()}
              >
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="rotate-45 text-gray-300/40 text-2xl font-bold whitespace-nowrap">
                    SIGNATURE · CONFIDENTIAL
                  </div>
                </div>
                <div
                  className="absolute inset-0 pointer-events-none z-10"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(45deg, rgba(150,150,150,0.08) 0px, rgba(150,150,150,0.08) 14px, rgba(200,200,200,0.06) 14px, rgba(200,200,200,0.06) 28px)",
                  }}
                />
                <img
                  src={data.roomRegistrationSignatures.file_url}
                  alt="Signature"
                  className="max-h-40 w-auto object-contain mx-auto relative z-0"
                />
                <p className="text-[9px] text-gray-400 text-center mt-1 relative z-20">
                  Not for reproduction
                </p>
              </div>
            </div>
          )}

          {/* Receivers */}
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Users className="h-3 w-3 text-blue-500" />
                <h3 className="text-xs font-semibold text-gray-800">
                  Receivers
                </h3>
              </div>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {data.receivers?.length ?? 0}
              </Badge>
            </div>
            <div className="p-3">
              {data.receivers && data.receivers.length > 0 ? (
                <ul className="divide-y">
                  {data.receivers.map((r) => {
                    const ri =
                      `${r.user?.firstName?.[0] ?? ""}${r.user?.lastName?.[0] ?? ""}`.toUpperCase() ||
                      "U";
                    return (
                      <li key={r.id} className="py-2 flex items-center gap-2">
                        <Avatar className="h-7 w-7 flex-shrink-0">
                          <AvatarFallback className="text-[10px] bg-gray-100 text-gray-700">
                            {ri}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium text-gray-900 truncate">
                            {r.user?.lastName}, {r.user?.firstName}
                          </p>
                          <p className="text-[10px] text-gray-500 truncate">
                            @{r.user?.username ?? "—"}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-[10px] text-gray-400 text-center py-3">
                  No receivers assigned.
                </p>
              )}
            </div>
          </div>

          {/* Conversations */}
          {data.roomRegistrationConversations &&
            data.roomRegistrationConversations.length > 0 && (
              <div className="border rounded-lg bg-white overflow-hidden">
                <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
                  <FileText className="h-3 w-3 text-blue-500" />
                  <h3 className="text-xs font-semibold text-gray-800">
                    Conversations
                  </h3>
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 ml-auto"
                  >
                    {data.roomRegistrationConversations.length}
                  </Badge>
                </div>
                <div className="p-3">
                  <p className="text-[11px] text-gray-600">
                    {data.roomRegistrationConversations.length} conversation
                    {data.roomRegistrationConversations.length === 1 ? "" : "s"}{" "}
                    on this request.
                  </p>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Reject modal */}
      <Modal
        title={undefined}
        onOpen={onOpen === 1}
        className=""
        footer={1}
        setOnOpen={() => {
          if (isPendingMut) return;
          setOnOpen(0);
        }}
      >
        <div className="p-3 space-y-3">
          <div className="flex items-start gap-2 pb-2 border-b">
            <div className="p-1.5 bg-red-100 rounded-md">
              <XCircle className="h-3.5 w-3.5 text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900">
                Reject this request?
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                The applicant won't be granted room access.
              </p>
            </div>
          </div>

          <div className="border rounded-md bg-red-50/50 p-2 space-y-1.5">
            <Row
              label="Applicant"
              value={`${data.user?.firstName ?? ""} ${data.user?.lastName ?? ""}`.trim()}
            />
            <Row label="Address" value={data.address ?? "—"} />
            <Row
              label="Request"
              value={
                <span className="font-mono">{data.id.slice(0, 12)}…</span>
              }
            />
          </div>

          <div className="flex items-start gap-1.5 p-2 bg-amber-50 border border-amber-100 rounded-md">
            <AlertCircle className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-700">
              You can re-approve later if rejected by mistake.
            </p>
          </div>

          <div className="flex justify-end gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px]"
              onClick={() => setOnOpen(0)}
              disabled={isPendingMut}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 text-[10px] gap-1.5 bg-red-600 hover:bg-red-700"
              onClick={() => statusMut.mutateAsync(2)}
              disabled={isPendingMut}
            >
              {isPendingMut ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              Reject
            </Button>
          </div>
        </div>
      </Modal>

      {/* Approve modal */}
      <Modal
        title={undefined}
        onOpen={onOpen === 2}
        className=""
        footer={1}
        setOnOpen={() => {
          if (isPendingMut) return;
          setOnOpen(0);
        }}
      >
        <div className="p-3 space-y-3">
          <div className="flex items-start gap-2 pb-2 border-b">
            <div className="p-1.5 bg-blue-100 rounded-md">
              <CheckCircle className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900">
                Approve this request?
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                The applicant will gain access to the receiving room.
              </p>
            </div>
          </div>

          <div className="border rounded-md bg-blue-50/50 p-2 space-y-1.5">
            <Row
              label="Applicant"
              value={`${data.user?.firstName ?? ""} ${data.user?.lastName ?? ""}`.trim()}
            />
            <Row label="Address" value={data.address ?? "—"} />
            <Row
              label="Request"
              value={
                <span className="font-mono">{data.id.slice(0, 12)}…</span>
              }
            />
          </div>

          <div className="flex justify-end gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px]"
              onClick={() => setOnOpen(0)}
              disabled={isPendingMut}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-7 text-[10px] gap-1.5 bg-blue-600 hover:bg-blue-700"
              onClick={() => statusMut.mutateAsync(1)}
              disabled={isPendingMut}
            >
              {isPendingMut ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle className="h-3 w-3" />
              )}
              Approve
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const Field = ({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) => (
  <div>
    <p className="text-[10px] text-gray-500 uppercase tracking-wide flex items-center gap-1">
      {icon}
      {label}
    </p>
    <p className="text-xs text-gray-800 mt-0.5 break-words">{value ?? "—"}</p>
  </div>
);

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-2 text-[10px]">
    <span className="text-gray-500 uppercase tracking-wide">{label}</span>
    <span className="text-gray-800 text-right truncate max-w-[60%]">
      {value ?? "—"}
    </span>
  </div>
);

export default RequestDetail;
