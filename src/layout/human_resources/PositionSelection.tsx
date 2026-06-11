import { useState } from "react";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import {
  Search,
  Briefcase,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { postSelectionList } from "@/db/statement";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

import PositionSelectItem from "./item/PositionSelectItem";

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
  const [query] = useDebounce(text, 500);

  const {
    data,
    isFetchingNextPage,
    isFetching,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
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

  const items = data?.pages.flatMap((p) => p.list) || [];

  return (
    <div className="w-full h-full border rounded-lg bg-white overflow-hidden flex flex-col">

      {/* Toolbar */}
      <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Briefcase className="h-3 w-3 text-blue-500" />
          <div className="min-w-0">
            <h2 className="text-xs font-semibold text-gray-800 truncate">
              Available Positions
            </h2>
            <p className="text-[10px] text-gray-500 leading-none mt-0.5">
              {items.length} position{items.length !== 1 ? "s" : ""} loaded
            </p>
          </div>
        </div>
        <InputGroup className="bg-white max-w-xs flex-1">
          <InputGroupAddon>
            <Search className="h-3 w-3 text-gray-400" />
          </InputGroupAddon>
          <InputGroupInput
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search position, department..."
            className="h-7 text-[11px]"
          />
        </InputGroup>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto">
        <Table>
          <TableHeader className="bg-gray-50 sticky top-0 z-10">
            <TableRow>
              <TableHead className="text-[10px] font-semibold text-gray-700 w-10">
                No
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[200px]">
                Position
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[180px]">
                Department / Unit
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-gray-700 text-center w-24">
                Slots
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-gray-700 text-right w-28">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isError ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex flex-col items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <p className="text-[10px] font-medium text-red-600">
                      Failed to load positions
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {(error as any)?.message ?? "Try again later."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : isFetching && items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex items-center justify-center gap-1.5 text-gray-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span className="text-[10px]">Loading positions...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Briefcase className="h-5 w-5 text-gray-300" />
                    </div>
                    <p className="text-xs font-medium text-gray-700">
                      No positions found
                    </p>
                    <p className="text-[10px] text-gray-500 max-w-[260px]">
                      {query
                        ? `No results for "${query}". Try a different term.`
                        : "There are no available positions to post."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, i) => (
                <PositionSelectItem
                  key={item.id}
                  item={item}
                  no={i + 1}
                  query={query}
                  token={token as string}
                  lineId={lineId as string}
                  userId={userId}
                />
              ))
            )}

            {hasNextPage && (
              <TableRow ref={ref}>
                <TableCell colSpan={5} className="text-center py-2">
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
                <TableCell colSpan={5} className="text-center py-2 border-t">
                  <span className="text-[10px] text-gray-400">
                    Showing all {items.length} position
                    {items.length !== 1 ? "s" : ""}
                  </span>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PositionSelection;
