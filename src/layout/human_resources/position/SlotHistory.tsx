import { useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
//
import {
  Table,
  TableBody,
  TableRow,
  TableHead,
  TableHeader,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
//db
import { unitPositionHistory } from "@/db/statements/position";
//icons
import {
  History,
  Calendar,
  Briefcase,
  ChevronDown,
  Loader2,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";

interface Props {
  unitPositionId: string;
  token: string;
}

interface HistoryRow {
  id: string;
  timestamp: string;
  positionSlotId?: string | null;
  /** Derived 1-based slot index injected by the backend. */
  slotNumber?: number | null;
  /** "assigned" | "vacated" — derived backend-side, best-effort. */
  action?: "assigned" | "vacated" | null;
  user?: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
  } | null;
  slot?: {
    id: string;
    occupied?: boolean;
    userId?: string | null;
    designation?: string | null;
  } | null;
}

interface ListProps {
  list: HistoryRow[];
  hasMore: boolean;
  lastCursor: string | null;
}

const SlotHistory = ({ unitPositionId, token }: Props) => {
  const { ref, inView } = useInView({ threshold: 0 });

  const { data, isFetchingNextPage, fetchNextPage, hasNextPage, isFetching } =
    useInfiniteQuery<ListProps>({
      queryKey: ["position-slot-history", unitPositionId],
      queryFn: ({ pageParam }) =>
        unitPositionHistory(
          token,
          unitPositionId,
          pageParam as string | null,
          "20",
        ),
      initialPageParam: null,
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.lastCursor : undefined,
      refetchOnWindowFocus: false,
    });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allItems = data?.pages.flatMap((page) => page.list) || [];

  if (isFetching && !allItems.length) {
    return (
      <div className="w-full h-full p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3.5 w-1/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!allItems.length) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 gap-2">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <History className="h-5 w-5 text-gray-300" />
        </div>
        <p className="text-xs font-medium text-gray-700">No slot history</p>
        <p className="text-[10px] text-gray-500 text-center max-w-[280px]">
          Slot assignments and vacancies will be recorded here.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="bg-gray-50 sticky top-0 z-10">
            <TableRow>
              <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[180px]">
                Employee
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-gray-700 w-24">
                Slot
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-gray-700 w-28">
                Action
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[140px]">
                Designation
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-gray-700 text-right w-36">
                When
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allItems.map((item) => (
              <TableRow key={item.id} className="hover:bg-gray-50/60">
                <TableCell className="text-xs">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700 font-semibold">
                        {initialsFor(item.user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {fullName(item.user)}
                      </p>
                      {item.user?.username && (
                        <p className="text-[10px] text-gray-500 truncate">
                          @{item.user.username}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0">
                    <Briefcase className="w-2.5 h-2.5" />
                    Slot #{item.slotNumber ?? "—"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {item.action === "assigned" ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] gap-1 px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200"
                    >
                      <ArrowDownToLine className="w-2.5 h-2.5" />
                      Assigned
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] gap-1 px-1.5 py-0 bg-rose-50 text-rose-700 border-rose-200"
                    >
                      <ArrowUpFromLine className="w-2.5 h-2.5" />
                      Vacated
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs text-gray-600">
                  {item.slot?.designation && item.slot.designation !== "N/A"
                    ? item.slot.designation
                    : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                    <Calendar className="w-3 h-3" />
                    {formatWhen(item.timestamp)}
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {isFetchingNextPage && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-2">
                  <div className="flex items-center justify-center gap-1.5 text-gray-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-[10px]">Loading more...</span>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {hasNextPage && !isFetchingNextPage && (
              <TableRow ref={ref}>
                <TableCell colSpan={5} className="text-center py-2">
                  <span className="text-[10px] text-gray-400 inline-flex items-center gap-1">
                    <ChevronDown className="h-3 w-3 animate-bounce" />
                    Scroll to load more
                  </span>
                </TableCell>
              </TableRow>
            )}

            {!hasNextPage && allItems.length > 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-2 border-t text-[10px] text-gray-400"
                >
                  Showing all {allItems.length} record
                  {allItems.length !== 1 ? "s" : ""}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const initialsFor = (u?: HistoryRow["user"]) => {
  if (!u) return "?";
  const first = (u.firstName ?? "").trim();
  const last = (u.lastName ?? "").trim();
  const a = first ? first[0] : "";
  const b = last ? last[0] : "";
  const out = `${a}${b}`.toUpperCase();
  return out || (u.username?.[0]?.toUpperCase() ?? "?");
};

const fullName = (u?: HistoryRow["user"]) => {
  if (!u) return "Unknown user";
  const parts = [u.firstName, u.lastName].filter(Boolean);
  return parts.length ? parts.join(" ") : (u.username ?? "Unknown user");
};

const formatWhen = (ts: string) => {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString();
};

export default SlotHistory;
