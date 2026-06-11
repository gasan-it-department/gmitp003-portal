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
//db
import { salaryGradeHistory } from "@/db/statements/salaryGrade";
//icons
import {
  History,
  Calendar,
  Loader2,
  ChevronDown,
  Banknote,
  User as UserIcon,
} from "lucide-react";

interface Props {
  salaryGradeId: string;
  token: string;
}

interface HistoryRow {
  id: string;
  amount: number;
  effectiveDate: string;
  createdAt: string;
  userId: string;
  changedBy?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
  } | null;
}

interface ListProps {
  list: HistoryRow[];
  hasMore: boolean;
  lastCursor: string | null;
}

const SalaryGradeHistoryTab = ({ salaryGradeId, token }: Props) => {
  const { ref, inView } = useInView({ threshold: 0 });

  const { data, isFetchingNextPage, fetchNextPage, hasNextPage, isFetching } =
    useInfiniteQuery<ListProps>({
      queryKey: ["salary-grade-history", salaryGradeId],
      queryFn: ({ pageParam }) =>
        salaryGradeHistory(
          token,
          salaryGradeId,
          pageParam as string | null,
          "20",
        ),
      initialPageParam: null,
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.lastCursor : undefined,
      refetchOnWindowFocus: false,
    });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allItems = data?.pages.flatMap((p) => p.list) ?? [];

  if (isFetching && !allItems.length) {
    return (
      <div className="w-full h-full p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-24" />
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
        <p className="text-xs font-medium text-gray-700">No value history</p>
        <p className="text-[10px] text-gray-500 text-center max-w-[280px]">
          Every time this grade's amount is updated, the change is recorded
          here.
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
              <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[140px]">
                Amount
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[160px]">
                Changed by
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-gray-700 w-40">
                Effective date
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-gray-700 text-right w-36">
                Recorded
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allItems.map((item) => (
              <TableRow key={item.id} className="hover:bg-gray-50/60">
                <TableCell>
                  <Badge
                    variant="outline"
                    className="text-[11px] gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold"
                  >
                    <Banknote className="w-3 h-3" />₱
                    {item.amount.toLocaleString("en-PH")}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-gray-700">
                  <div className="flex items-center gap-1.5">
                    <UserIcon className="w-3 h-3 text-gray-400" />
                    {changedByName(item.changedBy)}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-gray-600">
                  {formatDate(item.effectiveDate)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                    <Calendar className="w-3 h-3" />
                    {formatWhen(item.createdAt)}
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {isFetchingNextPage && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-2">
                  <div className="flex items-center justify-center gap-1.5 text-gray-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-[10px]">Loading more...</span>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {hasNextPage && !isFetchingNextPage && (
              <TableRow ref={ref}>
                <TableCell colSpan={4} className="text-center py-2">
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
                  colSpan={4}
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

const changedByName = (u?: HistoryRow["changedBy"]) => {
  if (!u) return "System";
  const parts = [u.firstName, u.lastName].filter(Boolean);
  return parts.length ? parts.join(" ") : (u.username ?? "System");
};

const formatDate = (ts: string) => {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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

export default SalaryGradeHistoryTab;
