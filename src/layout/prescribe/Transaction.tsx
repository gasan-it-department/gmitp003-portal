import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";
import {
  Table,
  TableBody,
  TableRow,
  TableHeader,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import SWWItem from "../item/SWWItem";
import PrescribeTransactionItem from "./item/PrescribeTransactionItem";
import { Search } from "lucide-react";
import { prescribeTransaction } from "@/db/statement";
import type { Prescription } from "@/interface/data";

interface Props {
  token: string;
  lineId: string;
}

interface ListProps {
  list: Prescription[];
  hasMore: boolean;
  lastCursor: string | null;
}

const Transaction = ({ token, lineId }: Props) => {
  const { ref, inView } = useInView();
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 1000);

  const {
    data,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["prescribe-transaction", lineId],
    queryFn: ({ pageParam }) =>
      prescribeTransaction(token, lineId, pageParam as string | null, "20"),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
  });

  // Infinite scroll trigger
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    refetch();
  }, [query, refetch]);

  const allTransactions = data?.pages.flatMap((page) => page.list) || [];
  const isEmpty = allTransactions.length === 0;

  if (isFetching && isEmpty) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <Spinner className="w-10 h-10 mx-auto text-blue-600" />
          <p className="text-gray-600 font-medium">Loading transactions...</p>
          <p className="text-sm text-gray-500">Please wait a moment</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md">
          <SWWItem colSpan={1} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header with Search */}
      <div className="px-6 py-4 border-b bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Transactions
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {allTransactions.length} transaction
              {allTransactions.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <InputGroup className="w-80 bg-white shadow-sm border">
            <InputGroupAddon className="pl-3">
              <Search className="w-4 h-4 text-gray-400" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search by name, reference number, or date..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="pl-2"
            />
          </InputGroup>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <Table className="min-w-full">
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="bg-gray-100 hover:bg-gray-100 border-b">
                <TableHead className="font-semibold py-3 px-4 text-gray-700 text-center w-16 border-r">
                  No.
                </TableHead>
                <TableHead className="font-semibold py-3 px-4 text-gray-700 min-w-[140px] border-r">
                  Ref. Number
                </TableHead>
                <TableHead className="font-semibold py-3 px-4 text-gray-700 min-w-[160px] border-r">
                  Last Name
                </TableHead>
                <TableHead className="font-semibold py-3 px-4 text-gray-700 min-w-[160px] border-r">
                  First Name
                </TableHead>
                <TableHead className="font-semibold py-3 px-4 text-gray-700 min-w-[120px] border-r">
                  Date
                </TableHead>
                <TableHead className="font-semibold py-3 px-4 text-gray-700 min-w-[100px]">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100">
              {isEmpty ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-gray-500"
                  >
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Search className="w-12 h-12 text-gray-300" />
                      <div>
                        <p className="font-medium text-gray-900">
                          No transactions found
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {query
                            ? "Try a different search term"
                            : "No transactions available"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {allTransactions.map((transaction, index) => (
                    <PrescribeTransactionItem
                      key={transaction.id}
                      item={transaction}
                      no={index + 1}
                      query={query}
                    />
                  ))}

                  {/* Infinite scroll loader */}
                  {hasNextPage && (
                    <TableRow ref={ref} className="bg-gray-50/50">
                      <TableCell colSpan={6} className="py-6">
                        <div className="flex items-center justify-center gap-3">
                          <Spinner className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">
                            Loading more transactions...
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {/* End of list indicator */}
                  {!hasNextPage && allTransactions.length > 0 && (
                    <TableRow className="bg-gray-50/30">
                      <TableCell
                        colSpan={6}
                        className="py-4 text-center text-gray-500 text-sm font-medium border-t"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span className="h-px w-8 bg-gray-300"></span>
                          <span>All transactions loaded</span>
                          <span className="h-px w-8 bg-gray-300"></span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Showing {allTransactions.length} transactions
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Loading indicator at bottom */}
        {isFetchingNextPage && (
          <div className="border-t bg-white py-3 px-4">
            <div className="flex items-center justify-center gap-3">
              <Spinner className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600">
                Loading additional transactions...
              </span>
            </div>
          </div>
        )}

        {/* Search status indicator */}
        {query && (
          <div className="border-t bg-blue-50 py-2 px-4">
            <p className="text-sm text-blue-700 text-center">
              Showing results for:{" "}
              <span className="font-medium">"{query}"</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transaction;
