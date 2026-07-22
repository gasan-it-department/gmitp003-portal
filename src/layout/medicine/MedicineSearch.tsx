import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";

import {
  searchMedicineStock,
  type MedicineSearchHit,
} from "@/db/statements/medicine";
import { formatPureDate } from "@/utils/date";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  Pill,
  Package,
  CalendarClock,
  ShieldCheck,
  Eye,
  Loader2,
  ArrowRight,
} from "lucide-react";

interface Props {
  token: string;
  lineId: string;
  /** Close the surrounding modal (before navigating to a storage). */
  onClose: () => void;
}

/**
 * Pharmacy Home search (Ctrl+K): every medicine-module user can find a
 * medicine and see WHERE its stock sits — per-storage on-hand, batches and
 * nearest expiry. Each storage row carries the caller's access state:
 * "Dispense & Stock" (they may edit there) or "View only" (they may look,
 * never touch — the server enforces this on every write regardless).
 */
const MedicineSearch = ({ token, lineId, onClose }: Props) => {
  const nav = useNavigate();
  const { lineId: paramLineId } = useParams();
  const activeLineId = paramLineId ?? lineId;
  const [text, setText] = useState("");
  const [query] = useDebounce(text.trim(), 400);

  const { data, isFetching } = useQuery({
    queryKey: ["medicine-search-stock", lineId, query],
    queryFn: () => searchMedicineStock(token, lineId, query),
    enabled: query.length >= 2,
    refetchOnWindowFocus: false,
  });
  const hits: MedicineSearchHit[] = query.length >= 2 ? (data?.list ?? []) : [];

  const openStorage = (storageId: string) => {
    onClose();
    nav(`/${activeLineId}/medicine/storage/${storageId}`);
  };

  return (
    <div className="space-y-3">
      <InputGroup className="bg-white">
        <InputGroupAddon>
          {isFetching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
          ) : (
            <Search className="h-3.5 w-3.5 text-gray-400" />
          )}
        </InputGroupAddon>
        <InputGroupInput
          autoFocus
          placeholder="Search by medicine name, serial, or barcode..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="h-9 text-sm"
        />
      </InputGroup>

      {query.length < 2 ? (
        <p className="text-[11px] text-gray-400 text-center py-6">
          Type at least 2 characters — you can see every medicine's stock and
          storages; editing needs Dispense &amp; Stock Access on the storage.
        </p>
      ) : hits.length === 0 && !isFetching ? (
        <p className="text-[11px] text-gray-400 text-center py-6">
          No medicine matches “{query}”.
        </p>
      ) : (
        <div className="max-h-[55vh] overflow-auto space-y-2 pr-0.5">
          {hits.map((m) => (
            <div key={m.id} className="border rounded-lg bg-white overflow-hidden">
              {/* medicine header */}
              <div className="px-3 py-2 bg-gray-50 border-b flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1 bg-blue-600 rounded flex-shrink-0">
                    <Pill className="h-3 w-3 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">
                      {m.name}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">
                      #{m.serialNumber}
                      {m.barcode ? ` · ${m.barcode}` : ""}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${
                    m.totalOnHand > 0
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}
                >
                  {m.totalOnHand} on hand
                </Badge>
              </div>

              {/* per-storage rows */}
              {m.storages.length === 0 ? (
                <p className="px-3 py-2 text-[10px] text-gray-400">
                  No stock in any storage.
                </p>
              ) : (
                <div className="divide-y">
                  {m.storages.map((s) => (
                    <div
                      key={s.id}
                      className="px-3 py-1.5 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Package className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium text-gray-800 truncate">
                            {s.name ?? s.refNumber ?? "Storage"}
                            {s.refNumber && s.name ? (
                              <span className="text-gray-400 font-normal">
                                {" "}
                                · {s.refNumber}
                              </span>
                            ) : null}
                          </p>
                          <p className="text-[10px] text-gray-500 flex items-center gap-1">
                            {s.onHand} on hand · {s.batches} batch
                            {s.batches !== 1 ? "es" : ""}
                            {s.nearestExpiration && (
                              <span className="inline-flex items-center gap-0.5">
                                <CalendarClock className="h-2.5 w-2.5" />
                                exp {formatPureDate(s.nearestExpiration)}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {s.accessible ? (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1 py-0 gap-0.5 bg-emerald-50 text-emerald-700 border-emerald-200"
                            title="You hold Dispense & Stock Access here"
                          >
                            <ShieldCheck className="h-2.5 w-2.5" />
                            Dispense &amp; Stock
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1 py-0 gap-0.5 bg-gray-50 text-gray-500 border-gray-200"
                            title="You can view this storage but not dispense, stock, or restock — ask an admin for Dispense & Stock Access"
                          >
                            <Eye className="h-2.5 w-2.5" />
                            View only
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-1.5 text-[10px] gap-1"
                          onClick={() => openStorage(s.id)}
                        >
                          Open
                          <ArrowRight className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicineSearch;
