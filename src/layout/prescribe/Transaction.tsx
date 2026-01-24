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
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <Spinner className="w-8 h-8 mx-auto mb-4" />
          <p className="text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <SWWItem colSpan={1} />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Search Bar */}
      <div className="p-4 border-b">
        <InputGroup className="max-w-md bg-white">
          <InputGroupInput
            placeholder="Search transactions..."
            onChange={(e) => setText(e.target.value)}
          />
          <InputGroupAddon>
            <Search className="w-4 h-4" />
          </InputGroupAddon>
        </InputGroup>
      </div>

      {/* Table Container with Scroll */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="bg-neutral-700 sticky top-0">
            <TableRow>
              <TableHead className="text-white font-semibold">No.</TableHead>
              <TableHead className="text-white font-semibold">
                Ref. Number
              </TableHead>
              <TableHead className="text-white font-semibold">
                Last name
              </TableHead>
              <TableHead className="text-white font-semibold">
                First name
              </TableHead>
              <TableHead className="text-white font-semibold">Date</TableHead>
              <TableHead className="text-white font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isEmpty ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-gray-500"
                >
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              <>
                {allTransactions.map((transaction, index) => {
                  console.log("Rendering transaction:", transaction); // Debug log
                  return (
                    <PrescribeTransactionItem
                      key={transaction.id}
                      item={transaction}
                      no={index + 1}
                      query={query}
                    />
                  );
                })}

                {/* Infinite scroll trigger */}
                {hasNextPage && (
                  <TableRow ref={ref}>
                    <TableCell colSpan={6} className="text-center py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Spinner className="w-4 h-4" />
                        <span className="text-sm text-gray-600">
                          Loading more transactions...
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {/* No more data indicator */}
                {!hasNextPage && allTransactions.length > 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-4 text-gray-500 text-sm"
                    >
                      All transactions loaded ({allTransactions.length} total)
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>

        {/* Loading state */}
        {isFetchingNextPage && (
          <div className="flex items-center justify-center p-4 border-t">
            <div className="flex items-center gap-2 text-gray-600">
              <Spinner className="w-4 h-4" />
              <span className="text-sm">Loading more transactions...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transaction;
