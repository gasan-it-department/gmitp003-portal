import { useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { formatDate } from "@/utils/date";
//
import { medicineTransactions } from "@/db/statements/medicine";
//
import {
  Table,
  TableHead,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Calendar, Package, User } from "lucide-react";
//
import type { MedicineTransaction } from "@/interface/data";

//
interface Props {
  token: string;
  lineId: string;
}

interface ListProps {
  list: MedicineTransaction[];
  hasMore: boolean;
  lastCursor: string | null;
}

const StorageTransaction = ({ lineId, token }: Props) => {
  const { ref, inView } = useInView();

  const {
    data,
    isFetchingNextPage,
    isFetching,
    fetchNextPage,
    hasNextPage,
    error,
    isLoading,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["medicine-transaction", lineId],
    queryFn: ({ pageParam }) =>
      medicineTransactions(token, lineId, pageParam as string | null, "20", ""),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allTransactions = data?.pages.flatMap((page) => page.list) || [];
  const totalTransactions = allTransactions.length;

  console.log({ allTransactions });

  // const getRemarkColor = (remark: number) => {
  //   if (remark > 0) return "bg-green-100 text-green-800";
  //   if (remark < 0) return "bg-red-100 text-red-800";
  //   return "bg-gray-100 text-gray-800";
  // };

  // const formatRemark = (remark: number) => {
  //   return remark > 0 ? `+${remark}` : remark.toString();
  // };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load transactions. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Medicine Transactions
          </CardTitle>
          <Badge variant="secondary" className="text-sm font-normal">
            Total: {totalTransactions}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Date & Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Storage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allTransactions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {allTransactions.map((transaction) => (
                    <TableRow
                      key={transaction.id}
                      className="hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(transaction.timestamp)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-[120px]">
                            {transaction.user.username ||
                              transaction.user.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {transaction.quantity}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {transaction.unit}
                      </TableCell>
                      <TableCell>
                        {transaction?.storage?.name || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Infinite scroll trigger */}
                  <TableRow ref={ref}>
                    <TableCell colSpan={7} className="h-20 text-center">
                      {isFetchingNextPage ? (
                        <div className="flex items-center justify-center gap-2">
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <span className="text-sm text-muted-foreground">
                            Loading more...
                          </span>
                        </div>
                      ) : hasNextPage ? (
                        <span className="text-sm text-muted-foreground">
                          Scroll to load more
                        </span>
                      ) : allTransactions.length > 0 ? (
                        <span className="text-sm text-muted-foreground">
                          No more transactions to load
                        </span>
                      ) : null}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Global loading indicator */}
        {isFetching && !isFetchingNextPage && allTransactions.length === 0 && (
          <div className="mt-4 flex items-center justify-center">
            <Skeleton className="h-4 w-32" />
          </div>
        )}

        {/* Error loading more */}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Error loading more transactions</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default StorageTransaction;
