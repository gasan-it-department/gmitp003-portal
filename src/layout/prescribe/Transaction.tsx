import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";
//
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, ClipboardList, UserRound, CalendarDays, Pill } from "lucide-react";
//
import { prescribeTransaction } from "@/db/statements/prescription";
import type { Prescription } from "@/interface/data";

interface Props {
  token: string;
  lineId: string;
}

interface ListProps {
  list: Prescription[];
  hasMore: boolean;
  lastCursor: string | null;
}

const statusLabel: Record<number, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  0: { label: "Pending", variant: "secondary" },
  1: { label: "Processing", variant: "default" },
  2: { label: "Dispensed", variant: "outline" },
};

const PrescribeTransactionList = ({ token, lineId }: Props) => {
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch] = useDebounce(searchText, 400);

  const {
    data,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["prescribe-transaction", lineId, debouncedSearch],
    queryFn: ({ pageParam }) =>
      prescribeTransaction(token, lineId, pageParam as string | null, "20", debouncedSearch || undefined),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    refetchOnWindowFocus: false,
  });

  const { ref } = useInView({
    threshold: 0.5,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
  });

  const allItems = data?.pages.flatMap((p) => p.list) ?? [];

  return (
    <div className="w-full h-full flex flex-col bg-white">

      {/* Toolbar */}
      <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2 flex-shrink-0">
        <div>
          <p className="text-xs font-semibold text-gray-800">Transactions</p>
          <p className="text-[10px] text-gray-500 leading-none mt-0.5">
            {allItems.length} record{allItems.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="relative w-56">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
          <Input
            placeholder="Search name or ref #..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-7 h-7 text-[11px]"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto">
        {isFetching && allItems.length === 0 ? (
          <div className="flex items-center justify-center py-10 gap-1.5 text-gray-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="text-xs">Loading transactions...</span>
          </div>
        ) : allItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center p-4">
            <ClipboardList className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-xs font-medium text-gray-500">No transactions yet</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {debouncedSearch ? "Try a different search term" : "Prescriptions will appear here once submitted"}
            </p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="grid grid-cols-[2rem_1fr_6rem_5rem_5rem] gap-2 px-3 py-1.5 border-b bg-gray-50 sticky top-0 z-10">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">#</span>
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Patient</span>
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Ref. No.</span>
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Date</span>
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Status</span>
            </div>

            <div className="divide-y divide-gray-100">
              {allItems.map((item, index) => {
                const status = statusLabel[item.status] ?? statusLabel[0];
                const date = new Date(item.timestamp).toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
                const medCount = item._count?.presMed ?? item.presMed?.length ?? 0;

                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-[2rem_1fr_6rem_5rem_5rem] gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors items-center"
                  >
                    {/* No. */}
                    <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-medium text-gray-500">
                      {index + 1}
                    </div>

                    {/* Patient info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <UserRound className="h-2.5 w-2.5 text-blue-600" />
                        </div>
                        <p className="text-xs font-medium text-gray-800 truncate">
                          {item.lastname}, {item.firstname}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 ml-6 flex-wrap">
                        {item.age && (
                          <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                            <CalendarDays className="h-2.5 w-2.5" />{item.age} yrs
                          </span>
                        )}
                        {medCount > 0 && (
                          <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                            <Pill className="h-2.5 w-2.5" />{medCount} med{medCount !== 1 ? "s" : ""}
                          </span>
                        )}
                        {item.patient && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 leading-none">
                            Linked
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Ref number */}
                    <code className="text-[10px] font-mono text-blue-700 font-semibold truncate">
                      {item.refNumber}
                    </code>

                    {/* Date */}
                    <p className="text-[10px] text-gray-500">{date}</p>

                    {/* Status */}
                    <Badge variant={status.variant} className="text-[10px] px-1.5 py-0 w-fit">
                      {status.label}
                    </Badge>
                  </div>
                );
              })}
            </div>

            {/* Infinite scroll trigger */}
            {hasNextPage && (
              <div ref={ref} className="flex items-center justify-center py-3 gap-1.5">
                {isFetchingNextPage && (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                    <span className="text-[10px] text-gray-400">Loading more...</span>
                  </>
                )}
              </div>
            )}

            {!hasNextPage && allItems.length > 0 && (
              <div className="py-3 text-center">
                <p className="text-[10px] text-gray-400">All {allItems.length} records loaded</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PrescribeTransactionList;
