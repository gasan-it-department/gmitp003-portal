import { useEffect } from "react";

//db and statements
import { medicineLogs } from "@/db/statement";

//hooks
import { useAuth } from "@/provider/ProtectedRoute";
import { useParams } from "react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
//components and layout
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
} from "@/components/ui/table";
import MedicineLogsItems from "@/layout/medicine/item/MedicineLogsItems";
import { toast } from "sonner";
//
import type { MedicineLogs as MedicineLogsProps } from "@/interface/data";
import SWWItem from "@/layout/item/SWWItem";

interface ListProps {
  list: MedicineLogsProps[];
  lastCursor: string | null;
  hasMore: boolean;
}
const MedicineLogs = () => {
  const { lineId } = useParams();
  const auth = useAuth();
  const { data, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery<ListProps>({
      queryKey: ["medicine-logs", lineId],
      queryFn: ({ pageParam }) =>
        medicineLogs(
          auth.token as string,
          lineId as string,
          pageParam as string | null,
          "20",
          ""
        ),
      initialPageParam: null,
      getNextPageParam: (lastPage) => lastPage.lastCursor,
    });

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetching && !isFetchingNextPage) {
      fetchNextPage().catch(() => {
        toast.error("Failed to load more items");
      });
    }
  }, [inView, hasNextPage, isFetching, isFetchingNextPage, fetchNextPage]);
  const allMedicines = data?.pages.flatMap((page) => page.list) || [];
  const totalCount = allMedicines.length;

  return (
    <div className=" w-full h-full">
      <div className=" w-full"></div>
      <Table>
        <TableHeader className="border bg-neutral-700">
          <TableHead className="text-white">No</TableHead>
          <TableHead className="text-white">Action</TableHead>
          <TableHead className="text-white">Note</TableHead>
          <TableHead className="text-white">User (Username)</TableHead>
          <TableHead className="text-white">Date</TableHead>
        </TableHeader>
        <TableBody>
          {isFetching || isFetchingNextPage ? (
            <TableRow>
              <TableCell colSpan={5} className=" text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : data ? (
            data.pages.flatMap((item) => item.list).length > 0 ? (
              data.pages
                .flatMap((item) => item.list)
                .map((item, i) => <MedicineLogsItems item={item} no={i} />)
            ) : (
              <TableRow>
                <TableCell colSpan={4} className=" text-center">
                  No Logs found!
                </TableCell>
              </TableRow>
            )
          ) : (
            <SWWItem colSpan={5} />
          )}
          <TableRow ref={ref}>
            <TableCell colSpan={5} className="text-center py-4">
              {isFetchingNextPage && <p>Loading more...</p>}
              {!hasNextPage && totalCount > 0 && <p>All items loaded</p>}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

export default MedicineLogs;
