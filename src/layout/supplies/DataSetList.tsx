import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/provider/ProtectedRoute";
import { useParams, useNavigate } from "react-router";
//libs
import { useInfiniteQuery } from "@tanstack/react-query";

//
import { getDataSets } from "@/db/statement";

//
import { type SuppliesDataSetProps } from "@/interface/data";
import { formatDate } from "@/utils/date";

const DataSetList = () => {
  const { token } = useAuth();
  const { containerId } = useParams();
  const { data, isFetching } = useInfiniteQuery<{
    hasMore: boolean;
    lastCursor: string | null;
    list: SuppliesDataSetProps[];
  }>({
    queryKey: ["data-set-list", containerId],
    queryFn: ({ pageParam }) =>
      getDataSets(
        token as string,
        pageParam as string | null,
        "20",
        containerId as string
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage,
    enabled: !!containerId || !token,
  });

  const nav = useNavigate();
  console.log({ data, containerId, token });

  return (
    <Table>
      <TableHeader className=" border bg-neutral-700">
        <TableHead className=" text-white">No.</TableHead>
        <TableHead className=" text-white">Title</TableHead>
        <TableHead className=" text-white">Items</TableHead>
        <TableHead className=" text-white">Create at</TableHead>
      </TableHeader>
      <TableBody>
        {data && data.pages.length > 0 ? (
          data.pages
            .flatMap((item) => item.list)
            .map((item, i) => (
              <TableRow
                onClick={() => nav(`${item.id}`)}
                key={item.id}
                className=" cursor-pointer hover:bg-neutral-200"
              >
                <TableCell>{i + 1}</TableCell>
                <TableCell>{item.title}</TableCell>
                <TableCell>{0}</TableCell>
                <TableCell>{formatDate(item.timestamp)}</TableCell>
              </TableRow>
            ))
        ) : (
          <TableRow>
            <TableCell className=" text-center" colSpan={4}>
              No data found!, create data set now
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default DataSetList;
