import { useEffect } from "react";
//
import { useQuery } from "@tanstack/react-query";
import { prescriptionData } from "@/db/statement";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
//utils
import { prescriptionStatus } from "@/utils/helper";
import { formatDate } from "@/utils/date";

//icons
import { CircleAlert, User, MapPin, Calendar, FileText } from "lucide-react";
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
          <Spinner className="w-8 h-8 mx-auto mb-4" />
          <p className="text-gray-600">Loading prescription details...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center max-w-sm">
          <CircleAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="font-medium text-red-600 text-lg mb-2">
            Data Not Found
          </p>
          <p className="text-gray-600 text-sm">
            No prescription found with this ID.
            <br />
            Please check your network connection or the prescription may have
            been deleted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full space-y-6 overflow-auto">
      {/* Header Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Prescription Details
          </h1>
          {/* <Badge
            variant={data.status === 2 ? "default" : "secondary"}
            className={
              data.status === 2
                ? "bg-green-100 text-green-800"
                : "bg-blue-100 text-blue-800"
            }
          >
            {statusInfo}
          </Badge> */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <FileText className="w-4 h-4" />
            <span>
              Ref. #:{" "}
              <strong className="text-gray-900">{data.refNumber}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>
              Date:{" "}
              <strong className="text-gray-900">
                {formatDate(data.timestamp)}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 md:col-span-2">
            <User className="w-4 h-4" />
            <span>
              Prescribed by:{" "}
              <strong className="text-gray-900">
                {data.processBy.lastName}, {data.processBy.firstName}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Client Information Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
          <User className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Client Information
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-500">
              Full Name
            </label>
            <p className="text-gray-900 font-medium">
              {data.lastname}, {data.firstname}
            </p>
          </div>

          {/* <div className="space-y-1">
            <label className="text-sm font-medium text-gray-500">Age</label>
            <p className="text-gray-900">{data.a}</p>
          </div> */}

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-500">
              Barangay
            </label>
            <p className="text-gray-900">{data.barangay.name}</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-500">
              Municipal
            </label>
            <p className="text-gray-900">{data.municipal.name}</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-500">
              Province
            </label>
            <p className="text-gray-900">{data.province.name}</p>
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium text-gray-500">
              Medical Condition
            </label>
            <p className="text-gray-900">{data.condtion || "Not specified"}</p>
          </div>
        </div>
      </div>

      {/* Address Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-blue-900 mb-1">Complete Address</p>
            <p className="text-blue-800 text-sm">
              {data.barangay.name}, {data.municipal.name}, {data.province.name}
            </p>
          </div>
        </div>
      </div>

      {/* Status Alert */}
      {data.status === 2 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CircleAlert className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-900">
                Prescription Completed
              </p>
              <p className="text-green-800 text-sm mt-1">
                This prescription has been fully processed and dispensed.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DispensaryPrescription;
