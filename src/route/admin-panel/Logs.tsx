import { useState, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";

import { useAdminAuth } from "@/provider/AdminRouter";
import { getAdminLogs } from "@/db/statement";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollText, Search, Loader2, Inbox } from "lucide-react";

// Mirror of LOG_TYPES on the backend (adminLogsController).
const LOG_TYPES: { key: string; label: string }[] = [
  { key: "hr", label: "Human Resources" },
  { key: "medicine", label: "Medicine" },
  { key: "document", label: "Documents" },
  { key: "activity", label: "Activity" },
  { key: "inventory", label: "Inventory" },
  { key: "inventoryAccess", label: "Inventory Access" },
  { key: "admin", label: "Admin" },
  { key: "message", label: "Messages (SMS)" },
  { key: "record", label: "User Records" },
  { key: "mobileUpload", label: "Mobile Uploads" },
];

interface LogItem {
  id: string;
  timestamp: string | null;
  action: string;
  description: string;
  actor: string;
  line: string | null;
}
interface LoadProps {
  list: LogItem[];
  lastCursor: string | null;
  hasMore: boolean;
}

const Logs = () => {
  const admin = useAdminAuth();
  const { ref, inView } = useInView();

  const [type, setType] = useState("hr");
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 600);

  const {
    data,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery<LoadProps>({
    queryKey: ["admin-logs", type, query],
    queryFn: ({ pageParam }) =>
      getAdminLogs(admin.token, type, pageParam as string | null, 25, query),
    getNextPageParam: (last) => (last.hasMore ? last.lastCursor : undefined),
    initialPageParam: null,
    enabled: !!admin.token,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Reset list when type/search changes.
  useEffect(() => {
    refetch();
  }, [type, query, refetch]);

  const rows = data?.pages.flatMap((p) => p.list) ?? [];
  const activeLabel =
    LOG_TYPES.find((t) => t.key === type)?.label ?? "Logs";

  const fmt = (ts: string | null) =>
    ts
      ? new Date(ts).toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  return (
    <div className="w-full h-full p-3 md:p-4 flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3 flex-none">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-indigo-600">
            <ScrollText className="h-3.5 w-3.5 text-white" />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-8 text-xs w-52 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOG_TYPES.map((t) => (
                <SelectItem key={t.key} value={t.key} className="text-xs">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={`Search ${activeLabel} logs...`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="pl-9 h-8 text-xs bg-white"
          />
        </div>
        <Badge variant="secondary" className="text-[10px] sm:ml-auto">
          {rows.length} shown
        </Badge>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto rounded-lg border bg-white">
        <Table>
          <TableHeader className="bg-gray-50 sticky top-0 z-10">
            <TableRow>
              <TableHead className="text-[11px] font-semibold text-gray-700 w-44">
                Timestamp
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-gray-700 w-40">
                User
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-gray-700 w-32">
                Action
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-gray-700">
                Details
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-gray-700 w-36">
                Line
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching && rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs">Loading {activeLabel} logs…</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Inbox className="h-8 w-8 text-gray-300" />
                    <p className="text-xs font-medium text-gray-600">
                      No {activeLabel} logs
                    </p>
                    {query && (
                      <p className="text-[11px]">No matches for "{query}".</p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id} className="hover:bg-gray-50/60">
                  <TableCell className="text-[11px] text-gray-500 whitespace-nowrap">
                    {fmt(r.timestamp)}
                  </TableCell>
                  <TableCell className="text-[11px] font-medium text-gray-800">
                    {r.actor}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-700 border-indigo-200"
                    >
                      {r.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[11px] text-gray-700 max-w-md">
                    <span className="line-clamp-2">{r.description || "—"}</span>
                  </TableCell>
                  <TableCell className="text-[11px] text-gray-500">
                    {r.line ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            )}

            {hasNextPage && (
              <TableRow ref={ref}>
                <TableCell colSpan={5} className="py-3 text-center">
                  {isFetchingNextPage ? (
                    <span className="inline-flex items-center gap-2 text-gray-400 text-[11px]">
                      <Loader2 className="h-3 w-3 animate-spin" /> Loading more…
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400">
                      Scroll for more
                    </span>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Logs;
