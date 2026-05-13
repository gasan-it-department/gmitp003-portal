import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";
//
import { supplyDispenseTransaction } from "@/db/statements/supply";
//
import { Spinner } from "@/components/ui/spinner";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Table,
  TableBody,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import DispenseTransactionItem from "./items/DispenseTransactionItem";
import SWWItem from "../item/SWWItem";
//
import { Search, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
//
import type { SupplyDispenseRecordProps } from "@/interface/data";

interface Props {
  listId: string;
  token: string;
}

interface ListProps {
  list: SupplyDispenseRecordProps[];
  lastCursor: string | null;
  hasMore: boolean;
}

const DispenseTransactions = ({ listId, token }: Props) => {
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 1000);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const {
    data,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isError,
    error,
    refetch,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["supply-dispense-transaction", listId, query, dateFrom, dateTo],
    queryFn: ({ pageParam }) =>
      supplyDispenseTransaction(
        token,
        listId,
        pageParam as string | null,
        "20",
        query,
        dateFrom,
        dateTo,
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
  });

  const clearDates = () => {
    setDateFrom("");
    setDateTo("");
  };
  const hasDateFilter = dateFrom || dateTo;

  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  // Fetch next page when the loader comes into view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    refetch();
  }, [query]);
  // Calculate total items
  const totalItems = data?.pages.reduce(
    (total, page) => total + page.list.length,
    0,
  );

  // Calculate total quantity dispensed
  const totalQuantity = data?.pages.reduce(
    (total, page) =>
      total +
      page.list.reduce(
        (pageTotal, record) => pageTotal + parseInt(record.quantity || "0"),
        0,
      ),
    0,
  );

  if (isError) {
    return (
      <div className="border rounded-lg p-4 text-center bg-white">
        <div className="text-red-600 text-sm">
          Error loading transactions: {(error as Error)?.message}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header - Compact */}
      <div className="border-b bg-white p-3">
        <h2 className="text-sm font-semibold text-gray-800">
          Dispense Transactions
        </h2>
        {totalItems !== undefined && (
          <p className="text-xs text-gray-500 mt-0.5">
            {totalItems} transaction{totalItems !== 1 ? "s" : ""} •{" "}
            {totalQuantity || 0} total units
          </p>
        )}
      </div>

      {/* Summary stats - Compact */}
      <div className="border-b bg-white p-3">
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-gray-500">Total: </span>
            <span className="font-semibold">{totalQuantity || 0} units</span>
          </div>
          <div>
            <span className="text-gray-500">Transactions: </span>
            <span className="font-semibold">{totalItems || 0}</span>
          </div>
          <div>
            <span className="text-gray-500">Avg: </span>
            <span className="font-semibold">
              {totalItems && totalQuantity
                ? Math.round(totalQuantity / totalItems)
                : 0}{" "}
              per
            </span>
          </div>
        </div>
      </div>

      {/* Search + Date Range */}
      <div className="border-b bg-white p-3 space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <InputGroup className="flex-1">
            <InputGroupAddon>
              <Search className="h-3.5 w-3.5" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search transaction..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="h-8 text-xs"
            />
          </InputGroup>

          <div className="flex items-center gap-1.5">
            <div className="flex flex-col">
              <label className="text-[9px] text-gray-500 uppercase tracking-wide ml-0.5">From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                onClick={(e) =>
                  (e.currentTarget as HTMLInputElement).showPicker?.()
                }
                max={dateTo || undefined}
                className="h-8 text-xs w-36 cursor-pointer"
                aria-label="From date"
              />
            </div>
            <span className="text-[10px] text-gray-400 mt-3">→</span>
            <div className="flex flex-col">
              <label className="text-[9px] text-gray-500 uppercase tracking-wide ml-0.5">To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                onClick={(e) =>
                  (e.currentTarget as HTMLInputElement).showPicker?.()
                }
                min={dateFrom || undefined}
                className="h-8 text-xs w-36 cursor-pointer"
                aria-label="To date"
              />
            </div>
            {hasDateFilter && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 mt-3 text-[10px] text-gray-500 hover:text-gray-700"
                onClick={clearDates}
                title="Clear date filter"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {hasDateFilter && (
          <div className="flex items-center gap-1.5 text-[10px] text-blue-700">
            <Calendar className="h-2.5 w-2.5" />
            <span>
              {dateFrom && dateTo
                ? `Filtering ${dateFrom} → ${dateTo}`
                : dateFrom
                  ? `From ${dateFrom}`
                  : `Up to ${dateTo}`}
            </span>
          </div>
        )}
      </div>

      {/* Loading state for initial fetch */}
      {isFetching && !data && (
        <div className="flex justify-center items-center py-8">
          <Spinner className="h-5 w-5" />
          <span className="ml-2 text-xs text-gray-500">
            Loading transactions...
          </span>
        </div>
      )}

      {/* Table Container - THIS IS THE SCROLLABLE AREA */}
      <div className="flex-1 overflow-auto bg-white rounded-b-lg">
        <div className="min-w-[800px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="p-2 text-xs w-[160px]">
                  Date & Time
                </TableHead>
                <TableHead className="p-2 text-xs">Transaction Ref.</TableHead>
                <TableHead className="p-2 text-xs text-center w-[80px]">
                  Quantity
                </TableHead>
                <TableHead className="p-2 text-xs">Recipient</TableHead>
                <TableHead className="p-2 text-xs">Dispensed By</TableHead>
                <TableHead className="p-2 text-xs">Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data ? (
                data.pages.flatMap((item) => item.list).length > 0 ? (
                  data.pages
                    .flatMap((item) => item.list)
                    .map((item) => (
                      <DispenseTransactionItem
                        item={item}
                        key={item.id}
                        ref={ref}
                      />
                    ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="p-4 text-center text-gray-500 text-sm"
                    >
                      No data found!
                    </TableCell>
                  </TableRow>
                )
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="p-4">
                    <SWWItem colSpan={6} />
                  </TableCell>
                </TableRow>
              )}

              {/* Empty state */}
              {!isFetching && data?.pages[0]?.list.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-gray-400">
                      <p className="text-sm font-medium mb-1">
                        No transactions found
                      </p>
                      <p className="text-xs">
                        No dispense transactions for this list yet.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Loading indicator for next page */}
        {isFetchingNextPage && (
          <div className="border-t p-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <Spinner className="h-3.5 w-3.5" />
              <span className="text-xs text-gray-500">
                Loading more transactions...
              </span>
            </div>
          </div>
        )}

        {/* No more data message */}
        {!hasNextPage && data && data.pages[0]?.list.length > 0 && (
          <div className="border-t p-2 text-center">
            <p className="text-xs text-gray-400">All transactions loaded</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DispenseTransactions;
