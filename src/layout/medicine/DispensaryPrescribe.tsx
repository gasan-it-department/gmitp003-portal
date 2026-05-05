import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { useInView } from "react-intersection-observer";
//db
import { storageMedList } from "@/db/statement";
//
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Table,
  TableBody,
  TableHeader,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import SWWItem from "../item/SWWItem";
import { toast } from "sonner";
//
import { Search, Package, AlertCircle, Loader2 } from "lucide-react";

//props/interface/schema
import type { Medicine } from "@/interface/data";
import PrescribeMedItem from "./item/PrescribeMedItem";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  lineId: string | undefined;
  storageId: string | undefined;
  token: string | undefined;
  handleAddPresMed: (
    medId: string,
    comment: string,
    quantity: string,
    medName: string,
  ) => void;
}

interface ListProps {
  list: Medicine[];
  lastCursor: string | null;
  hasMore: boolean;
}

const DispensaryPrescribe = ({
  lineId,
  storageId,
  token,
  handleAddPresMed,
}: Props) => {
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 1000);
  const { ref, inView } = useInView();
  const {
    data,
    isFetching,
    refetch,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["medicineList", lineId],
    queryFn: ({ pageParam }) =>
      storageMedList(
        token as string,
        storageId,
        pageParam as string | null,
        "20",
        query,
        lineId as string,
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    refetch();
  }, [query]);

  useEffect(() => {
    if (inView && hasNextPage && !isFetching && !isFetchingNextPage) {
      fetchNextPage().catch((error) => {
        console.error("Error fetching next page:", error);
        toast.error("Failed to load more items");
      });
    }
  }, [inView, hasNextPage, isFetching, isFetchingNextPage, fetchNextPage]);

  const allMedicines = data?.pages.flatMap((page) => page.list) || [];
  const totalCount = allMedicines.length;
  const hasSearchQuery = query.length > 0;

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header - Mobile responsive */}
      <div className="p-3 sm:p-4 border-b bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <p className="text-xs sm:text-sm text-gray-500">
              Browse medications
            </p>
          </div>
          <Badge variant="outline" className="text-[10px] sm:text-xs">
            {totalCount} items
          </Badge>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <InputGroup className="bg-white border shadow-sm">
            <InputGroupAddon>
              <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search medicine..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="placeholder:text-gray-400 text-sm h-9 sm:h-auto"
            />
          </InputGroup>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {isFetching && !isFetchingNextPage ? (
            // Loading skeleton - responsive
            <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="border">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1.5 sm:space-y-2 flex-1">
                        <Skeleton className="h-3.5 sm:h-4 w-32 sm:w-48" />
                        <Skeleton className="h-2.5 sm:h-3 w-24 sm:w-32" />
                      </div>
                      <Skeleton className="h-7 sm:h-8 w-16 sm:w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : allMedicines.length > 0 ? (
            // Medicine list - responsive table with horizontal scroll on mobile
            <div className="p-3 sm:p-4">
              <div className="overflow-x-auto">
                <div className="min-w-[500px] md:min-w-0">
                  <Table>
                    <TableHeader className="bg-gray-50 sticky top-0 z-10">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-12 sm:w-16 text-gray-600 font-semibold text-[10px] sm:text-xs uppercase tracking-wider">
                          No.
                        </TableHead>
                        <TableHead className="text-gray-600 font-semibold text-[10px] sm:text-xs uppercase tracking-wider">
                          Medicine Details
                        </TableHead>
                        <TableHead className="text-gray-600 font-semibold text-[10px] sm:text-xs uppercase tracking-wider">
                          Ref.
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allMedicines.map((item, i) => (
                        <PrescribeMedItem
                          handleAddPresMed={handleAddPresMed}
                          key={item.id}
                          item={item}
                          no={i + 1}
                          query={query}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Loading indicator for infinite scroll */}
              {isFetchingNextPage && (
                <div className="flex items-center justify-center p-4 sm:p-6 border-t">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                    Loading more...
                  </div>
                </div>
              )}

              {/* End of list indicator */}
              <div ref={ref} className="py-4 sm:py-6">
                {!hasNextPage && totalCount > 0 && (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-50 rounded-full border">
                      <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                      <span className="text-xs sm:text-sm text-gray-600">
                        {totalCount} items loaded
                      </span>
                    </div>
                    {hasSearchQuery && (
                      <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5 sm:mt-2">
                        End of search results
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Empty state - responsive
            <div className="flex flex-col items-center justify-center h-full p-6 sm:p-8 text-center">
              <div className="p-3 sm:p-4 bg-gray-100 rounded-full mb-3 sm:mb-4">
                {hasSearchQuery ? (
                  <Search className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                ) : (
                  <Package className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                )}
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-1 sm:mb-2">
                {hasSearchQuery
                  ? "No medications found"
                  : "No medications available"}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 max-w-sm">
                {hasSearchQuery
                  ? `No matches for "${query}"`
                  : "No medications in inventory"}
              </p>
            </div>
          )}

          {/* Error state */}
          {!isFetching && !data && !isFetchingNextPage && (
            <div className="flex flex-col items-center justify-center h-full p-6 sm:p-8">
              <div className="p-3 sm:p-4 bg-red-50 rounded-full mb-3 sm:mb-4">
                <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-400" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-1 sm:mb-2">
                Unable to load medications
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                Issue loading medication list
              </p>
              <SWWItem colSpan={4} />
            </div>
          )}

          <ScrollBar />
        </ScrollArea>
      </div>

      {/* Footer stats - responsive */}
      <div className="p-2 sm:p-3 border-t bg-gray-50">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-gray-600">
              Total: <span className="font-semibold">{totalCount}</span>
            </span>
            {hasSearchQuery && (
              <span className="text-gray-600 hidden sm:inline">
                Search: <span className="font-semibold">"{query}"</span>
              </span>
            )}
          </div>
          {isFetching && (
            <div className="flex items-center gap-1.5 sm:gap-2 text-gray-500">
              <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
              <span className="text-[10px] sm:text-xs">Updating...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DispensaryPrescribe;
