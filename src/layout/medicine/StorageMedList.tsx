import { useState, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";
import { useNavigate } from "react-router";
import { getStorageMeds } from "@/db/statement";

import {
  Table,
  TableCell,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
import { Card } from "@/components/ui/card";
import StorageMedItem from "./item/StorageMedItem";

import {
  //Pen,
  Search,
  // OctagonAlert,
  // EllipsisVertical,
  ListFilterPlus,
  PenLine,
} from "lucide-react";

import type { MedicineStock, ProtectedRouteProps } from "@/interface/data";

interface Props {
  storageId: string | undefined;
  auth: ProtectedRouteProps;
  lineId: string;
}

interface ListProps {
  list: MedicineStock[];
  lastCursor: string | null;
  hasMore: boolean;
}

const StorageMedList = ({ storageId, auth, lineId }: Props) => {
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 1000);
  const nav = useNavigate();
  const { inView, ref } = useInView();

  const {
    data,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["medStorage-list", storageId],
    queryFn: ({ pageParam }) =>
      getStorageMeds(
        auth.token as string,
        storageId as string,
        pageParam as string | null,
        "20",
        query,
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    enabled: !!storageId,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetching && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetching, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    refetch();
  }, [query, refetch]);

  const allMedicines = data?.pages.flatMap((page) => page.list) || [];
  const totalCount = allMedicines.length;

  return (
    <div className="w-full h-full flex flex-col p-4 gap-4">
      {/* Header Section */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <h1 className="text-2xl font-bold text-gray-800">Medicine Stock</h1>
            <p className="text-gray-600">Total: {totalCount} items</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <InputGroup className="flex-1 md:w-64 bg-white">
              <InputGroupAddon>
                <Search className="w-4 h-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search medicines..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="text-sm"
              />
            </InputGroup>

            <div className=" w-auto flex gap-2">
              <Button onClick={() => nav(`update`)} size="sm" variant="outline">
                <ListFilterPlus />
                Filter
              </Button>
              <Button onClick={() => nav(`update`)} size="sm">
                <PenLine />
                Update
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Table Section */}
      <Card className="flex-1 overflow-hidden">
        <div className="overflow-auto h-full">
          <Table>
            <TableHeader className="bg-gray-50 sticky top-0">
              <TableRow>
                <TableHead className="font-semibold text-gray-700">
                  No
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Serial Number
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Label
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Stock
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  UoM
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Expiration
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isFetching && !data ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="text-gray-600">Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : allMedicines.length > 0 ? (
                allMedicines.map((item, i) => (
                  <StorageMedItem
                    key={item.id}
                    item={item}
                    no={i + 1}
                    onMultiSelect={false}
                    lineId={lineId}
                    auth={auth}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-12 h-12 text-gray-400" />
                      <p className="text-gray-700 font-medium">
                        No items found
                      </p>
                      <p className="text-gray-500 text-sm">
                        {query
                          ? "Try a different search"
                          : "No medicines in storage"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {/* Infinite scroll trigger */}
              {hasNextPage && (
                <TableRow ref={ref}>
                  <TableCell colSpan={7} className="text-center py-4">
                    {isFetchingNextPage ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-gray-600">
                          Loading more...
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">
                        Scroll to load more
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )}

              {!hasNextPage && allMedicines.length > 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 border-t">
                    <span className="text-sm text-gray-500">
                      Showing all {allMedicines.length} items
                    </span>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default StorageMedList;
