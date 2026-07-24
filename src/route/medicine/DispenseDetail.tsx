import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/provider/ProtectedRoute";
import { dispenseDetail } from "@/db/statements/medicine";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  ArrowLeft,
  HandHeart,
  User,
  Clock,
  Pill,
  Package,
  FileText,
  StickyNote,
} from "lucide-react";

const fmt = (d: string) =>
  new Date(d).toLocaleString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const DispenseDetail = () => {
  const { dispenseId, lineId } = useParams();
  const auth = useAuth();
  const nav = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dispense-detail", dispenseId],
    queryFn: () => dispenseDetail(auth.token as string, dispenseId as string),
    enabled: !!auth.token && !!dispenseId,
    refetchOnWindowFocus: false,
  });
  const r = data?.record;

  return (
    <div className="w-full h-full flex flex-col bg-gray-50 overflow-auto">
      <div className="bg-white border-b px-4 py-3 flex items-center gap-2 sticky top-0 z-10">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => nav(`/${lineId}/medicine/logs?tab=dispenses`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 rounded-md">
            <HandHeart className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">
              Dispense details
            </h1>
            <p className="text-[11px] text-gray-500 leading-none mt-0.5">
              Full record of this dispensing action
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-2xl w-full mx-auto space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
            <Spinner className="w-5 h-5" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : isError || !r ? (
          <div className="text-center py-16">
            <p className="text-sm font-medium text-red-600">
              Could not load this dispense
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {(error as any)?.response?.data?.message ??
                "It may have been removed."}
            </p>
          </div>
        ) : (
          <>
            {/* Summary card */}
            <div className="border rounded-xl bg-white p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {r.patientName || "Walk-in / unnamed"}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${
                        r.kind === 1
                          ? "bg-violet-50 text-violet-700 border-violet-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {r.kind === 1 ? (
                        <FileText className="h-2.5 w-2.5 mr-1" />
                      ) : (
                        <Pill className="h-2.5 w-2.5 mr-1" />
                      )}
                      {r.kind === 1 ? "Prescription dispense" : "Direct dispense"}
                    </Badge>
                    {r.external && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200"
                      >
                        External{r.externalSource ? ` · ${r.externalSource}` : ""}
                      </Badge>
                    )}
                    {r.refNumber && (
                      <span className="text-[11px] text-gray-500 font-mono">
                        Rx #{r.refNumber}
                      </span>
                    )}
                  </div>
                </div>
                <Badge className="bg-blue-600 text-white">
                  {r.totalUnits} unit{r.totalUnits !== 1 ? "s" : ""}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-gray-400" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                      Dispensed by
                    </p>
                    <p className="text-xs font-medium text-gray-800">
                      {r.dispenserName || r.dispenserUsername || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                      When
                    </p>
                    <p className="text-xs font-medium text-gray-800">
                      {fmt(r.timestamp)}
                    </p>
                  </div>
                </div>
              </div>

              {r.note && (
                <div className="mt-3 pt-3 border-t flex items-start gap-2">
                  <StickyNote className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                      Note
                    </p>
                    <p className="text-xs text-gray-700">{r.note}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="border rounded-xl bg-white overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b">
                <p className="text-xs font-semibold text-gray-700">
                  Items dispensed · {r.items.length}
                </p>
              </div>
              <div className="divide-y">
                {r.items.map((it) => (
                  <div key={it.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="p-1.5 bg-blue-50 rounded-md flex-shrink-0">
                      <Pill className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {it.medicineName}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">
                        #{it.serialNumber ?? "—"}
                        {it.barcode ? ` · ${it.barcode}` : ""}
                      </p>
                      {(it.storageName || it.storageRef) && (
                        <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Package className="h-2.5 w-2.5" />
                          {it.storageName ?? it.storageRef}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[11px] px-2 py-0.5 flex-shrink-0">
                      {it.quantity}
                      {it.unit ? ` ${it.unit}` : ""}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DispenseDetail;
