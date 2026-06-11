import { memo } from "react";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";

import { salaryGradeList } from "@/db/statement";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

import type { SalaryGrade } from "@/interface/data";

interface Props {
  lineId: string;
  token: string;
  onChange: (...event: any[]) => void;
  value?: string;
  disabled?: boolean;
  className?: string;
}

interface ListProps {
  list: SalaryGrade[];
  lastCursor: string | null;
  hasMore: boolean;
}

const SalaryGradeSelect = ({
  lineId,
  token,
  onChange,
  value,
  disabled,
  className,
}: Props) => {
  const { data, isFetchingNextPage, isFetching, fetchNextPage, hasNextPage } =
    useInfiniteQuery<ListProps>({
      queryKey: ["salaryGrade", lineId],
      queryFn: ({ pageParam }) =>
        salaryGradeList(token, lineId, pageParam as string | null, "10", ""),
      initialPageParam: null,
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.lastCursor : undefined,
      enabled: !!token && !!lineId,
      refetchOnWindowFocus: false,
    });

  const { ref } = useInView({
    threshold: 0.5,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
  });

  const items = data?.pages.flatMap((p) => p.list) ?? [];
  const totalItems = items.length;
  const hasData = totalItems > 0;
  const isLoadingInitial = isFetching && !isFetchingNextPage && totalItems === 0;

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={`h-8 text-xs ${className ?? ""}`}>
        <SelectValue placeholder="Select salary grade" />
      </SelectTrigger>
      <SelectContent className="max-h-[260px]">
        {isLoadingInitial ? (
          <div className="py-3 flex items-center justify-center gap-1.5 text-gray-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-[10px]">Loading...</span>
          </div>
        ) : hasData ? (
          <>
            {items.map((item) => (
              <SelectItem key={item.id} value={item.id} className="text-xs">
                <div className="flex items-center justify-between gap-3 w-full">
                  <span className="font-mono">{item.grade}</span>
                  <span className="text-[10px] text-gray-500">
                    ₱{item.amount.toLocaleString("en-PH")}
                  </span>
                </div>
              </SelectItem>
            ))}

            {/* Infinite-scroll trigger (rendered last) */}
            {hasNextPage && <div ref={ref} className="h-1" />}

            {isFetchingNextPage && (
              <div className="sticky bottom-0 bg-white border-t py-1.5 flex items-center justify-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                <span className="text-[10px] text-gray-500">Loading more...</span>
              </div>
            )}

            {!hasNextPage && totalItems > 5 && (
              <div className="sticky bottom-0 bg-white border-t py-1 text-center">
                <span className="text-[10px] text-gray-400">
                  All {totalItems} grades loaded
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="py-3 text-center">
            <span className="text-[10px] text-gray-400">
              No salary grades available
            </span>
          </div>
        )}
      </SelectContent>
    </Select>
  );
};

export default memo(SalaryGradeSelect);
