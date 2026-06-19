import { useState, useEffect } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useAdminAuth } from "@/provider/AdminRouter";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";

import { getAllLines } from "@/db/statements/line";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHeader,
  TableHead,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Modal from "@/components/custom/Modal";
import NewLineForm from "@/layout/admin/NewLineForm";
import LineItem from "@/layout/admin/items/LineItem";

import {
  Plus,
  Search,
  RefreshCw,
  Server,
  Users,
  CircleCheck,
  CircleSlash,
  Loader2,
} from "lucide-react";

import type { LineProps } from "@/interface/data";

interface ListProps {
  list: LineProps[];
  hasMore: boolean;
  lastCursor: string | null;
}

const Stat = ({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Server;
  tone: string;
}) => (
  <div className="rounded-xl border bg-white p-3 flex items-center justify-between">
    <div>
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
    </div>
    <div className={"p-2 rounded-lg " + tone}>
      <Icon className="w-4 h-4" />
    </div>
  </div>
);

const Lines = () => {
  const [onOpen, setOpen] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [query] = useDebounce(searchQuery, 600);
  const { ref, inView } = useInView();
  const auth = useAdminAuth();
  const queryClient = useQueryClient();

  const {
    data,
    isFetchingNextPage,
    isFetching,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["line-list"],
    queryFn: ({ pageParam }) =>
      getAllLines(auth.token as string, pageParam as string | null, "20", query),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    enabled: !!auth.token,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    refetch();
  }, [query, refetch]);

  const allLines = data?.pages.flatMap((page) => page.list) || [];
  const totalLines = allLines.length;
  const activeLines = allLines.filter((l) => l.status === 1).length;
  const inactiveLines = totalLines - activeLines;
  const totalUsers = allLines.reduce(
    (sum, l) => sum + (l._count?.User ?? 0),
    0,
  );

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["line-list"] });
    await refetch();
  };

  return (
    <div className="w-full h-full flex flex-col p-3 md:p-5 gap-3">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-none">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search lines by name or location…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-white"
          />
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
            className="h-9"
          >
            <RefreshCw
              className={"w-4 h-4 mr-2 " + (isFetching ? "animate-spin" : "")}
            />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setOpen(1)}
            className="h-9 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Line
          </Button>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-none">
        <Stat
          label="Total Lines"
          value={totalLines}
          icon={Server}
          tone="bg-blue-100 text-blue-600"
        />
        <Stat
          label="Active"
          value={activeLines}
          icon={CircleCheck}
          tone="bg-emerald-100 text-emerald-600"
        />
        <Stat
          label="Inactive"
          value={inactiveLines}
          icon={CircleSlash}
          tone="bg-red-100 text-red-600"
        />
        <Stat
          label="Total Users"
          value={totalUsers}
          icon={Users}
          tone="bg-purple-100 text-purple-600"
        />
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 rounded-xl border bg-white overflow-auto">
        <Table>
          <TableHeader className="bg-gray-50 sticky top-0 z-10">
            <TableRow>
              <TableHead className="text-[11px] font-semibold text-gray-600">
                Line Name
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-gray-600">
                Location
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-gray-600">
                Status
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-gray-600">
                Created
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-gray-600">
                Users
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-gray-600 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching && allLines.length === 0 ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-gray-200 rounded animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-3.5 w-32 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : allLines.length > 0 ? (
              allLines.map((line) => (
                <LineItem
                  item={line}
                  key={line.id}
                  query={query}
                  token={auth.token as string}
                  userId={auth.userId as string}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="text-center py-14">
                    <div className="mx-auto w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <Server className="w-7 h-7 text-gray-400" />
                    </div>
                    <p className="text-gray-900 font-medium text-sm">
                      No lines found
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {searchQuery
                        ? "Try a different search term"
                        : "Create your first line to get started"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {isFetchingNextPage && (
              <TableRow>
                <TableCell colSpan={6} className="py-3">
                  <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading more lines…
                  </div>
                </TableCell>
              </TableRow>
            )}
            {hasNextPage && !isFetchingNextPage && (
              <TableRow ref={ref}>
                <TableCell colSpan={6} className="py-2 text-center">
                  <span className="text-[10px] text-gray-400">
                    Scroll for more
                  </span>
                </TableCell>
              </TableRow>
            )}
            {!hasNextPage && allLines.length > 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-2 text-center border-t">
                  <span className="text-[10px] text-gray-400">
                    {allLines.length} line{allLines.length === 1 ? "" : "s"} total
                  </span>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Line Modal */}
      <Modal
        title={undefined}
        children={<NewLineForm setOpen={setOpen} onOpen={onOpen} />}
        onOpen={onOpen === 1}
        className="min-w-2xl max-w-2xl overflow-auto"
        setOnOpen={() => setOpen(0)}
        footer={1}
      />
    </div>
  );
};

export default Lines;
