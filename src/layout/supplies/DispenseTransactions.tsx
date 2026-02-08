import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";
//
import { supplyDispenseTransaction } from "@/db/statements/supply";
//
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
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
import { Search } from "lucide-react";
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
    queryKey: ["supply-dispense-transaction", listId],
    queryFn: ({ pageParam }) =>
      supplyDispenseTransaction(
        token,
        listId,
        pageParam as string | null,
        "20",
        query,
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
  });

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
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <div className="text-destructive">
            Error loading transactions: {(error as Error)?.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Dispense Transactions
            </h2>
            {totalItems !== undefined && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {totalItems} transaction{totalItems !== 1 ? "s" : ""} •{" "}
                {totalQuantity || 0} total units
              </p>
            )}
          </div>
        </div>

        {/* Summary stats - Slim version */}
        <div className="flex items-center gap-6 mb-6 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Total: </span>
            <span className="font-semibold">{totalQuantity || 0} units</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">
              Transactions:{" "}
            </span>
            <span className="font-semibold">{totalItems || 0}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Avg: </span>
            <span className="font-semibold">
              {totalItems && totalQuantity
                ? Math.round(totalQuantity / totalItems)
                : 0}{" "}
              per
            </span>
          </div>
        </div>
      </div>

      {/* Loading state for initial fetch */}
      {isFetching && !data && (
        <div className="flex justify-center items-center py-12">
          <Spinner />
          <span className="ml-3 text-gray-600 dark:text-gray-400">
            Loading transactions...
          </span>
        </div>
      )}

      {/* Table Container */}
      <div className="flex-1 overflow-auto border rounded-lg px-2">
        <div className=" w-full flex gap-2">
          <InputGroup className=" w-full mt-2">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Searh transaction..."
              onChange={(e) => setText(e.target.value)}
            />
          </InputGroup>
          <InputGroup className=" w-1/4 mt-2">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput placeholder="Searh transaction..." type="date" />
          </InputGroup>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-800/50">
              <TableHead className="w-[180px]">Date & Time</TableHead>
              <TableHead>Item</TableHead>
              <TableHead className="w-[100px] text-right">Quantity</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Dispensed By</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
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
                  <TableCell colSpan={7} className=" text-muted-foreground">
                    No data found!
                  </TableCell>
                </TableRow>
              )
            ) : (
              <SWWItem colSpan={7} />
            )}

            {/* Empty state */}
            {!isFetching && data?.pages[0]?.list.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="text-gray-400 dark:text-gray-500">
                    <p className="font-medium mb-2">No transactions found</p>
                    <p className="text-sm">
                      There are no dispense transactions for this list yet.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Loading indicator for next page */}
        {isFetchingNextPage && (
          <div className="border-t">
            <div className="flex justify-center items-center py-4">
              <Spinner />
              <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                Loading more transactions...
              </span>
            </div>
          </div>
        )}

        {/* No more data message */}
        {!hasNextPage && data && data.pages[0]?.list.length > 0 && (
          <div className="border-t">
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                All transactions loaded
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Loading state overlay for initial fetch */}
      {isFetching && data && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center">
          <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow">
            <Spinner />
            <span className="text-sm">Loading more...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DispenseTransactions;
