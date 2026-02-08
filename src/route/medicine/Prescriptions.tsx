import { useState, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
import { useParams } from "react-router";
import { useDebounce } from "use-debounce";
import { useInView } from "react-intersection-observer";
//db and statements
import { prescriptionList } from "@/db/statement";

//components and layout
import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { toast } from "sonner";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import SWWItem from "@/layout/item/SWWItem";
import { Spinner } from "@/components/ui/spinner";
import PrescriptionItem from "@/layout/medicine/item/PrescriptionItem";
import { Badge } from "@/components/ui/badge";

//
import { Search, CalendarDays, FileText, Filter } from "lucide-react";

//
import type { Prescription } from "@/interface/data";

interface ListProps {
  list: Prescription[];
  lastCursor: string | null;
  hasMore: boolean;
}

const Prescriptions = () => {
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 1000);
  const { lineId } = useParams();
  const auth = useAuth();
  const { ref, inView } = useInView();

  const {
    isFetching,
    data,
    fetchNextPage,
    refetch,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["prescription", lineId],
    queryFn: ({ pageParam }) =>
      prescriptionList(
        auth.token as string,
        lineId,
        pageParam as string | null,
        "20",
        query,
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
  });

  useEffect(() => {
    refetch();
  }, [query]);

  useEffect(() => {
    if (inView && hasNextPage && !isFetching && !isFetchingNextPage) {
      fetchNextPage().catch((error) => {
        toast.error("Failed to load more items", {
          description: `${error.message || "Something went wrong."} `,
          closeButton: false,
        });
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
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Prescriptions
              </h2>
              <p className="text-sm text-gray-500">
                Manage and view prescription records
              </p>
            </div>
          </div>
          {totalCount > 0 && !isLoading && (
            <Badge variant="outline" className="self-start sm:self-auto">
              {totalCount} record{totalCount !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 bg-white border-b">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1">
            <InputGroup className="w-full">
              <InputGroupAddon className="pl-3">
                <Search className="h-4 w-4 text-gray-500" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by reference, last name, or first name..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="pl-2"
              />
            </InputGroup>
          </div>

          {/* Date Filter */}
          <div className="w-full md:w-auto">
            <InputGroup className="w-full">
              <InputGroupAddon className="pl-3">
                <CalendarDays className="h-4 w-4 text-gray-500" />
              </InputGroupAddon>
              <InputGroupInput
                type="date"
                placeholder="Filter by date"
                onChange={(e) => setText(e.target.value)}
                className="pl-2"
              />
            </InputGroup>
          </div>

          {/* Mobile Filter Button */}
          <button className="md:hidden flex items-center justify-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Filter className="h-4 w-4" />
            More Filters
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <Spinner className="w-8 h-8 mx-auto" />
              <p className="text-gray-600">Loading prescriptions...</p>
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
                      Ref. #
                    </TableHead>
                    <TableHead className="py-3 px-4 text-gray-700 font-semibold min-w-[140px]">
                      Last Name
                    </TableHead>
                    <TableHead className="py-3 px-4 text-gray-700 font-semibold min-w-[140px]">
                      First Name
                    </TableHead>
                    <TableHead className="py-3 px-4 text-gray-700 font-semibold min-w-[140px]">
                      Date Received
                    </TableHead>
                    <TableHead className="py-3 px-4 text-gray-700 font-semibold min-w-[100px]">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {totalCount > 0 ? (
                    <>
                      {allMedicines.map((item, i) => (
                        <PrescriptionItem
                          key={item.id}
                          item={item}
                          no={i + 1}
                          query={query}
                        />
                      ))}

                      {/* Infinite scroll loading */}
                      {isFetchingNextPage && (
                        <TableRow>
                          <TableCell colSpan={6} className="py-6">
                            <div className="flex items-center justify-center gap-3">
                              <Spinner className="w-5 h-5" />
                              <span className="text-sm text-gray-600">
                                Loading more prescriptions...
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}

                      {/* Infinite scroll trigger */}
                      <TableRow ref={ref}>
                        <TableCell colSpan={6} className="h-10">
                          {/* Empty cell for trigger */}
                        </TableCell>
                      </TableRow>

                      {/* End of list */}
                      {!hasNextPage && totalCount > 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="py-4 text-center border-t"
                          >
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                              <span className="h-px w-8 bg-gray-300"></span>
                              <span>All prescriptions loaded</span>
                              <span className="h-px w-8 bg-gray-300"></span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              Showing {totalCount} prescription
                              {totalCount !== 1 ? "s" : ""}
                            </p>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                            <FileText className="h-8 w-8 text-gray-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              No prescriptions found
                            </h3>
                            <p className="text-gray-500 text-sm">
                              {query
                                ? "Try a different search term"
                                : "No prescription records yet"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Error state */}
                  {!data && !isLoading && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <SWWItem colSpan={6} />
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
          <span className="text-sm font-medium">Loading more...</span>
        </div>
      )}

      {/* Mobile search summary */}
      {query && totalCount > 0 && (
        <div className="md:hidden fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1.5 rounded-full shadow-sm">
          {totalCount} result{totalCount !== 1 ? "s" : ""} for "{query}"
        </div>
      )}
    </div>
  );
};

export default Prescriptions;
