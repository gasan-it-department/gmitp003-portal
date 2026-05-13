import { useParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
import { formatDate } from "@/utils/date";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Package,
  User,
  Building,
  Calendar,
  Box,
  Hash,
  ClipboardList,
} from "lucide-react";
//statements
import { supplyDispenseTransactionInfo } from "@/db/statements/supply";
//
import { Button } from "@/components/ui/button";
import UpdateTransaction from "./UpdateTransaction";
//interface/schema/types
import type { SupplyDispenseRecordProps } from "@/interface/data";

const DispenseRecordData = () => {
  const { transactionId, lineId } = useParams();
  const auth = useAuth();
  const { token, userId } = auth;
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<SupplyDispenseRecordProps>({
    queryKey: ["supply-dispense-transaction-info", transactionId],
    queryFn: () =>
      supplyDispenseTransactionInfo(token as string, transactionId as string),
    enabled: !!transactionId && !!token,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  console.log({ data });

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm text-gray-500">Loading dispense record...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="border rounded-lg p-6 max-w-md w-full text-center bg-white">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center">
            <Package className="h-7 w-7 text-red-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            Error Loading Transaction
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Unable to load the dispense record details.
          </p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            size="sm"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-4 space-y-4">
        {/* Header - Compact */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                Dispense Record
              </h1>
              <p className="text-xs text-gray-500 font-mono">
                ID: {data.id.slice(0, 8)}...
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs px-3 py-1">
              {data.quantity} units dispensed
            </Badge>
            {data.desc && data.desc.startsWith("ADJ:") ? (
              <Badge
                variant="secondary"
                className="text-[10px] px-2 py-1 bg-amber-50 text-amber-700 border-amber-200"
              >
                Adjustment record · read-only
              </Badge>
            ) : (
              <UpdateTransaction
                item={data}
                userId={userId as string}
                token={token as string}
                lineId={lineId as string}
                onSuccess={() => {
                  queryClient.invalidateQueries({
                    queryKey: [
                      "supply-dispense-transaction-info",
                      transactionId,
                    ],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["supply-dispense-transaction"],
                  });
                }}
              />
            )}
          </div>
        </div>

        <Separator className="my-2" />

        {/* Main Content - Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Supply Details - Compact Card */}
            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-800">
                    Supply Details
                  </h3>
                </div>
              </div>
              <div className="p-4">
                {data.supplyItem && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Item Name</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">
                        {data.supplyItem?.item || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Reference Code</p>
                      <p className="text-sm font-mono text-gray-800 mt-0.5">
                        {data.supplyItem?.code || "N/A"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Transaction Information - Compact Card */}
            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-800">
                    Transaction Information
                  </h3>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Quantity Dispensed</p>
                    <p className="text-xl font-bold text-gray-900 mt-0.5">
                      {data.quantity}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Stock Track ID</p>
                    <code className="text-xs font-mono text-gray-700 break-all">
                      {data.supplyStockTrackId?.slice(0, 12)}...
                    </code>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Reference Code</p>
                    <code className="text-sm font-mono text-gray-900 break-all">
                      {data.refCode || "N/A"}
                    </code>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Remarks</p>
                  <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-2 rounded">
                    {data.remarks || "No remarks provided"}
                  </p>
                </div>
              </div>
            </div>

            {/* Batch & Container - Compact Card (if data exists) */}
            {(data.list || data.container) && (
              <div className="border rounded-lg bg-white overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 border-b">
                  <div className="flex items-center gap-2">
                    <Box className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-800">
                      Batch & Container
                    </h3>
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    {data.list && (
                      <div>
                        <p className="text-xs text-gray-500">Batch</p>
                        <p className="text-sm text-gray-900 mt-0.5">N/A</p>
                      </div>
                    )}
                    {data.container && (
                      <div>
                        <p className="text-xs text-gray-500">Container</p>
                        <p className="text-sm text-gray-900 mt-0.5">N/A</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - People & Metadata */}
          <div className="space-y-4">
            {/* People Involved - Compact Card */}
            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-800">
                    People Involved
                  </h3>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {data.user && (
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {data.user.firstName} {data.user.lastName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {data.user.email}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Requested By
                      </p>
                    </div>
                  </div>
                )}
                {data.dispensary && (
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {data.dispensary.firstName} {data.dispensary.lastName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {data.dispensary.email}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Dispensed By
                      </p>
                    </div>
                  </div>
                )}
                {data.unit && (
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
                    <Building className="h-3.5 w-3.5 text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {data.unit.name}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Department
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Transaction Metadata - Compact Card */}
            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-800">
                    Transaction Metadata
                  </h3>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Transaction Date</p>
                  <p className="text-sm text-gray-900 mt-0.5">
                    {formatDate(data.timestamp)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Transaction ID</p>
                  <code className="text-xs font-mono text-gray-700 break-all bg-gray-50 p-1.5 rounded block mt-1">
                    {data.id}
                  </code>
                </div>
              </div>
            </div>

            {/* Stock Information - Compact Card (if data.supply exists) */}
            {data.supply && (
              <div className="border rounded-lg bg-white overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 border-b">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-800">
                      Stock Information
                    </h3>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Current Stock</p>
                    <p className="text-lg font-bold text-gray-900 mt-0.5">
                      {data.supply.stock || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <Badge
                      variant={
                        data.supply.stock && data.supply.stock > 0
                          ? "default"
                          : "destructive"
                      }
                      className="text-xs mt-1"
                    >
                      {data.supply.stock && data.supply.stock > 0
                        ? "In Stock"
                        : "Out of Stock"}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DispenseRecordData;
