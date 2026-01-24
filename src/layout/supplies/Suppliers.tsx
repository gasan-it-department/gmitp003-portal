import { useState, useEffect } from "react";
import { getSuppliers } from "@/db/statement";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { useInView } from "react-intersection-observer";
import { Input } from "@/components/ui/input";
import { Search, Building, Loader2, X } from "lucide-react";
import type { SupplierProps, ProtectedRouteProps } from "@/interface/data";

interface Props {
  onChange: (...event: any[]) => void;
  lineId: string | undefined;
  auth: ProtectedRouteProps;
  handleResetSupplier?: () => void;
}

interface ListProps {
  list: SupplierProps[];
  hasMore: boolean;
  lastCursor: string | null;
}

const Suppliers = ({ onChange, lineId, auth, handleResetSupplier }: Props) => {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 300);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { ref, inView } = useInView();

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["suppliers", lineId, debouncedQuery],
    queryFn: ({ pageParam }) =>
      getSuppliers(
        auth.token as string,
        lineId as string,
        pageParam as string | null,
        "10",
        debouncedQuery
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    enabled: !!debouncedQuery.trim() && !!lineId && !!auth.token,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    refetch();
  }, [debouncedQuery, refetch]);

  const allSuppliers = data?.pages.flatMap((page) => page.list) || [];
  const hasResults = allSuppliers.length > 0;
  const isEmpty =
    !isLoading && debouncedQuery.trim() && allSuppliers.length === 0;

  useEffect(() => {
    if (!isEmpty) {
      onChange(debouncedQuery);
    }
  }, [debouncedQuery]);
  const handleSelectSupplier = (supplier: SupplierProps) => {
    setQuery(supplier.name);
    setSelectedId(supplier.id);
    onChange(supplier.id);
  };

  const handleClear = () => {
    setQuery("");
    setSelectedId(null);
    onChange("");
    handleResetSupplier && handleResetSupplier();
  };

  return (
    <div className="space-y-2">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
          }}
          placeholder="Search suppliers..."
          className="pl-9 pr-8"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        )}
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Results */}
      {debouncedQuery.trim() && (
        <div className="border rounded-md shadow-sm">
          {/* Results Header */}
          <div className="px-3 py-2 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {isLoading
                  ? "Searching..."
                  : isEmpty
                  ? "No suppliers found"
                  : `${allSuppliers.length} supplier${
                      allSuppliers.length !== 1 ? "s" : ""
                    }`}
              </span>
              {selectedId && (
                <span className="text-xs text-primary">Selected</span>
              )}
            </div>
          </div>

          {/* Results List */}
          <div className="max-h-48 overflow-y-auto">
            {isEmpty ? (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  No suppliers found for "{debouncedQuery}"
                </p>
              </div>
            ) : error ? (
              <div className="p-3">
                <p className="text-xs text-destructive">
                  Failed to load suppliers
                </p>
              </div>
            ) : (
              <>
                {allSuppliers.map((supplier, index) => (
                  <button
                    key={supplier.id}
                    onClick={(e) => {
                      e.preventDefault();
                      handleSelectSupplier(supplier);
                    }}
                    className={`w-full p-3 text-left border-b last:border-b-0 hover:bg-accent transition-colors ${
                      selectedId === supplier.id ? "bg-primary/10" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {index + 1}. {supplier.name}
                        </p>
                      </div>
                      {selectedId === supplier.id && (
                        <div className="h-2 w-2 rounded-full bg-primary"></div>
                      )}
                    </div>
                  </button>
                ))}

                {/* Infinite Scroll Loader */}
                {isFetching ||
                  (isFetchingNextPage && (
                    <div className="p-3 border-b">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-xs text-muted-foreground">
                          Loading more...
                        </span>
                      </div>
                    </div>
                  ))}

                {/* Infinite Scroll Trigger */}
                {hasNextPage && !isFetchingNextPage && (
                  <div ref={ref} className="h-2"></div>
                )}

                {/* End of Results */}
                {!hasNextPage && hasResults && (
                  <div className="p-2 border-t">
                    <p className="text-xs text-center text-muted-foreground">
                      End of list
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Loading State */}
          {isLoading && !isFetchingNextPage && (
            <div className="p-3">
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-muted"></div>
                    <div className="h-3 w-32 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected Supplier Info */}
      {selectedId && !debouncedQuery.trim() && (
        <div className="text-sm p-2 bg-primary/5 rounded border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="h-3 w-3" />
              <span className="font-medium">{query}</span>
            </div>
            <button
              onClick={handleClear}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
