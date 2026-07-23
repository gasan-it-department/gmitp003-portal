import { useMemo, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";

import { useAuth } from "@/provider/ProtectedRoute";
import {
  expirationList,
  exportExpirationList,
} from "@/db/statements/storage";
import type { ExpirationItem } from "@/db/statements/storage";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  ArrowLeft,
  Search,
  Download,
  Loader2,
  CalendarClock,
  AlertCircle,
  Building2,
} from "lucide-react";

const Expiration = () => {
  const auth = useAuth();
  const nav = useNavigate();
  const { lineId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawMode = searchParams.get("mode");
  const mode: "soon" | "expired" = rawMode === "expired" ? "expired" : "soon";

  const [text, setText] = useState("");
  const [query] = useDebounce(text, 500);

  const {
    data,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ["medicine-expiration", lineId, mode, query],
    queryFn: ({ pageParam }) =>
      expirationList(
        auth.token as string,
        lineId as string,
        mode,
        pageParam as string | null,
        "20",
        query,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => (last.hasMore ? last.lastCursor : undefined),
    enabled: !!auth.token && !!lineId,
    refetchOnWindowFocus: false,
  });

  const { ref } = useInView({
    threshold: 0.5,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetching && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
  });

  const items: ExpirationItem[] = useMemo(
    () => data?.pages.flatMap((p) => p.list) ?? [],
    [data],
  );

  // Summary is identical across pages (filter is the same) — read off the
  // first page so we don't repeat the totals as the user scrolls.
  const summary = data?.pages[0]?.summary;

  const { mutateAsync: doExport, isPending: isExporting } = useMutation({
    mutationFn: async () => {
      const { blob, filename } = await exportExpirationList(
        auth.token as string,
        lineId as string,
        mode,
        query,
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => toast.success("Export started"),
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ??
          (err instanceof Error ? err.message : "Export failed"),
      );
    },
  });

  const switchMode = (next: "soon" | "expired") => {
    setSearchParams({ mode: next }, { replace: true });
  };

  const fmt = (d?: string | null) =>
    d
      ? new Date(d).toLocaleDateString("en-PH", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—";

  const dayBadge = (days: number | null) => {
    if (days === null || days === undefined) {
      return (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          —
        </Badge>
      );
    }
    if (days <= 0) {
      return (
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 bg-red-50 text-red-700 border-red-200"
        >
          {Math.abs(days)} day{Math.abs(days) === 1 ? "" : "s"} ago
        </Badge>
      );
    }
    const cls =
      days <= 30
        ? "bg-red-50 text-red-700 border-red-200"
        : days <= 90
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : "bg-emerald-50 text-emerald-700 border-emerald-200";
    return (
      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${cls}`}>
        in {days} day{days === 1 ? "" : "s"}
      </Badge>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">

      {/* Header */}
      <div className="bg-white border-b flex-shrink-0">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => nav(-1)}
            >
              <ArrowLeft className="h-3 w-3" />
            </Button>
            <div
              className={`p-1.5 rounded-md flex-shrink-0 ${
                mode === "expired" ? "bg-red-600" : "bg-amber-500"
              }`}
            >
              <CalendarClock className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-semibold text-gray-900 truncate">
                {mode === "expired" ? "Expired Medicines" : "Expiring Soon"}
              </h1>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                {mode === "expired"
                  ? "Past expiration — requires disposal"
                  : "Expiring within 6 months"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="flex p-0.5 bg-white border rounded-md">
              <button
                type="button"
                onClick={() => switchMode("soon")}
                className={`h-6 px-2 text-[10px] rounded transition-colors ${
                  mode === "soon"
                    ? "bg-amber-100 text-amber-800 font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Soon
              </button>
              <button
                type="button"
                onClick={() => switchMode("expired")}
                className={`h-6 px-2 text-[10px] rounded transition-colors ${
                  mode === "expired"
                    ? "bg-red-100 text-red-800 font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Expired
              </button>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => doExport()}
              disabled={isExporting || items.length === 0}
              className="h-7 text-[10px] gap-1.5 bg-blue-600 hover:bg-blue-700"
            >
              {isExporting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              Export Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b px-3 py-2 flex items-center gap-1.5 flex-shrink-0">
        <InputGroup className="bg-white flex-1 max-w-xs">
          <InputGroupAddon>
            <Search className="h-3 w-3 text-gray-400" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search medicine or serial..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-7 text-[11px]"
          />
        </InputGroup>
        <span className="text-[10px] text-gray-500 ml-auto">
          {items.length} record{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Summary strip */}
      {summary && summary.totalBatches > 0 && (
        <div className="bg-white border-b px-3 py-2 flex items-center gap-2 flex-wrap flex-shrink-0">
          <Badge
            variant="outline"
            className={`text-[10px] px-2 py-0.5 ${
              mode === "expired"
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {summary.totalBatches} batch
            {summary.totalBatches === 1 ? "" : "es"}
          </Badge>
          <Badge
            variant="outline"
            className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200 font-mono"
          >
            {summary.totalUnits} total units
          </Badge>
          {summary.byQuality.length > 0 && (
            <>
              <span className="text-[10px] text-gray-400">·</span>
              <span className="text-[10px] text-gray-500">By unit:</span>
              {summary.byQuality.map((q) => (
                <Badge
                  key={q.quality}
                  variant="outline"
                  className="text-[10px] px-2 py-0.5 bg-white text-gray-700"
                >
                  <span className="font-mono mr-1">{q.units}</span>
                  {q.quality}
                  <span className="text-gray-400 ml-1">
                    ({q.batches})
                  </span>
                </Badge>
              ))}
            </>
          )}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto p-3">
        <div className="border rounded-lg bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="text-[10px] font-semibold text-gray-700 w-10">
                  No
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[110px]">
                  Serial #
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[160px]">
                  Medicine
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[140px]">
                  Storage
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 text-center w-16">
                  Stock
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 text-center w-16">
                  Per Unit
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[100px]">
                  Manufactured
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[100px]">
                  Expires
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[110px]">
                  {mode === "soon" ? "Time Left" : "Overdue"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isError ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex flex-col items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <p className="text-[10px] font-medium text-red-600">
                        Failed to load
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {(error as any)?.message ?? "Try again later."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isFetching && items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex items-center justify-center gap-1.5 text-gray-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span className="text-[10px]">Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                        <CalendarClock className="h-5 w-5 text-emerald-400" />
                      </div>
                      <p className="text-xs font-medium text-gray-700">
                        {mode === "soon"
                          ? "Nothing expiring soon"
                          : "No expired medicines"}
                      </p>
                      <p className="text-[10px] text-gray-500 max-w-[260px]">
                        {query
                          ? "Try a different search term."
                          : mode === "soon"
                            ? "All stock has at least 6 months of shelf life."
                            : "Inventory is up to date — no disposal needed."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((s, i) => (
                  <TableRow key={s.id} className="hover:bg-gray-50">
                    <TableCell className="text-[10px] text-gray-500">
                      {i + 1}
                    </TableCell>
                    <TableCell className="text-[11px] font-mono text-gray-700">
                      {s.medicine?.serialNumber ?? "—"}
                    </TableCell>
                    <TableCell className="text-[11px] font-medium text-gray-900">
                      {s.medicine?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-[10px] text-gray-700">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-2.5 w-2.5 text-gray-400" />
                        <span className="truncate">
                          {s.MedicineStorage?.name ?? "—"}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-mono">
                        {s.MedicineStorage?.refNumber ?? ""}
                      </p>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 font-mono"
                      >
                        {s.actualStock} {s.quality}
                      </Badge>
                    </TableCell>
                    {/* Batch identity fields — two rows of the same medicine
                        that stay separate differ on one of THESE. */}
                    <TableCell className="text-center text-[10px] text-gray-700 font-mono">
                      × {(s as any).perQuantity ?? 1}
                    </TableCell>
                    <TableCell className="text-[10px] text-gray-700">
                      {fmt((s as any).manufacturingDate)}
                    </TableCell>
                    <TableCell className="text-[10px] text-gray-700">
                      {fmt(s.expiration)}
                    </TableCell>
                    <TableCell>{dayBadge(s.daysToExpire)}</TableCell>
                  </TableRow>
                ))
              )}

              {hasNextPage && (
                <TableRow ref={ref}>
                  <TableCell colSpan={9} className="text-center py-2">
                    {isFetchingNextPage ? (
                      <div className="flex items-center justify-center gap-1.5 text-gray-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-[10px]">Loading more...</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400">
                        Scroll to load more
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )}

              {!hasNextPage && items.length > 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-2 border-t">
                    <span className="text-[10px] text-gray-400">
                      Showing all {items.length} record
                      {items.length !== 1 ? "s" : ""}
                    </span>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default Expiration;
