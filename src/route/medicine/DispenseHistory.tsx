import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";

import { useAuth } from "@/provider/ProtectedRoute";
import { dispenseHistory, type DispenseHistoryRow } from "@/db/statements/medicine";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Search,
  HandHeart,
  User,
  Clock,
  ChevronRight,
  FileText,
  Pill,
} from "lucide-react";

const fmt = (d: string) =>
  new Date(d).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const DispenseHistory = () => {
  const { lineId } = useParams();
  const auth = useAuth();
  const nav = useNavigate();
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 400);

  const { data, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: ["dispense-history", lineId, query],
      queryFn: ({ pageParam }) =>
        dispenseHistory(
          auth.token as string,
          lineId as string,
          pageParam as string | null,
          "20",
          query,
          "",
        ),
      initialPageParam: null as string | null,
      getNextPageParam: (last) => (last.hasMore ? last.lastCursor : undefined),
      enabled: !!auth.token && !!lineId,
      refetchOnWindowFocus: false,
    });

  const { ref } = useInView({
    threshold: 0.5,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
  });

  const rows: DispenseHistoryRow[] = useMemo(
    () => data?.pages.flatMap((p) => p.list) ?? [],
    [data],
  );
  const loading = isFetching && rows.length === 0;

  return (
    <div className="w-full h-full flex flex-col">
      {/* Search */}
      <div className="mb-3">
        <InputGroup className="bg-white">
          <InputGroupAddon>
            <Search className="h-3.5 w-3.5 text-gray-400" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search by patient, medicine, Rx ref, or dispenser…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-9 text-sm"
          />
        </InputGroup>
      </div>

      <div className="flex-1 overflow-auto space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
            <Spinner className="w-5 h-5" />
            <span className="text-sm">Loading dispense history…</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <HandHeart className="h-7 w-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-700">
              No dispenses yet
            </p>
            <p className="text-xs text-gray-500 mt-0.5 max-w-xs">
              {query
                ? `No dispense matches “${query}”.`
                : "Direct and prescription dispenses will appear here."}
            </p>
          </div>
        ) : (
          <>
            {rows.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => nav(`/${lineId}/medicine/dispense/${r.id}`)}
                className="w-full border rounded-lg bg-white px-3 py-2.5 flex items-center gap-3 hover:border-blue-300 hover:bg-blue-50/30 transition text-left"
              >
                <div
                  className={`p-2 rounded-lg flex-shrink-0 ${
                    r.kind === 1 ? "bg-violet-50" : "bg-blue-50"
                  }`}
                >
                  {r.kind === 1 ? (
                    <FileText className="h-4 w-4 text-violet-600" />
                  ) : (
                    <Pill className="h-4 w-4 text-blue-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-gray-900">
                      {r.patientName || "Walk-in / unnamed"}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1.5 py-0 ${
                        r.kind === 1
                          ? "bg-violet-50 text-violet-700 border-violet-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {r.kind === 1 ? "Prescription" : "Direct"}
                    </Badge>
                    {r.external && (
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200"
                      >
                        External{r.externalSource ? ` · ${r.externalSource}` : ""}
                      </Badge>
                    )}
                    {r.refNumber && (
                      <span className="text-[10px] text-gray-400 font-mono">
                        #{r.refNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 truncate mt-0.5">
                    {r.preview}
                    {r.itemCount > 3 ? ` +${r.itemCount - 3} more` : ""}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                    <span className="flex items-center gap-0.5">
                      <User className="h-2.5 w-2.5" />
                      {r.dispenserName || r.dispenserUsername || "—"}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {fmt(r.timestamp)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {r.totalUnits} unit{r.totalUnits !== 1 ? "s" : ""}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              </button>
            ))}

            {hasNextPage && (
              <div ref={ref} className="py-3 flex justify-center">
                {isFetchingNextPage && <Spinner className="w-4 h-4" />}
              </div>
            )}
            {!hasNextPage && rows.length > 0 && (
              <p className="text-center text-[10px] text-gray-400 py-3">
                {rows.length} dispense{rows.length !== 1 ? "s" : ""} shown
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DispenseHistory;
