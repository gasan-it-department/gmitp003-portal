import {} from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
//
import { inventoryLogs } from "@/db/statement";
//
import {
  Table,
  TableBody,
  TableFooter,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from "@/components/ui/table";

//
import type { SupplyTransactionProps } from "@/interface/data";

interface ListProps {
  list: SupplyTransactionProps[];
  hasMore: boolean;
  lastCursor: string | null;
}

const InventoryLogs = () => {
  const { containerId } = useParams();
  const auth = useAuth();
  const { data, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery<ListProps>({
      queryKey: ["inventory-log", containerId],
      queryFn: ({ pageParam }) =>
        inventoryLogs(
          auth.token as string,
          containerId as string,
          pageParam as string | null,
          "20",
          ""
        ),
      initialPageParam: null,
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.lastCursor : undefined,
    });
  return (
    <div className=" w-full h-full">
      <Table>
        <TableHeader className="border bg-neutral-700">
          <TableHead className="text-white">No</TableHead>
          <TableHead>No</TableHead>
          <TableHead>No</TableHead>
          <TableHead>No</TableHead>
          <TableHead>No</TableHead>
          <TableHead>No</TableHead>
          <TableHead>No</TableHead>
        </TableHeader>
      </Table>
    </div>
  );
};

export default InventoryLogs;
