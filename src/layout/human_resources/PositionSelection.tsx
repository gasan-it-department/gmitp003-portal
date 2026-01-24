import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { Search, Briefcase, Building, Hash } from "lucide-react";
//
import { postSelectionList } from "@/db/statement";
//
import PositionSelectItem from "./item/PositionSelectItem";
import SWWItem from "../item/SWWItem";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

//interfaces/props/schema
import type { UnitPositionProps } from "@/interface/data";
interface Props {
  lineId: string | undefined;
  token: string | undefined;
  userId: string | undefined;
}

interface ListProps {
  list: UnitPositionProps[];
  hasMore: boolean;
  lastCursor: string | null;
}

const PositionSelection = ({ token, lineId, userId }: Props) => {
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 1000);
  const { ref, inView } = useInView();

  const {
    data,
    isFetchingNextPage,
    isFetching,
    refetch,
    hasNextPage,
    fetchNextPage,
    isError,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["positions", lineId, query],
    queryFn: ({ pageParam }) =>
      postSelectionList(
        token as string,
        lineId as string,
        pageParam as string | null,
        "20",
        query,
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
  });

  // Trigger fetch when inView (infinite scroll)
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    refetch();
  }, [query, refetch]);

  const allItems = data?.pages.flatMap((page) => page.list) || [];
  const totalItems = allItems.length;
  const isLoadingInitial =
    isFetching && !isFetchingNextPage && allItems.length === 0;

  return (
    <Card className="w-full h-full flex flex-col border-none shadow-none">
      <CardHeader className="pb-3 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">
                Job Posting Positions
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Select a position to create job post
              </p>
            </div>
          </div>

          <div className="flex-1 max-w-md">
            <InputGroup>
              <InputGroupAddon className="bg-gray-50 border-r-0">
                <Search className="h-4 w-4 text-gray-400" />
              </InputGroupAddon>
              <InputGroupInput
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Search positions, departments, or titles..."
                className="pl-10"
              />
            </InputGroup>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <div className="h-full overflow-auto">
          <div className="min-w-full">
            <div className="sticky top-0 z-10 bg-white border-b">
              <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b">
                <div className="col-span-1 font-semibold text-sm text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  No.
                </div>
                <div className="col-span-5 font-semibold text-sm text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Position Title
                </div>
                <div className="col-span-4 font-semibold text-sm text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Department / Unit
                </div>
                <div className="col-span-2 font-semibold text-sm text-gray-700 uppercase tracking-wider text-center">
                  Available Slots
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {isLoadingInitial ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="px-6 py-4 hover:bg-gray-50/50">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-1">
                        <Skeleton className="h-6 w-8" />
                      </div>
                      <div className="col-span-5">
                        <Skeleton className="h-5 w-full max-w-xs" />
                        <Skeleton className="h-4 w-32 mt-1" />
                      </div>
                      <div className="col-span-4">
                        <Skeleton className="h-5 w-full max-w-sm" />
                        <Skeleton className="h-4 w-24 mt-1" />
                      </div>
                      <div className="col-span-2 text-center">
                        <Skeleton className="h-7 w-12 mx-auto" />
                      </div>
                    </div>
                  </div>
                ))
              ) : allItems.length > 0 ? (
                <>
                  {allItems.map((item, index) => (
                    <div
                      key={`${item.id}-${index}`}
                      ref={index === allItems.length - 1 ? ref : null}
                    >
                      <PositionSelectItem
                        query={query}
                        item={item}
                        no={index + 1}
                        token={token as string}
                        lineId={lineId as string}
                        userId={userId}
                      />
                    </div>
                  ))}

                  {/* Infinite scroll loading */}
                  {isFetchingNextPage && (
                    <div className="px-6 py-6 bg-gray-50/50 border-t">
                      <div className="flex items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                        <span className="text-sm text-gray-600">
                          Loading more positions...
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Intersection observer trigger */}
                  {!isFetchingNextPage && hasNextPage && (
                    <div ref={ref} className="h-2" />
                  )}

                  {/* End of list */}
                  {!hasNextPage && totalItems > 0 && (
                    <div className="px-6 py-4 bg-gray-50 border-t">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Showing{" "}
                          <span className="font-semibold">{totalItems}</span>{" "}
                          position{totalItems !== 1 ? "s" : ""}
                        </div>
                        <Badge variant="outline" className="font-normal">
                          {totalItems} total
                        </Badge>
                      </div>
                    </div>
                  )}
                </>
              ) : isError ? (
                <div className="py-12">
                  <SWWItem colSpan={4} />
                </div>
              ) : (
                <div className="py-16 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <Briefcase className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No positions found
                    </h3>
                    <p className="text-gray-500 mb-6">
                      {query
                        ? `No results for "${query}". Try a different search term.`
                        : "No positions are currently available for job posting."}
                    </p>
                    {query && (
                      <button
                        onClick={() => setText("")}
                        className="text-sm text-primary hover:text-primary/80 font-medium"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Initial loading overlay */}
        {isLoadingInitial && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
            <Card className="w-96 shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Loading Positions
                  </h3>
                  <p className="text-gray-500">
                    Fetching available positions for job posting...
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PositionSelection;
