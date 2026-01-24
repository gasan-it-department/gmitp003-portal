import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
import { useEffect } from "react";
import { getDataSetDataSupplies } from "@/db/statement";
import type { SuppliesProps } from "@/interface/data";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Package, PackageX, Check, Loader2 } from "lucide-react";

interface Props {
  id: string;
  selected: SuppliesProps | null;
  setSelected: React.Dispatch<React.SetStateAction<SuppliesProps | null>>;
  query: string;
}

const DataSetItemSelect = ({ id, selected, setSelected, query }: Props) => {
  const auth = useAuth();
  const { ref, inView } = useInView();

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    error,
  } = useInfiniteQuery<{
    hasMore: boolean;
    lastCursor: string | null;
    list: SuppliesProps[];
  }>({
    queryFn: ({ pageParam }) =>
      getDataSetDataSupplies(
        auth.token as string,
        id,
        pageParam as string | null,
        "20",
        query
      ),
    queryKey: ["dataset-items", id, query],
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    enabled: !!id && !!auth.token,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allItems = data?.pages.flatMap((page) => page.list) || [];
  const totalItems = allItems.length;
  const isEmpty = !isLoading && totalItems === 0 && query !== "";
  const showEmptyState = !isLoading && totalItems === 0 && query === "";

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 border rounded-lg"
          >
            <Skeleton className="h-10 w-10 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-4">
        <PackageX className="h-12 w-12 text-destructive/50 mb-4" />
        <p className="text-sm font-medium text-destructive mb-2">
          Failed to load items
        </p>
        <p className="text-sm text-muted-foreground">
          {error.message || "Please try again later"}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Items Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm z-10">
            <TableRow>
              <TableHead className="w-12 p-3 text-xs font-medium">#</TableHead>
              <TableHead className="p-3 text-xs font-medium min-w-48">
                Item
              </TableHead>
              <TableHead className="p-3 text-xs font-medium min-w-32">
                Type
              </TableHead>
              <TableHead className="p-3 text-xs font-medium min-w-24">
                Code
              </TableHead>
              <TableHead className="p-3 text-xs font-medium min-w-32">
                Category
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {showEmptyState ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64">
                  <div className="flex flex-col items-center justify-center text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground font-medium">
                      No items in this dataset
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      This dataset doesn't contain any items
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : isEmpty ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64">
                  <div className="flex flex-col items-center justify-center text-center py-8">
                    <PackageX className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground font-medium">
                      No items found
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Try a different search term
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <>
                {allItems.map((item, i) => {
                  const isSelected = selected?.id === item.id;
                  return (
                    <TableRow
                      key={item.id}
                      onClick={() => setSelected(item)}
                      className={`group cursor-pointer transition-all ${
                        isSelected
                          ? "bg-primary/10 border-l-4 border-l-primary"
                          : "hover:bg-accent/50"
                      }`}
                    >
                      <TableCell className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{i + 1}</span>
                          {isSelected && (
                            <Check className="h-3 w-3 text-primary" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-3">
                        <div className="space-y-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.item}
                          </p>
                          {/* {item.desc && (
                            <p className="text-xs text-muted-foreground truncate">
                              {item.desc}
                            </p>
                          )} */}
                        </div>
                      </TableCell>
                      <TableCell className="p-3">
                        <Badge
                          variant={item.consumable ? "default" : "outline"}
                          className="text-xs"
                        >
                          {item.consumable ? "Consumable" : "Non-Consumable"}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-3">
                        {item.code ? (
                          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                            {item.code}
                          </code>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            N/A
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="p-3">
                        {/* {item.category ? (
                          <Badge variant="secondary" className="text-xs">
                            {item.category}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Uncategorized
                          </span>
                        )} */}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* Infinite Scroll Loader */}
                {isFetchingNextPage && (
                  <TableRow>
                    <TableCell colSpan={5} className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">
                          Loading more items...
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {/* Infinite Scroll Trigger */}
                {hasNextPage && !isFetchingNextPage && (
                  <TableRow ref={ref}>
                    <TableCell colSpan={5} className="p-4">
                      <div className="h-4" />
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer Stats */}
      {allItems.length > 0 && (
        <div className="border-t p-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">
                Showing {totalItems} item{totalItems !== 1 ? "s" : ""}
              </span>
              {selected && (
                <span className="text-primary font-medium">• 1 selected</span>
              )}
            </div>

            {query && (
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                Search: "{query}"
              </span>
            )}

            {isFetching && !isFetchingNextPage && (
              <div className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-muted-foreground">Updating...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* End of Results */}
      {!hasNextPage && allItems.length > 0 && (
        <div className="border-t p-3">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Showing all {totalItems} item{totalItems !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSetItemSelect;
