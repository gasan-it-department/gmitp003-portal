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
  TableCell,
} from "@/components/ui/table";
import SWWItem from "../item/SWWItem";
import { searchedChar } from "@/utils/element";
import { toast } from "sonner";
//
import { Search, Filter, Package, AlertCircle, Loader2 } from "lucide-react";

//props/interface/schema
import type { MedicineStock } from "@/interface/data";
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
    medName: string
  ) => void;
}

interface ListProps {
  list: MedicineStock[];
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
        lineId as string
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
        console.error("Error fetching next page:", error);
        toast.error("Failed to load more items");
      });
    }
  }, [inView, hasNextPage, isFetching, isFetchingNextPage, fetchNextPage]);

  // Calculate flattened data once
  const allMedicines = data?.pages.flatMap((page) => page.list) || [];
  const totalCount = allMedicines.length;
  const hasSearchQuery = query.length > 0;

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Medication Inventory
              </h2>
              <p className="text-sm text-gray-500">
                Browse and select available medications
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {totalCount} items
          </Badge>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <InputGroup className="bg-white border shadow-sm">
            <InputGroupAddon>
              <Search className="h-4 w-4 text-gray-400" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search by medicine name, brand, or code..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="placeholder:text-gray-400"
            />
            {hasSearchQuery && (
              <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                <Badge variant="secondary" className="text-xs">
                  Searching...
                </Badge>
              </div>
            )}
          </InputGroup>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {isFetching && !isFetchingNextPage ? (
            // Initial loading skeleton
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : allMedicines.length > 0 ? (
            // Medicine list
            <div className="p-4">
              <Table>
                <TableHeader className="bg-gray-50 sticky top-0 z-10">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-16 text-gray-600 font-semibold text-xs uppercase tracking-wider">
                      No.
                    </TableHead>
                    <TableHead className="text-gray-600 font-semibold text-xs uppercase tracking-wider">
                      Medicine Details
                    </TableHead>
                    <TableHead className="text-gray-600 font-semibold text-xs uppercase tracking-wider">
                      Stock Status
                    </TableHead>
                    <TableHead className="w-32 text-gray-600 font-semibold text-xs uppercase tracking-wider">
                      Action
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

              {/* Loading indicator for infinite scroll */}
              {isFetchingNextPage && (
                <div className="flex items-center justify-center p-6 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading more medications...
                  </div>
                </div>
              )}

              {/* End of list indicator */}
              <div ref={ref} className="py-6">
                {!hasNextPage && totalCount > 0 && (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        All {totalCount} medications loaded
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {hasSearchQuery
                        ? "End of search results"
                        : "End of inventory list"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Empty state
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                {hasSearchQuery ? (
                  <Search className="h-8 w-8 text-gray-400" />
                ) : (
                  <Package className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                {hasSearchQuery
                  ? "No medications found"
                  : "No medications available"}
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                {hasSearchQuery
                  ? `No medications match "${query}". Try a different search term.`
                  : "There are currently no medications in the inventory. Please check back later."}
              </p>
            </div>
          )}

          {/* Error state */}
          {!isFetching && !data && !isFetchingNextPage && (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <div className="p-4 bg-red-50 rounded-full mb-4">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Unable to load medications
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                There was an issue loading the medication list.
              </p>
              <SWWItem colSpan={4} />
            </div>
          )}

          <ScrollBar />
        </ScrollArea>
      </div>

      {/* Footer stats */}
      <div className="p-3 border-t bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              Total: <span className="font-semibold">{totalCount}</span>
            </span>
            {hasSearchQuery && (
              <span className="text-gray-600">
                Search: <span className="font-semibold">"{query}"</span>
              </span>
            )}
          </div>
          {isFetching && (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Updating...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DispensaryPrescribe;
