import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";

import { useAuth } from "@/provider/ProtectedRoute";
import {
  dispenseHistory,
  dispenseHistoryExport,
  type DispenseHistoryRow,
} from "@/db/statements/medicine";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Search,
  HandHeart,
  User,
  Clock,
  ChevronRight,
  FileText,
  Pill,
  Download,
  CalendarRange,
} from "lucide-react";

const fmt = (d: string) =>
  new Date(d).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

// ── Period filter ─────────────────────────────────────────────────────────
type PeriodType = "all" | "month" | "quarter" | "semester";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const pad = (n: number) => String(n).padStart(2, "0");
const isoDay = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Compute inclusive [from,to] calendar days + a human label for the period. */
const computeRange = (
  type: PeriodType,
  year: number,
  value: number,
): { from: string; to: string; label: string } => {
  if (type === "month") {
    const from = new Date(year, value, 1);
    const to = new Date(year, value + 1, 0);
    return { from: isoDay(from), to: isoDay(to), label: `${MONTHS[value]} ${year}` };
  }
  if (type === "quarter") {
    const start = value * 3;
    const from = new Date(year, start, 1);
    const to = new Date(year, start + 3, 0);
    return { from: isoDay(from), to: isoDay(to), label: `Q${value + 1} ${year}` };
  }
  if (type === "semester") {
    const start = value * 6;
    const from = new Date(year, start, 1);
    const to = new Date(year, start + 6, 0);
    return {
      from: isoDay(from),
      to: isoDay(to),
      label: `${value === 0 ? "1st" : "2nd"} Semester ${year}`,
    };
  }
  return { from: "", to: "", label: "All time" };
};

const now = new Date();
const CURRENT_YEAR = now.getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

// sensible default "value" when a period type is first chosen
const defaultValueFor = (type: PeriodType): number => {
  if (type === "month") return now.getMonth();
  if (type === "quarter") return Math.floor(now.getMonth() / 3);
  if (type === "semester") return now.getMonth() < 6 ? 0 : 1;
  return 0;
};

const DispenseHistory = () => {
  const { lineId } = useParams();
  const auth = useAuth();
  const nav = useNavigate();
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 400);

  const [periodType, setPeriodType] = useState<PeriodType>("all");
  const [year, setYear] = useState(CURRENT_YEAR);
  const [value, setValue] = useState(0);
  const [exporting, setExporting] = useState(false);

  const range = useMemo(
    () => computeRange(periodType, year, value),
    [periodType, year, value],
  );

  const { data, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: ["dispense-history", lineId, query, range.from, range.to],
      queryFn: ({ pageParam }) =>
        dispenseHistory(
          auth.token as string,
          lineId as string,
          pageParam as string | null,
          "20",
          query,
          "",
          range.from,
          range.to,
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

  const changeType = (t: PeriodType) => {
    setPeriodType(t);
    setValue(defaultValueFor(t));
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await dispenseHistoryExport(auth.token as string, lineId as string, {
        query,
        kind: "",
        dateFrom: range.from,
        dateTo: range.to,
        periodLabel: range.label,
      });
      toast.success("Export ready", {
        description: `Dispense report (${range.label}) downloaded.`,
      });
    } catch (e) {
      toast.error("Export failed", {
        description:
          (e as Error)?.message || "Couldn't generate the Excel file.",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Search + Export */}
      <div className="mb-2 flex flex-col sm:flex-row gap-2">
        <InputGroup className="bg-white flex-1">
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
        <Button
          onClick={handleExport}
          disabled={exporting}
          className="h-9 gap-2 bg-green-600 hover:bg-green-700 text-white sm:w-auto w-full"
        >
          {exporting ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export Excel
        </Button>
      </div>

      {/* Period filter */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500">
          <CalendarRange className="h-3.5 w-3.5" />
          Period
        </span>
        <div className="inline-flex rounded-md border bg-white p-0.5">
          {(["all", "month", "quarter", "semester"] as PeriodType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => changeType(t)}
              className={`px-2.5 py-1 text-xs rounded capitalize transition ${
                periodType === t
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t === "all" ? "All time" : t}
            </button>
          ))}
        </div>

        {periodType !== "all" && (
          <>
            {periodType === "month" && (
              <select
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="h-8 rounded-md border bg-white px-2 text-xs text-gray-700"
                aria-label="Month"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i}>
                    {m}
                  </option>
                ))}
              </select>
            )}
            {periodType === "quarter" && (
              <select
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="h-8 rounded-md border bg-white px-2 text-xs text-gray-700"
                aria-label="Quarter"
              >
                <option value={0}>Q1 (Jan–Mar)</option>
                <option value={1}>Q2 (Apr–Jun)</option>
                <option value={2}>Q3 (Jul–Sep)</option>
                <option value={3}>Q4 (Oct–Dec)</option>
              </select>
            )}
            {periodType === "semester" && (
              <select
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="h-8 rounded-md border bg-white px-2 text-xs text-gray-700"
                aria-label="Semester"
              >
                <option value={0}>1st Semester (Jan–Jun)</option>
                <option value={1}>2nd Semester (Jul–Dec)</option>
              </select>
            )}
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="h-8 rounded-md border bg-white px-2 text-xs text-gray-700"
              aria-label="Year"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <Badge
              variant="outline"
              className="text-[10px] bg-blue-50 text-blue-700 border-blue-200"
            >
              {range.label}
            </Badge>
          </>
        )}
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
            <p className="text-sm font-medium text-gray-700">No dispenses yet</p>
            <p className="text-xs text-gray-500 mt-0.5 max-w-xs">
              {query
                ? `No dispense matches “${query}”.`
                : periodType !== "all"
                  ? `No dispense in ${range.label}.`
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
