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
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
//
import type { MedicineLogs as MedicineLogsProps } from "@/interface/data";
import SWWItem from "@/layout/item/SWWItem";
import { ClipboardList, Clock, User, FileText } from "lucide-react";

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
          "",
        ),
      initialPageParam: null,
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.lastCursor : undefined,
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
  const isLoading = isFetching && !isFetchingNextPage && totalCount === 0;

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-4 py-3 sm:px-6 bg-white border-b">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex p-2 bg-blue-50 rounded-lg">
              <ClipboardList className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Medicine Logs
              </h2>
              <p className="text-sm text-gray-500">
                Audit trail of all medicine-related activities
              </p>
            </div>
          </div>
          {totalCount > 0 && !isLoading && (
            <Badge variant="outline" className="self-start sm:self-auto">
              {totalCount} log{totalCount !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <Spinner className="w-8 h-8 mx-auto" />
              <p className="text-gray-600">Loading medicine logs...</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="min-w-full">
              <Table className="w-full">
                <TableHeader className="sticky top-0 bg-gray-100 z-10">
                  <TableRow className="hover:bg-gray-100">
                    <TableHead className="py-3 px-4 text-gray-700 font-semibold w-16">
                      No.
                    </TableHead>
                    <TableHead className="py-3 px-4 text-gray-700 font-semibold min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Action
                      </div>
                    </TableHead>
                    <TableHead className="py-3 px-4 text-gray-700 font-semibold min-w-[180px]">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Note
                      </div>
                    </TableHead>
                    <TableHead className="py-3 px-4 text-gray-700 font-semibold min-w-[180px]">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        User (Username)
                      </div>
                    </TableHead>
                    <TableHead className="py-3 px-4 text-gray-700 font-semibold min-w-[140px]">
                      Date & Time
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {totalCount > 0 ? (
                    <>
                      {allMedicines.map((item, i) => (
                        <MedicineLogsItems
                          key={item.id}
                          item={item}
                          no={i + 1}
                        />
                      ))}

                      {/* Infinite scroll loading */}
                      {isFetchingNextPage && (
                        <TableRow>
                          <TableCell colSpan={5} className="py-6">
                            <div className="flex items-center justify-center gap-3">
                              <Spinner className="w-5 h-5" />
                              <span className="text-sm text-gray-600">
                                Loading more logs...
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}

                      {/* Infinite scroll trigger */}
                      <TableRow ref={ref}>
                        <TableCell colSpan={5} className="h-10">
                          {/* Empty cell for trigger */}
                        </TableCell>
                      </TableRow>

                      {/* End of list */}
                      {!hasNextPage && totalCount > 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="py-4 text-center border-t"
                          >
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                              <span className="h-px w-8 bg-gray-300"></span>
                              <span>All logs loaded</span>
                              <span className="h-px w-8 bg-gray-300"></span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              Showing {totalCount} log
                              {totalCount !== 1 ? "s" : ""}
                            </p>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                            <ClipboardList className="h-8 w-8 text-gray-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              No activity logs found
                            </h3>
                            <p className="text-gray-500 text-sm">
                              Medicine-related activities will appear here
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Error state */}
                  {!data && !isLoading && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <SWWItem colSpan={5} />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </div>

      {/* Mobile loading indicator */}
      {isFetchingNextPage && (
        <div className="md:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white border shadow-lg rounded-full px-4 py-2 flex items-center gap-2 z-50">
          <Spinner className="w-4 h-4" />
          <span className="text-sm font-medium">Loading more logs...</span>
        </div>
      )}

      {/* Mobile summary bar */}
      {totalCount > 0 && (
        <div className="md:hidden bg-white border-t px-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {totalCount} log{totalCount !== 1 ? "s" : ""}
            </span>
            <span className="text-gray-400 text-xs">
              Scroll horizontally for details
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineLogs;
