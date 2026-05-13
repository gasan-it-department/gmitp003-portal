import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";

import {
  inventoryTimebaseReport,
  inventoryTimebaseReportExport,
} from "@/db/statements/supply";

import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableHeader,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Package, X, FileSpreadsheet } from "lucide-react";

import type { ProtectedRouteProps } from "@/interface/data";

// Response shape from /supply/inventory/timebase/report
interface ReportItem {
  id: string;
  desc: string;
  unit: string;
  first: number | null;
  second: number | null;
  third: number | null;
  fourth: number | null;
  fifth: number | null;
  recordedIssuances: number;
  totalDispensed: number;
  qty: number;
  unitCost: number;
  totalCost: number;
  balStock: number;
  balAmount: number;
  // legacy aliases (kept for back-compat)
  totalStock?: number;
  price?: number;
}

interface ListProps {
  list: ReportItem[];
  hasMore: boolean;
  lastCursor: string | null;
  meta: { year: number; quarter: 1 | 2 | 3 | 4 | null };
}

interface Props {
  id: string | undefined;
  auth: ProtectedRouteProps;
  lineId: string;
}

const currencyFmt = (n: number) =>
  `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

// Current calendar quarter (1..4) based on today's month
const currentQuarter = String(Math.floor(new Date().getMonth() / 3) + 1);

const InventoryReport = ({ id, auth }: Props) => {
  const [year, setYear] = useState<string>(String(currentYear));
  const [quarter, setQuarter] = useState<string>(currentQuarter);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!id || !auth.token) {
      toast.error("Missing list ID or authentication.");
      return;
    }
    setIsExporting(true);
    try {
      const { blob, filename } = await inventoryTimebaseReportExport(
        auth.token as string,
        id,
        year || undefined,
        quarter || undefined,
      );
      // Trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${filename}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to export report.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  const {
    data,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["timebase-report", id, year, quarter],
    queryFn: ({ pageParam }) =>
      inventoryTimebaseReport(
        auth.token as string,
        id as string,
        pageParam as string | null,
        "20",
        year || undefined,
        quarter || undefined,
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    enabled: !!id && !!auth.token,
    refetchOnWindowFocus: false,
  });

  const { ref } = useInView({
    threshold: 0.5,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
  });

  const list = data?.pages.flatMap((p) => p.list) ?? [];
  const meta = data?.pages[0]?.meta;
  const isLoading = isFetching && list.length === 0;
  const displayYear = meta?.year ?? Number(year);
  const displayQuarter = meta?.quarter ?? null;

  return (
    <div className="w-full h-full flex flex-col bg-white border rounded-lg overflow-hidden">

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Package className="h-3 w-3 text-blue-500" />
          <div>
            <h3 className="text-xs font-semibold text-gray-800">
              Inventory Issuance Report
            </h3>
            <p className="text-[10px] text-gray-500 leading-none mt-0.5">
              First 5 issuance records per item for the selected year
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Calendar className="h-3 w-3 text-gray-400" />
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="h-7 text-xs w-24">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)} className="text-xs">
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={quarter || currentQuarter} onValueChange={setQuarter}>
            <SelectTrigger className="h-7 text-xs w-28">
              <SelectValue placeholder="Quarter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1" className="text-xs">Q1 (Jan–Mar)</SelectItem>
              <SelectItem value="2" className="text-xs">Q2 (Apr–Jun)</SelectItem>
              <SelectItem value="3" className="text-xs">Q3 (Jul–Sep)</SelectItem>
              <SelectItem value="4" className="text-xs">Q4 (Oct–Dec)</SelectItem>
            </SelectContent>
          </Select>

          {(quarter !== currentQuarter || year !== String(currentYear)) && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-[10px] text-gray-500"
              onClick={() => {
                setQuarter(currentQuarter);
                setYear(String(currentYear));
              }}
              title="Reset to current quarter"
            >
              <X className="h-3 w-3" />
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-[10px] gap-1.5 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            onClick={handleExport}
            disabled={isExporting || isLoading || list.length === 0}
            title="Export to Excel"
          >
            {isExporting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-3 w-3" />
            )}
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </div>
      </div>

      {/* ── Table — matches SUPPLIES {YEAR} workbook column order ────── */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[1100px]">
          <Table>
            <TableHeader className="bg-gray-100 sticky top-0 z-10">
              {/* Row 1 — parent header: "ISSUANCE {YEAR}" spans QTY..Total Amount */}
              <TableRow className="border-b hover:bg-gray-100">
                <TableHead
                  rowSpan={2}
                  className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 w-14 align-middle border-r text-center"
                >
                  Item No.
                </TableHead>
                <TableHead
                  rowSpan={2}
                  className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 min-w-[220px] align-middle border-r"
                >
                  Description
                </TableHead>
                <TableHead
                  rowSpan={2}
                  className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 w-16 align-middle border-r text-center"
                >
                  Unit
                </TableHead>

                {/* "ISSUANCE {YEAR}" group spans 10 sub-columns */}
                <TableHead
                  colSpan={10}
                  className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 text-center"
                >
                  Issuance{" "}
                  {displayQuarter ? `Q${displayQuarter} · ` : ""}
                  {displayYear}
                </TableHead>
              </TableRow>

              {/* Row 2 — sub-headers */}
              <TableRow className="border-b hover:bg-gray-100">
                <TableHead className="text-[10px] font-medium text-gray-600 uppercase px-2 py-1.5 text-center w-14 border-r">
                  QTY
                </TableHead>
                <TableHead className="text-[10px] font-medium text-gray-600 uppercase px-2 py-1.5 text-right w-24 border-r">
                  Unit Cost
                </TableHead>
                <TableHead className="text-[10px] font-medium text-gray-600 uppercase px-2 py-1.5 text-right w-28 border-r">
                  Total Cost
                </TableHead>
                <TableHead className="text-[10px] font-medium text-gray-500 px-2 py-1.5 text-center w-12 border-r">
                  1st
                </TableHead>
                <TableHead className="text-[10px] font-medium text-gray-500 px-2 py-1.5 text-center w-12 border-r">
                  2nd
                </TableHead>
                <TableHead className="text-[10px] font-medium text-gray-500 px-2 py-1.5 text-center w-12 border-r">
                  3rd
                </TableHead>
                <TableHead className="text-[10px] font-medium text-gray-500 px-2 py-1.5 text-center w-12 border-r">
                  4th
                </TableHead>
                <TableHead className="text-[10px] font-medium text-gray-500 px-2 py-1.5 text-center w-12 border-r">
                  5th
                </TableHead>
                <TableHead className="text-[10px] font-medium text-gray-600 px-2 py-1.5 text-center w-24 border-r">
                  Balance On Stock
                </TableHead>
                <TableHead className="text-[10px] font-medium text-gray-600 px-2 py-1.5 text-right w-28">
                  Total Amount
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {/* Loading */}
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={13} className="py-10">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span className="text-xs">Loading report...</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {/* Error */}
              {!isLoading && isError && (
                <TableRow>
                  <TableCell colSpan={13} className="py-10 text-center">
                    <p className="text-xs text-red-600">Failed to load report</p>
                  </TableCell>
                </TableRow>
              )}

              {/* Data rows */}
              {!isLoading && !isError && list.length > 0 && (
                <>
                  {list.map((item, i) => (
                    <TableRow
                      key={item.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <TableCell className="px-3 py-2 text-xs text-gray-500 font-medium border-r text-center">
                        {i + 1}
                      </TableCell>
                      <TableCell className="px-3 py-2 border-r">
                        <p className="text-xs font-medium text-gray-800 truncate">
                          {item.desc}
                        </p>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-xs text-gray-600 border-r text-center">
                        {item.unit}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-center text-xs font-medium text-gray-800 border-r">
                        {item.qty}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-right text-xs text-gray-700 border-r">
                        {currencyFmt(item.unitCost)}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-right text-xs font-medium text-gray-800 border-r">
                        {currencyFmt(item.totalCost)}
                      </TableCell>
                      <TableCell className="px-2 py-2 text-center text-xs text-gray-700 border-r">
                        {item.first ?? "-"}
                      </TableCell>
                      <TableCell className="px-2 py-2 text-center text-xs text-gray-700 border-r">
                        {item.second ?? "-"}
                      </TableCell>
                      <TableCell className="px-2 py-2 text-center text-xs text-gray-700 border-r">
                        {item.third ?? "-"}
                      </TableCell>
                      <TableCell className="px-2 py-2 text-center text-xs text-gray-700 border-r">
                        {item.fourth ?? "-"}
                      </TableCell>
                      <TableCell className="px-2 py-2 text-center text-xs text-gray-700 border-r">
                        {item.fifth ?? "-"}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-center border-r">
                        <Badge
                          variant={item.balStock > 0 ? "secondary" : "destructive"}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {item.balStock}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-right text-xs font-medium text-gray-800">
                        {currencyFmt(item.balAmount)}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* TOTAL row — matches the excel TOTAL */}
                  <TableRow className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                    <TableCell
                      colSpan={3}
                      className="px-3 py-2 text-right text-[10px] uppercase tracking-wide text-gray-700 border-r"
                    >
                      Total
                    </TableCell>
                    <TableCell className="px-3 py-2 text-center text-xs text-gray-900 border-r">
                      {list.reduce((s, x) => s + x.qty, 0)}
                    </TableCell>
                    <TableCell className="px-3 py-2 border-r" />
                    <TableCell className="px-3 py-2 text-right text-xs text-gray-900 border-r">
                      {currencyFmt(list.reduce((s, x) => s + x.totalCost, 0))}
                    </TableCell>
                    <TableCell colSpan={5} className="px-3 py-2 border-r" />
                    <TableCell className="px-3 py-2 text-center text-xs text-gray-900 border-r">
                      {list.reduce((s, x) => s + x.balStock, 0)}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-right text-xs text-gray-900">
                      {currencyFmt(list.reduce((s, x) => s + x.balAmount, 0))}
                    </TableCell>
                  </TableRow>

                  {/* Infinite scroll trigger */}
                  {hasNextPage && (
                    <TableRow ref={ref}>
                      <TableCell colSpan={13} className="h-10 p-0" />
                    </TableRow>
                  )}

                  {isFetchingNextPage && (
                    <TableRow>
                      <TableCell colSpan={13} className="py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-gray-400">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span className="text-[10px]">Loading more...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {!hasNextPage && (
                    <TableRow>
                      <TableCell colSpan={13} className="py-3 text-center border-t">
                        <p className="text-[10px] text-gray-400">
                          All {list.length} item{list.length !== 1 ? "s" : ""} loaded
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}

              {/* Empty state */}
              {!isLoading && !isError && list.length === 0 && (
                <TableRow>
                  <TableCell colSpan={13} className="py-10 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <Package className="h-5 w-5 text-gray-300" />
                      </div>
                      <p className="text-xs font-medium text-gray-500">
                        No inventory data
                      </p>
                      <p className="text-[10px] text-gray-400">
                        No supplies match this filter
                      </p>
                    </div>
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

export default InventoryReport;
