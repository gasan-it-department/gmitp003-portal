import { useEffect, useRef, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
//
import { linePositions } from "@/db/statement";
//
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
//
import type { Position } from "@/interface/data";

interface Props {
  id: string;
  value: string;
  onChange: (...event: any[]) => void;
  token: string;
}

interface ListProps {
  list: Position[];
  hasMore: boolean;
  lastCursor: string | null;
}

const PositionSelect = ({ id, value, onChange, token }: Props) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const { data, isFetchingNextPage, isFetching, hasNextPage, fetchNextPage } =
    useInfiniteQuery<ListProps>({
      queryKey: ["positions", id],
      queryFn: ({ pageParam }) =>
        linePositions(token, id, pageParam as string | null, "10", ""),
      initialPageParam: null,
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.lastCursor : undefined,
    });
  console.log({ data });

  // Scroll handler for infinite loading
  const handleScroll = useCallback(() => {
    if (!contentRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const scrollPosition = scrollTop + clientHeight;

    // Load more when 80% scrolled
    if (
      scrollPosition >= scrollHeight * 0.8 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Attach scroll event listener
  useEffect(() => {
    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (contentElement) {
        contentElement.removeEventListener("scroll", handleScroll);
      }
    };
  }, [handleScroll]);

  const allPositions = data?.pages.flatMap((page) => page.list) || [];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select a position" />
      </SelectTrigger>
      <SelectContent
        ref={contentRef}
        className="max-h-60"
        onScroll={handleScroll}
      >
        {/* Loading state for initial load */}
        {isFetching && allPositions.length === 0 && (
          <div className="flex items-center justify-center py-2">
            <Spinner className="w-4 h-4 mr-2" />
            <span className="text-sm text-gray-500">Loading positions...</span>
          </div>
        )}

        {/* Empty state */}
        {!isFetching && allPositions.length === 0 && (
          <SelectItem value="empty" disabled>
            No positions found
          </SelectItem>
        )}

        {/* Positions list */}
        {allPositions.map((position) => (
          <SelectItem key={position.id} value={position.id}>
            {position.name}
          </SelectItem>
        ))}

        {/* Loading more indicator */}
        {isFetchingNextPage && (
          <div className="flex items-center justify-center py-2">
            <Spinner className="w-3 h-3 mr-2" />
            <span className="text-xs text-gray-500">
              Loading more positions...
            </span>
          </div>
        )}

        {/* End of list indicator */}
        {!hasNextPage && allPositions.length > 0 && (
          <div className="text-center py-2 border-t">
            <span className="text-xs text-gray-400">All positions loaded</span>
          </div>
        )}
      </SelectContent>
    </Select>
  );
};

export default PositionSelect;
