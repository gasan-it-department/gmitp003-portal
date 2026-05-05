//import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
import { useParams } from "react-router";
import moment from "moment";
import { prescriptionProgressStatus, prescriptionStatus } from "@/utils/helper";
import { formatDate } from "@/utils/date";
//
import { prescribedData } from "@/db/statement";
//
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

//
import {
  User,
  Calendar,
  FileText,
  Pill,
  MessageSquare,
  ArrowLeft,
  Download,
  Stethoscope,
  AlertCircle,
  Package,
  File,
  CheckCircle,
  History,
} from "lucide-react";
//
import type { Prescription } from "@/interface/data";

const PrescribedData = () => {
  const { prescribedDataId } = useParams();
  const auth = useAuth();

  const { data, isFetching } = useQuery<Prescription>({
    queryFn: () =>
      prescribedData(auth.token as string, prescribedDataId as string),
    queryKey: ["prescribedData", prescribedDataId],
    enabled: !!auth.token && !!prescribedDataId,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const getStatusBadge = (status: number) => {
    const statusMap = {
      0: { label: "Pending", variant: "secondary" as const },
      1: { label: "Processing", variant: "outline" as const },
      2: { label: "Completed", variant: "default" as const },
      3: { label: "Cancelled", variant: "destructive" as const },
    };
    return statusMap[status as keyof typeof statusMap] || statusMap[0];
  };

  const getRemarkBadge = (remark: number) => {
    const remarkMap = {
      0: { label: "Normal", variant: "outline" as const },
      1: { label: "Urgent", variant: "destructive" as const },
      2: { label: "Follow-up", variant: "secondary" as const },
    };
    return remarkMap[remark as keyof typeof remarkMap] || remarkMap[0];
  };

  if (isFetching) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-3">
          <div className="relative">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mx-auto" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700">
              Loading Prescription
            </p>
            <p className="text-xs text-gray-400">Fetching details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="max-w-md border shadow-sm">
          <CardContent className="p-6 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-base font-semibold text-gray-800 mb-1">
              Prescription Not Found
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              The prescription data could not be loaded.
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                Back
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusBadge(data.status);
  const remarkInfo = getRemarkBadge(data.remark);
  const fullName =
    `${data.firstname || ""} ${data.lastname || ""}`.trim() ||
    "Unknown Patient";
  const fullAddress = [
    data.street,
    data.barangay?.name,
    data.municipal?.name,
    data.province?.name,
  ]
    .filter(Boolean)
    .join(", ");

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100">
      <ScrollArea className="h-full">
        <div className="max-w-7xl mx-auto p-4">
          {/* Header Section - Compact */}
          <div className="mb-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-gray-900">
                    Prescription Details
                  </h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge
                      variant={statusInfo.variant}
                      className="text-[10px] px-2 py-0"
                    >
                      {prescriptionStatus[data.status]}
                    </Badge>
                    <Badge
                      variant={remarkInfo.variant}
                      className="text-[10px] px-2 py-0"
                    >
                      {remarkInfo.label}
                    </Badge>
                    <code className="text-[10px] text-gray-500 font-mono">
                      Ref: {data.refNumber}
                    </code>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats - Compact */}
            <div className="grid grid-cols-3 gap-2">
              <Card className="border shadow-sm">
                <CardContent className="p-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-blue-50 rounded-md">
                      <User className="h-3 w-3 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">Patient</p>
                      <p className="text-xs font-medium text-gray-800 truncate max-w-[80px]">
                        {fullName}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardContent className="p-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-green-50 rounded-md">
                      <Calendar className="h-3 w-3 text-green-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">Created</p>
                      <p className="text-xs font-medium text-gray-800">
                        {moment(data.timestamp).format("MMM D")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardContent className="p-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-purple-50 rounded-md">
                      <Pill className="h-3 w-3 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">Medicines</p>
                      <p className="text-xs font-medium text-gray-800">
                        {data.presMed?.length || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content - Compact Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-4">
              {/* Patient Info Card */}
              <Card className="border shadow-sm">
                <div className="px-4 py-2 border-b bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-blue-100 rounded-md">
                      <User className="h-3 w-3 text-blue-600" />
                    </div>
                    <h2 className="text-sm font-semibold text-gray-800">
                      Patient Information
                    </h2>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">
                        Full Name
                      </p>
                      <p className="text-sm font-medium text-gray-800 mt-0.5">
                        {fullName}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">
                        Address
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {fullAddress || "No address"}
                      </p>
                    </div>
                  </div>
                  {data.condtion && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-[10px] text-gray-500 uppercase">
                        Medical Condition
                      </p>
                      <p className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                        {data.condtion}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Prescribed Medicines */}
              {data.presMed && data.presMed.length > 0 && (
                <Card className="border shadow-sm">
                  <div className="px-4 py-2 border-b bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-green-100 rounded-md">
                          <Pill className="h-3 w-3 text-green-600" />
                        </div>
                        <h2 className="text-sm font-semibold text-gray-800">
                          Medicines
                        </h2>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {data.presMed.length} items
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-3 space-y-2">
                    {data.presMed.map((medicine) => (
                      <div key={medicine.id} className="border rounded-md p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Package className="h-3 w-3 text-gray-400" />
                            <h3 className="text-sm font-medium text-gray-800">
                              {medicine.medicine?.name || "Unknown"}
                            </h3>
                          </div>
                          <Badge variant="secondary" className="text-[10px]">
                            Qty: {medicine.quantity}
                          </Badge>
                        </div>
                        {medicine.remark && (
                          <div className="mt-2 pt-2 border-t">
                            <div className="flex items-start gap-1.5">
                              <MessageSquare className="h-3 w-3 text-gray-400 mt-0.5" />
                              <p className="text-xs text-gray-600">
                                {medicine.remark}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Comments */}
              {data.comment && data.comment.length > 0 && (
                <Card className="border shadow-sm">
                  <div className="px-4 py-2 border-b bg-gray-50">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-3 w-3 text-purple-600" />
                      <h2 className="text-sm font-semibold text-gray-800">
                        Comments
                      </h2>
                    </div>
                  </div>
                  <CardContent className="p-3 space-y-3">
                    {data.comment.map((comment) => (
                      <div
                        key={comment.id}
                        className="border-l-2 border-purple-400 pl-3"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-[10px] bg-purple-100">
                                {getInitials(
                                  `${comment.User.firstName} ${comment.User.lastName}`,
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <p className="text-xs font-medium text-gray-800">
                              {comment.User.firstName} {comment.User.lastName}
                            </p>
                          </div>
                          <span className="text-[10px] text-gray-400">
                            {moment(comment.timestamp).fromNow()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {comment.message}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-4">
              {/* Timeline Card */}
              <Card className="border shadow-sm">
                <div className="px-4 py-2 border-b bg-gray-50">
                  <div className="flex items-center gap-2">
                    <History className="h-3 w-3 text-amber-600" />
                    <h2 className="text-sm font-semibold text-gray-800">
                      Timeline
                    </h2>
                  </div>
                </div>
                <CardContent className="p-3">
                  <div className="space-y-3">
                    {data.progress?.map((progress) => (
                      <div key={progress.id} className="flex items-start gap-2">
                        <div className="mt-0.5">
                          {progress.step >= data.status ? (
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-gray-300 mt-1" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-800">
                            {prescriptionProgressStatus[progress.step]?.desc ||
                              `Step ${progress.step}`}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {formatDate(progress.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Staff Info */}
              <Card className="border shadow-sm">
                <div className="px-4 py-2 border-b bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-3 w-3 text-gray-600" />
                    <h2 className="text-sm font-semibold text-gray-800">
                      Staff
                    </h2>
                  </div>
                </div>
                <CardContent className="p-3 space-y-2">
                  {data.processBy && (
                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] bg-blue-100">
                          {getInitials(
                            `${data.processBy.firstName} ${data.processBy.lastName}`,
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-medium text-gray-800">
                          {data.processBy.firstName} {data.processBy.lastName}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          Processed By
                        </p>
                      </div>
                    </div>
                  )}
                  {data.respondedBy && (
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] bg-green-100">
                          {getInitials(
                            `${data.respondedBy.firstName} ${data.respondedBy.lastName}`,
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-medium text-gray-800">
                          {data.respondedBy.firstName}{" "}
                          {data.respondedBy.lastName}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          Responded By
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Attached Files */}
              {data.assets && data.assets.length > 0 && (
                <Card className="border shadow-sm">
                  <div className="px-4 py-2 border-b bg-gray-50">
                    <div className="flex items-center gap-2">
                      <File className="h-3 w-3 text-gray-600" />
                      <h2 className="text-sm font-semibold text-gray-800">
                        Files
                      </h2>
                    </div>
                  </div>
                  <CardContent className="p-2">
                    <div className="space-y-1">
                      {data.assets.map((asset) => (
                        <div
                          key={asset.id}
                          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-3 w-3 text-gray-400" />
                            <p className="text-xs text-gray-600 truncate max-w-[120px]">
                              {asset.file_url}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default PrescribedData;
