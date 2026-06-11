import { useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";
import { useSearchParams } from "react-router";

import { roomDocumentRequest } from "@/db/statements/document";

import {
  Table,
  TableBody,
  TableHeader,
  TableHead,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";

import RoomRequestItem from "../item/RoomRequestItem";

import {
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Loader2,
} from "lucide-react";

import type { RoomRegistration } from "@/interface/data";

interface Props {
  token: string;
  userId: string;
  lineId: string;
}

interface ListProps {
  list: RoomRegistration[];
  hasMore: boolean;
  lastCursor: string | null;
}

const Request = ({ token, userId, lineId }: Props) => {
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 400);
  const [params, setParams] = useSearchParams({ status: "all" });
  const queryClient = useQueryClient();
  const currentStatus = params.get("status") || "all";

  const {
    data,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["room-request", lineId, query, currentStatus],
    queryFn: ({ pageParam }) =>
      roomDocumentRequest(
        token,
        lineId,
        pageParam as string | null,
        "20",
        query,
        currentStatus,
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    enabled: !!token && !!lineId,
    refetchOnWindowFocus: false,
  });

  const { ref } = useInView({
    threshold: 0.5,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetching && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
  });

  const handleChangeParams = (key: string, value: string) => {
    setParams(
      (prev) => {
        prev.set(key, value);
        return prev;
      },
      { replace: true },
    );
  };

  const items = data?.pages.flatMap((page) => page.list) || [];
  const stats = {
    pending: items.filter((it) => it.status === 0).length,
    approved: items.filter((it) => it.status === 1).length,
    rejected: items.filter((it) => it.status === 2).length,
  };

  const statTiles: { label: string; value: number; icon: React.ReactNode; cls: string }[] = [
    {
      label: "Pending",
      value: stats.pending,
      icon: <Clock className="h-3 w-3 text-white" />,
      cls: "from-amber-500 to-amber-600",
    },
    {
      label: "Approved",
      value: stats.approved,
      icon: <CheckCircle className="h-3 w-3 text-white" />,
      cls: "from-emerald-500 to-emerald-600",
    },
    {
      label: "Rejected",
      value: stats.rejected,
      icon: <AlertCircle className="h-3 w-3 text-white" />,
      cls: "from-red-500 to-red-600",
    },
  ];

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">

      {/* Stats + toolbar */}
      <div className="bg-white border-b px-3 py-2 flex-shrink-0 space-y-2">
        <div className="grid grid-cols-3 gap-2">
          {statTiles.map((t) => (
            <div
              key={t.label}
              className="border rounded-md bg-white p-2 overflow-hidden"
            >
              <div
                className={`h-0.5 bg-gradient-to-r ${t.cls} rounded-full mb-1.5`}
              />
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-medium text-gray-600">
                  {t.label}
                </p>
                <div className={`p-1 rounded bg-gradient-to-br ${t.cls}`}>
                  {t.icon}
                </div>
              </div>
              <p className="text-base font-bold text-gray-900 leading-none">
                {t.value}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <InputGroup className="bg-white flex-1 max-w-sm">
            <InputGroupAddon>
              <Search className="h-3 w-3 text-gray-400" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search by name, email, or address..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="h-7 text-[11px]"
            />
          </InputGroup>
          <Select
            value={currentStatus}
            onValueChange={(e) => handleChangeParams("status", e)}
          >
            <SelectTrigger className="h-7 w-36 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                All statuses
              </SelectItem>
              <SelectItem value="0" className="text-xs">
                Pending
              </SelectItem>
              <SelectItem value="1" className="text-xs">
                Approved
              </SelectItem>
              <SelectItem value="2" className="text-xs">
                Rejected
              </SelectItem>
            </SelectContent>
          </Select>
          <span className="ml-auto text-[10px] text-gray-500">
            {items.length} request{items.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto p-3">
        <div className="border rounded-lg bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="text-[10px] font-semibold text-gray-700 w-24">
                  Request ID
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[160px]">
                  User
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[180px]">
                  Address
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[100px]">
                  Line
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 text-center w-24">
                  Status
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[120px]">
                  Submitted
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 text-right w-20">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <p className="text-[10px] font-medium text-red-600">
                        Failed to load requests
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {(error as any)?.message ?? "Try again later."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isFetching && items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center gap-1.5 text-gray-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span className="text-[10px]">Loading requests...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-gray-300" />
                      </div>
                      <p className="text-xs font-medium text-gray-700">
                        No room requests found
                      </p>
                      <p className="text-[10px] text-gray-500 max-w-[260px]">
                        {query
                          ? `Nothing matches "${query}".`
                          : "Pending registrations from users will appear here."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <RoomRequestItem
                    key={item.id}
                    item={item}
                    token={token}
                    lineId={lineId}
                    userId={userId}
                    queryClient={queryClient}
                  />
                ))
              )}

              {hasNextPage && (
                <TableRow ref={ref}>
                  <TableCell colSpan={7} className="text-center py-2">
                    {isFetchingNextPage ? (
                      <div className="flex items-center justify-center gap-1.5 text-gray-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-[10px]">Loading more...</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400">
                        Scroll to load more
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )}
              {!hasNextPage && items.length > 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-2 border-t">
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0"
                    >
                      Showing all {items.length}
                    </Badge>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default Request;
