import { useEffect } from "react";
//
import { useQuery } from "@tanstack/react-query";
import { prescriptionData } from "@/db/statement";
import { Spinner } from "@/components/ui/spinner";
import { formatDate } from "@/utils/date";

//icons
import {
  CircleAlert,
  User,
  MapPin,
  Calendar,
  FileText,
  Pill,
  Stethoscope,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
//
import type { Prescription } from "@/interface/data";

interface Props {
  id: string | undefined;
  token: string | undefined;
  setStatus: React.Dispatch<React.SetStateAction<number>>;
}

const DispensaryPrescription = ({ id, token, setStatus }: Props) => {
  const { data, isFetching } = useQuery<Prescription>({
    queryKey: ["prescription", id],
    queryFn: () => prescriptionData(token, id),
  });

  useEffect(() => {
    if (data) {
      return setStatus(data.status);
    }
    setStatus(0);
  }, [data]);

  if (isFetching) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <Spinner className="h-8 w-8 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            Loading prescription details...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <CircleAlert className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            Data Not Found
          </h3>
          <p className="text-sm text-gray-500">
            No prescription found with this ID. Please check your connection.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header Section - Compact */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md">
            <Stethoscope className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-base font-semibold text-gray-900">
            Prescription Details
          </h2>
        </div>
        <Badge variant="outline" className="text-xs">
          {data.refNumber}
        </Badge>
      </div>

      {/* Info Grid - Compact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-gray-500">
          <FileText className="h-3.5 w-3.5" />
          <span className="text-xs">
            Ref:{" "}
            <span className="font-mono font-medium text-gray-700">
              {data.refNumber}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <Calendar className="h-3.5 w-3.5" />
          <span className="text-xs">
            Date:{" "}
            <span className="font-medium text-gray-700">
              {formatDate(data.timestamp)}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-gray-500 sm:col-span-2">
          <User className="h-3.5 w-3.5" />
          <span className="text-xs">
            Prescribed by:{" "}
            <span className="font-medium text-gray-700">
              {data.processBy.lastName}, {data.processBy.firstName}
            </span>
          </span>
        </div>
      </div>

      {/* Client Information Card - Compact */}
      <Card className="border shadow-sm">
        <CardHeader className="px-4 py-3 border-b bg-gray-50/50">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <User className="h-4 w-4 text-blue-500" />
            Client Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">
                Full Name
              </label>
              <p className="text-sm font-medium text-gray-900 mt-0.5">
                {data.lastname}, {data.firstname}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Barangay
              </label>
              <p className="text-sm text-gray-700 mt-0.5">
                {data.barangay.name}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Municipal
              </label>
              <p className="text-sm text-gray-700 mt-0.5">
                {data.municipal.name}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Province
              </label>
              <p className="text-sm text-gray-700 mt-0.5">
                {data.province.name}
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-500">
                Medical Condition
              </label>
              <p className="text-sm text-gray-700 mt-0.5">
                {data.condtion || "Not specified"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Summary - Compact */}
      <div className="flex items-start gap-2 p-3 rounded-md bg-blue-50 border border-blue-100">
        <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-medium text-blue-900">Complete Address</p>
          <p className="text-xs text-blue-700 mt-0.5">
            {data.barangay.name}, {data.municipal.name}, {data.province.name}
          </p>
        </div>
      </div>

      {/* Status Alert - Compact */}
      {data.status === 2 && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-green-50 border border-green-100">
          <Pill className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-green-900">
              Prescription Completed
            </p>
            <p className="text-xs text-green-700 mt-0.5">
              This prescription has been fully processed and dispensed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DispensaryPrescription;
