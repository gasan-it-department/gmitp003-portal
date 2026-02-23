import React, { useState } from "react";
import { useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
//stmt
import {
  documentRoomRequestDetails,
  upadateRequestStatus,
} from "@/db/statements/document";

//
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Modal from "@/components/custom/Modal";
//
//interface
import type { RoomRegistration } from "@/interface/data";
//icons
import {
  User,
  MapPin,
  Calendar,
  Users,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

const RequestDetail = () => {
  const [onOpen, setOnOpen] = useState(0);
  const { requestId, lineId } = useParams();
  const auth = useAuth();
  const queryClient = useQueryClient();

  const { data, isFetching } = useQuery<RoomRegistration>({
    queryKey: ["request-details", requestId],
    queryFn: () =>
      documentRoomRequestDetails(auth.token as string, requestId as string),
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    enabled: !!requestId || !!requestId,
  });

  const updateRequestRoomStatus = useMutation({
    mutationFn: (status: number) =>
      upadateRequestStatus(
        auth.token as string,
        requestId as string,
        lineId as string,
        auth.userId as string,
        status,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["request-details", requestId],
      });
    },
    onError: () => {
      toast.error("TRANSACTION FAILED");
    },
  });

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 1:
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 2:
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isFetching) {
    return (
      <div className="w-full h-full p-4 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-gray-500">Request not found</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4 md:p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        {/* Header */}
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/50 p-4 rounded-lg border border-blue-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-blue-600 rounded-full inline-block"></span>
              Room Request Details
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              ID: {data.id.substring(0, 8)}...
            </p>
          </div>

          {/* Status Badge and Action Buttons */}
          <div className="flex items-center gap-3">
            {getStatusBadge(data.status)}

            {/* Action Buttons - Only show for pending requests */}
            {data.status === 2 && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setOnOpen(1)}
                  size="sm"
                  variant="outline"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                >
                  <XCircle className="w-4 h-4 mr-1.5" />
                  Reject
                </Button>
                <Button
                  onClick={() => setOnOpen(2)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200"
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  Approve
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* User Info Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4" />
              Applicant Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {data.user?.firstName?.[0]}
                  {data.user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="font-medium">
                  {data.user?.firstName} {data.user?.lastName}
                </p>
                <p className="text-sm text-gray-500">@{data.user?.username}</p>
                {data.user?.email && (
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {data.user.email}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Request Details Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Request Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Address</p>
                <p className="text-sm font-medium">{data.address}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Line</p>
                <p className="text-sm font-medium">
                  {data.line?.name || data.lineId}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Submitted</p>
                <p className="text-sm font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(data.timestamp)}
                </p>
              </div>
              {data.dateApproved && (
                <div>
                  <p className="text-xs text-gray-500">Approved Date</p>
                  <p className="text-sm font-medium">
                    {formatDate(data.dateApproved)}
                  </p>
                </div>
              )}
              {data.dateRejected && (
                <div>
                  <p className="text-xs text-gray-500">Rejected Date</p>
                  <p className="text-sm font-medium">
                    {formatDate(data.dateRejected)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {data.roomRegistrationSignatures?.file_url && (
          <div
            className="border rounded-lg p-2 bg-gray-50 relative overflow-hidden"
            onContextMenu={(e) => {
              e.preventDefault();
              return false;
            }}
          >
            {/* Semi-transparent watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="rotate-45 text-gray-400/30 text-4xl font-bold whitespace-nowrap">
                SIGNATURE • CONFIDENTIAL • SIGNATURE
              </div>
            </div>

            {/* Diagonal repeating watermark */}
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                backgroundImage: `repeating-linear-gradient(
          45deg,
          rgba(150,150,150,0.1) 0px,
          rgba(150,150,150,0.1) 20px,
          rgba(200,200,200,0.1) 20px,
          rgba(200,200,200,0.1) 40px
        )`,
              }}
            />

            <img
              src={data.roomRegistrationSignatures.file_url}
              alt="Signature"
              className="max-h-48 w-auto object-contain mx-auto relative z-0"
            />

            <p className="text-[8px] text-gray-400 text-center mt-1">
              CONFIDENTIAL - Not for reproduction
            </p>
          </div>
        )}

        {/* Receivers Card */}
        {data.receivers && data.receivers.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Receivers ({data.receivers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.receivers.map((receiver, index) => (
                  <React.Fragment key={receiver.id}>
                    {index > 0 && <Separator />}
                    <div className="flex items-start gap-3 py-1">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                          {receiver.user?.firstName?.[0]}
                          {receiver.user?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {receiver.user?.lastName}, {receiver.user?.firstName}
                        </p>
                        <p className="text-xs text-gray-500">
                          @{receiver.user?.username}
                        </p>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Receivers Fallback */}
        {(!data.receivers || data.receivers.length === 0) && (
          <Card>
            <CardContent className="py-6">
              <p className="text-sm text-gray-500 text-center">
                No receivers assigned
              </p>
            </CardContent>
          </Card>
        )}

        {/* Conversations Section - if needed */}
        {data.roomRegistrationConversations &&
          data.roomRegistrationConversations.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Conversations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  {data.roomRegistrationConversations.length} conversation(s)
                </p>
              </CardContent>
            </Card>
          )}
      </div>
      <Modal
        title={"Confirm Reject"}
        children={undefined}
        onOpen={onOpen === 1}
        className={""}
        setOnOpen={() => {
          if (!updateRequestRoomStatus.isPending) return;
          setOnOpen(0);
        }}
      />

      {/* Reject Modal */}
      <Modal
        className=""
        footer={1}
        title="Confirm Rejection"
        onOpen={onOpen === 1}
        setOnOpen={() => {
          if (!updateRequestRoomStatus.isPending) {
            setOnOpen(0);
          }
        }}
      >
        <div className="space-y-6">
          {/* Icon and Warning */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-3 bg-red-100 rounded-full">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Reject Room Request
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to reject this room request?
              </p>
            </div>
          </div>

          {/* Request Info Summary */}
          <div className="bg-red-50/50 border border-red-100 rounded-lg p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Request ID:</span>
                <span className="font-mono font-medium">
                  {data.id.substring(0, 12)}...
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Applicant:</span>
                <span className="font-medium">
                  {data.user?.firstName} {data.user?.lastName}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Address:</span>
                <span className="font-medium truncate max-w-[200px]">
                  {data.address}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOnOpen(0)}
              disabled={updateRequestRoomStatus.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={() => {
                updateRequestRoomStatus.mutateAsync(2);
                setOnOpen(0);
              }}
              disabled={updateRequestRoomStatus.isPending}
            >
              {updateRequestRoomStatus.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Confirm Reject
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        className=""
        footer={1}
        title="Confirm Approval"
        onOpen={onOpen === 2}
        setOnOpen={() => {
          if (!updateRequestRoomStatus.isPending) {
            setOnOpen(0);
          }
        }}
      >
        <div className="space-y-6">
          {/* Icon and Success Message - Now Blue */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Approve Room Request
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                You are about to approve this room request
              </p>
            </div>
          </div>

          {/* Request Info Summary - Enhanced Blue */}
          <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-blue-600 font-medium">Applicant</p>
                <p className="text-sm font-medium text-gray-900">
                  {data.user?.firstName} {data.user?.lastName}
                </p>
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium">Request ID</p>
                <p className="text-sm font-mono text-gray-900">
                  {data.id.substring(0, 8)}...
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-blue-600 font-medium">Address</p>
                <p className="text-sm font-medium text-gray-900">
                  {data.address}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons - Blue Theme */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              onClick={() => setOnOpen(0)}
              disabled={updateRequestRoomStatus.isPending}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200"
              onClick={() => {
                updateRequestRoomStatus.mutateAsync(1);
                setOnOpen(0);
              }}
              disabled={updateRequestRoomStatus.isPending}
            >
              {updateRequestRoomStatus.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Approval
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RequestDetail;
