import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
import { useParams } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  // TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

//
import { getOrderItems } from "@/db/statement";
import type { SupplyOrder } from "@/interface/data";

interface Props {
  lastCursor: string | null;
  hasMore: boolean;
  list: SupplyOrder[];
}

const SupplyOrderItem = () => {
  const auth = useAuth();
  const { orderId } = useParams();

  const { data } = useInfiniteQuery<Props>({
    queryFn: ({ pageParam }) =>
      getOrderItems(
        auth.token as string,
        "",
        pageParam as string | null,
        "20",
        orderId as string,
      ),
    queryKey: ["order", orderId],
    enabled: !!orderId,
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.hasMore,
  });

  if (!data) {
    return;
  }
  return (
    <Table>
      <TableHeader>
        <TableHead>No.</TableHead>
        <TableHead>Item</TableHead>
        <TableHead>ref</TableHead>
        <TableHead>No.</TableHead>
      </TableHeader>
      <TableBody>
        {data.pages.flatMap((item) => item.list).length > 0 ? (
          data.pages
            .flatMap((item) => item.list)
            .map((item, i) => (
              <TableRow key={i}>
                <TableCell>{i + 1}</TableCell>
                <TableCell>{item.supply.item}</TableCell>
              </TableRow>
            ))
        ) : (
          <TableRow>
            <TableCell colSpan={4} className=""></TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default SupplyOrderItem;
