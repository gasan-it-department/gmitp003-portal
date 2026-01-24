import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
import { useParams } from "react-router";
import moment from "moment";
import { prescriptionProgressStatus, prescriptionStatus } from "@/utils/helper";
import { formatDate } from "@/utils/date";
//
import { prescribedData } from "@/db/statement";
//
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
//
import {
  User,
  MapPin,
  Calendar,
  FileText,
  Pill,
  MessageSquare,
  ArrowLeft,
  Download,
  Share2,
  Clock,
  Stethoscope,
  AlertCircle,
  Package,
  File,
  CheckCircle,
  History,
  ChevronRight,
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
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-100 rounded-full mx-auto">
              <div className="absolute inset-0 flex items-center justify-center">
                <Pill className="w-8 h-8 text-blue-300 animate-pulse" />
              </div>
            </div>
            <Spinner className="w-24 h-24 mx-auto text-blue-600" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-800">
              Loading Prescription
            </p>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Fetching detailed prescription information...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="p-4 bg-red-50 rounded-full inline-flex mb-4">
              <AlertCircle className="w-12 h-12 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Prescription Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The prescription data could not be loaded or doesn't exist in our
              records.
            </p>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Previous Page
              </Button>
              <Button
                variant="ghost"
                className="w-full text-sm"
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

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-gray-50 to-white">
      <ScrollArea className="h-full">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full h-10 w-10 p-0"
                  onClick={() => window.history.back()}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Prescription Details
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant={statusInfo.variant}
                      className="text-xs px-3 py-1"
                    >
                      {prescriptionStatus[data.status]}
                    </Badge>
                    <Badge
                      variant={remarkInfo.variant}
                      className="text-xs px-3 py-1"
                    >
                      {remarkInfo.label}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <FileText className="w-3 h-3" />
                      <code className="font-mono">Ref: {data.refNumber}</code>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Patient
                      </p>
                      <p className="text-lg font-semibold text-gray-800 truncate">
                        {fullName}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Date Created
                      </p>
                      <p className="text-lg font-semibold text-gray-800">
                        {moment(data.timestamp).format("MMM D, YYYY")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-gradient-to-r from-purple-50 to-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Pill className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Medicines
                      </p>
                      <p className="text-lg font-semibold text-gray-800">
                        {data.presMed?.length || 0} prescribed
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Patient Information Card */}
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white">
                      Patient Information
                    </h2>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                          Personal Details
                        </label>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-500">Full Name</p>
                            <p className="text-lg font-semibold text-gray-800">
                              {fullName}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                          Location Details
                        </label>
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-gray-500">
                                Complete Address
                              </p>
                              <p className="text-gray-800 leading-relaxed">
                                {fullAddress || "No address provided"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {data.barangay?.name || "N/A"}
                            </Badge>
                            <ChevronRight className="w-3 h-3 text-gray-400" />
                            <Badge variant="outline" className="text-xs">
                              {data.municipal?.name || "N/A"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {data.condtion && (
                    <div className="mt-6 pt-6 border-t">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <label className="text-sm font-semibold text-gray-700">
                          Medical Condition
                        </label>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 border">
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {data.condtion}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Prescribed Medicines Card */}
              {data.presMed && data.presMed.length > 0 && (
                <Card className="border-0 shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                          <Pill className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-white">
                          Prescribed Medicines
                        </h2>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-white/20 text-white border-0"
                      >
                        {data.presMed.length} items
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {data.presMed.map((medicine, index) => (
                        <div
                          key={medicine.id}
                          className="border border-gray-200 rounded-xl p-4 hover:border-green-200 hover:bg-green-50/30 transition-all duration-200"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <Package className="w-4 h-4 text-green-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 text-lg">
                                  {medicine.medicine?.name ||
                                    "Unknown Medicine"}
                                </h3>
                                {medicine.medicine?.desc && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    {medicine.medicine.desc}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge
                                variant="outline"
                                className="bg-blue-50 border-blue-200 text-blue-700"
                              >
                                Qty: {medicine.quantity}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className="bg-gray-100"
                              >
                                #{index + 1}
                              </Badge>
                            </div>
                          </div>

                          {medicine.remark && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex items-start gap-2">
                                <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-1">
                                    Dosage Instructions
                                  </p>
                                  <p className="text-sm text-gray-600 bg-gray-50 rounded p-3">
                                    {medicine.remark}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Comments Section */}
              {data.comment && data.comment.length > 0 && (
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <MessageSquare className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Comments & Notes
                        </CardTitle>
                        <CardDescription>
                          {data.comment.length} comment
                          {data.comment.length !== 1 ? "s" : ""} from staff
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {data.comment.map((comment) => (
                        <div
                          key={comment.id}
                          className="border-l-4 border-purple-500 pl-4 py-3 bg-gradient-to-r from-white to-purple-50/30 rounded-r-lg"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-purple-100 text-purple-700">
                                  {getInitials(
                                    `${comment.User.firstName} ${comment.User.lastName}`
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {comment.User.firstName}{" "}
                                  {comment.User.lastName}
                                </p>
                                {comment.User.Position && (
                                  <p className="text-xs text-gray-500">
                                    {comment.User.Position.name}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {moment(comment.timestamp).fromNow()}
                            </span>
                          </div>
                          <p className="text-gray-700 bg-white p-3 rounded-lg border">
                            {comment.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Timeline Card */}
              <Card className="border-0 shadow-lg sticky top-6">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <History className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        Prescription Timeline
                      </CardTitle>
                      <CardDescription>
                        Progress history and updates
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Timeline */}
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                      {data.progress &&
                        data.progress.map((progress, index) => (
                          <div
                            key={progress.id}
                            className="relative mb-6 last:mb-0"
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                                  progress.step >= data.status
                                    ? "bg-green-100 border-2 border-green-500"
                                    : "bg-gray-100 border-2 border-gray-300"
                                }`}
                              >
                                {progress.step >= data.status ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="font-medium text-gray-900">
                                    {prescriptionProgressStatus[progress.step]
                                      ?.desc || `Step ${progress.step}`}
                                  </p>
                                  <span className="text-xs text-gray-500">
                                    {moment(progress.timestamp).format(
                                      "h:mm A"
                                    )}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                  {formatDate(progress.timestamp)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>

                    <Separator />

                    {/* Staff Information */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-gray-400" />
                        <label className="text-sm font-medium text-gray-700">
                          Responsible Staff
                        </label>
                      </div>

                      {data.processBy && (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-blue-100 text-blue-700">
                              {getInitials(
                                `${data.processBy.firstName} ${data.processBy.lastName}`
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">
                              {data.processBy.firstName}{" "}
                              {data.processBy.lastName}
                            </p>
                            {data.processBy.Position && (
                              <p className="text-xs text-gray-600">
                                {data.processBy.Position.name}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              Processed By
                            </p>
                          </div>
                        </div>
                      )}

                      {data.respondedBy && (
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-green-100 text-green-700">
                              {getInitials(
                                `${data.respondedBy.firstName} ${data.respondedBy.lastName}`
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">
                              {data.respondedBy.firstName}{" "}
                              {data.respondedBy.lastName}
                            </p>
                            {data.respondedBy.Position && (
                              <p className="text-xs text-gray-600">
                                {data.respondedBy.Position.name}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              Responded By
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Attached Files */}
              {data.assets && data.assets.length > 0 && (
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <File className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Attached Files
                        </CardTitle>
                        <CardDescription>
                          {data.assets.length} file
                          {data.assets.length !== 1 ? "s" : ""}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {data.assets.map((asset) => (
                        <div
                          key={asset.id}
                          className="flex items-center gap-3 p-3 border rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-colors cursor-pointer group"
                        >
                          <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-100">
                            <FileText className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {asset.file_url}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {asset.file_url}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Download className="w-3 h-3" />
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
