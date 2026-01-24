import { useState, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";
//utils
import { getInitials } from "@/utils/helper";
// API
import { searchUnits } from "@/db/statements/unit";

// UI Components
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  User,
  Briefcase,
  Building,
  Loader2,
  X,
  Check,
} from "lucide-react";

// Types
import type { Department } from "@/interface/data";

interface Props {
  lineId: string;
  token: string;
  onChange: (...event: any[]) => void;
  value: string | undefined;
}

interface ListProps {
  list: Department[];
  hasMore: boolean;
  lastCursorId: string | null;
}

const SearchUnit = ({ lineId, token, onChange, value }: Props) => {
  const [searchText, setSearchText] = useState("");
  const [debouncedQuery] = useDebounce(searchText, 300);
  const { ref, inView } = useInView();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    isFetching,
    refetch,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["users", lineId, debouncedQuery],
    queryFn: ({ pageParam }) =>
      searchUnits(
        token,
        lineId,
        pageParam as string | null,
        "15",
        debouncedQuery
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursorId : undefined,
    enabled: !!lineId && !!token && !!debouncedQuery.trim(), // Only enable when there's a query
  });
  useEffect(() => {
    refetch();
  }, [refetch, debouncedQuery]);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && debouncedQuery.trim()) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage, debouncedQuery]);

  const allUnits = data?.pages.flatMap((page) => page.list) || [];
  const isEmpty =
    !isLoading && allUnits.length === 0 && debouncedQuery.trim() !== "";

  const handleUserClick = (id: string) => {
    onChange(id);
  };

  const handleClearSearch = () => {
    setSearchText("");
  };

  return (
    <div className="space-y-3 w-full">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search unit by name..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="pl-9 pr-8 w-full"
        />
        {searchText && !isLoading && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        )}
        {isLoading && debouncedQuery.trim() && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Only show results section when there's a query */}
      {debouncedQuery.trim() ? (
        <>
          {/* Results Count */}
          {!isLoading && (
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-muted-foreground">
                {isEmpty
                  ? "No results"
                  : `${allUnits.length} unit${
                      allUnits.length !== 1 ? "s" : ""
                    }`}
              </span>
            </div>
          )}

          {/* Results List */}
          <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1">
            {isFetching && debouncedQuery.trim() ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 p-2">
                  <div className="h-8 w-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-32 bg-muted rounded" />
                    <div className="h-2 w-24 bg-muted rounded" />
                  </div>
                </div>
              ))
            ) : error ? (
              <div className="text-center py-4">
                <p className="text-xs text-destructive">Failed to load units</p>
              </div>
            ) : isEmpty ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No units found</p>
              </div>
            ) : (
              <>
                {allUnits.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleUserClick(item.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors ${
                      value && value === item.id ? " bg-neutral-200" : ""
                    }`}
                  >
                    <Avatar className="h-8 w-8 border">
                      <AvatarFallback className="text-xs bg-primary/10">
                        {getInitials(item.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">
                          {item.name}
                        </p>
                        {value && value === item.id && (
                          <Check size={16} color="green" />
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5"></div>
                    </div>
                  </div>
                ))}

                {/* Infinite Scroll Trigger */}
                {hasNextPage && (
                  <div ref={ref} className="py-2 text-center">
                    {isFetchingNextPage ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-xs text-muted-foreground">
                          Loading...
                        </span>
                      </div>
                    ) : (
                      <div className="h-2" />
                    )}
                  </div>
                )}

                {/* End of Results */}
                {!hasNextPage && allUnits.length > 0 && (
                  <div className="text-center py-2 border-t">
                    <p className="text-xs text-muted-foreground">End of list</p>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      ) : (
        // Initial state - no search
        <div className="text-center py-1">
          <User className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">
            Enter a name to search for units
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchUnit;
