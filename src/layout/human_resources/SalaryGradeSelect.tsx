import { useEffect, useRef, memo } from "react";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";
//db and statement
import { salaryGradeList } from "@/db/statement";

//components and layouts
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";

//interface/props/schema
import type { SalaryGrade } from "@/interface/data";
interface Props {
  lineId: string;
  token: string;
  onChange: (...event: any[]) => void;
  value: string;
}
interface ListPops {
  list: SalaryGrade[];
  lastCursor: string | null;
  hasMore: boolean;
}

const SalaryGradeSelect = ({ lineId, token, onChange }: Props) => {
  const { ref, inView } = useInView();
  const contentRef = useRef<HTMLDivElement>(null);

  const { data, isFetchingNextPage, isFetching, fetchNextPage, hasNextPage } =
    useInfiniteQuery<ListPops>({
      queryKey: ["salaryGrade", lineId],
      queryFn: ({ pageParam }) =>
        salaryGradeList(token, lineId, pageParam as string | null, "10", ""),
      initialPageParam: null,
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.lastCursor : undefined,
    });

  // Trigger fetch when the last item is in view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle scroll for infinite loading
  const handleScroll = () => {
    if (!contentRef.current || !hasNextPage || isFetchingNextPage) return;

    const element = contentRef.current;
    const scrollBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;

    // Load more when within 30px of bottom
    if (scrollBottom < 30) {
      fetchNextPage();
    }
  };

  const allItems = data?.pages.flatMap((item) => item.list) || [];
  const totalItems = allItems.length;
  const hasData = totalItems > 0;
  const isLoading = isFetching && !isFetchingNextPage;

  return (
    <Select onValueChange={(e) => onChange(e)}>
      <SelectTrigger disabled={isLoading}>
        <SelectValue placeholder="Select salary grades" />
      </SelectTrigger>
      <SelectContent
        ref={contentRef}
        onScroll={handleScroll}
        className="max-h-[250px] overflow-auto"
      >
        {/* Loading state for initial load */}
        {isLoading ? (
          <div className="py-6 text-center">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        ) : hasData ? (
          <>
            {allItems.map((item, index) => (
              <SelectItem
                key={item.id}
                value={item.id}
                ref={index === totalItems - 1 ? ref : null}
              >
                {item.grade}
              </SelectItem>
            ))}

            {/* Loading indicator for next page */}
            {isFetchingNextPage && (
              <div className="sticky bottom-0 bg-background py-2 text-center border-t">
                <div className="text-xs text-muted-foreground">
                  Loading more...
                </div>
              </div>
            )}

            {/* No more items indicator */}
            {!hasNextPage && totalItems > 5 && (
              <div className="sticky bottom-0 bg-background py-2 text-center border-t">
                <div className="text-xs text-muted-foreground">
                  {totalItems} items loaded
                </div>
              </div>
            )}
          </>
        ) : (
          <SelectItem value="noData" disabled>
            No Data found
          </SelectItem>
        )}

        {/* Error state */}
        {!isLoading && !hasData && data && (
          <SelectItem value="error" disabled>
            Something went wrong
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};

export default memo(SalaryGradeSelect);
