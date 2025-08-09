import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
import { useParams, useNavigate } from "react-router";
//
import { getList } from "@/db/statement";

//
import {
  Table,
  TableBody,
  TableHead,
  TableCell,
  TableRow,
  TableHeader,
} from "@/components/ui/table";

//props
import { type SupplyBatchProps } from "@/interface/data";
import { formatDate } from "@/utils/date";
interface Props {
  lastCursor: string | null;
  limit: string;
  list: SupplyBatchProps[];
}

const InventoryList = () => {
  const auth = useAuth();
  const { containerId, lineId } = useParams();
  const { data, isFetching, isFetchingNextPage, refetch } =
    useInfiniteQuery<Props>({
      queryFn: ({ pageParam }) =>
        getList(
          auth.token as string,
          "",
          pageParam as string | null,
          "20",
          containerId as string
        ),
      queryKey: ["container-list", containerId],
      initialPageParam: null,
      getNextPageParam: (lastPage) => lastPage.lastCursor,
    });

  const nav = useNavigate();
  return (
    <Table className=" w-full h-full">
      <TableHeader className=" border bg-neutral-700">
        <TableHead className=" text-white">No.</TableHead>
        <TableHead className=" text-white">Title</TableHead>
        <TableHead className=" text-white">Set</TableHead>
        <TableHead className=" text-white">Item/s</TableHead>
        <TableHead className=" text-white">Created At</TableHead>
      </TableHeader>
      <TableBody>
        {data
          ? data.pages.flatMap((item) => item.list).length > 0
            ? data.pages
                .flatMap((item) => item.list)
                .map((item, i) => (
                  <TableRow
                    onClick={() => nav(`list/${item.id}`)}
                    key={i}
                    className=" hover:bg-neutral-200 cursor-pointer"
                  >
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>das</TableCell>
                    <TableCell>dasd</TableCell>
                    <TableCell>{formatDate(item.timestamp)}</TableCell>
                  </TableRow>
                ))
            : null
          : ""}
      </TableBody>
    </Table>
  );
};

export default InventoryList;
