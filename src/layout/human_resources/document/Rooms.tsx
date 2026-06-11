import { useState } from "react";
import { useNavigate } from "react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";

import { rooms as roomList } from "@/db/statements/document";

import {
  Table,
  TableBody,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

import RoomItem from "../item/RoomItem";

import {
  Loader2,
  Search,
  FolderOpen,
  AlertCircle,
} from "lucide-react";

import type { ReceivingRoom } from "@/interface/data";

interface Props {
  lineId: string | undefined;
  userId: string | undefined;
  token: string | undefined;
}

interface ListProps {
  list: ReceivingRoom[];
  lastCursor: string | null;
  hasMore: boolean;
}

const Rooms = ({ lineId, token }: Props) => {
  const nav = useNavigate();
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 400);

  const {
    data,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    error,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["rooms", lineId, query],
    queryFn: ({ pageParam }) =>
      roomList(
        token as string,
        lineId,
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

  const items = data?.pages.flatMap((p) => p.list) ?? [];

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white border-b px-3 py-2 flex items-center gap-1.5 flex-shrink-0">
        <InputGroup className="bg-white flex-1 max-w-xs">
          <InputGroupAddon>
            <Search className="h-3 w-3 text-gray-400" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search by address or code..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-7 text-[11px]"
          />
        </InputGroup>
        <span className="text-[10px] text-gray-500 ml-auto">
          {items.length} room{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto p-3">
        <div className="border rounded-lg bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="text-[10px] font-semibold text-gray-700 w-10">
                  No
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[160px]">
                  Code
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[200px]">
                  Address
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 text-center w-24">
                  Users
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isError ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex flex-col items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <p className="text-[10px] font-medium text-red-600">
                        Failed to load rooms
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {(error as any)?.message ?? "Try again later."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isFetching && items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex items-center justify-center gap-1.5 text-gray-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span className="text-[10px]">Loading rooms...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <FolderOpen className="h-5 w-5 text-gray-300" />
                      </div>
                      <p className="text-xs font-medium text-gray-700">
                        No rooms found
                      </p>
                      <p className="text-[10px] text-gray-500 max-w-[260px]">
                        {query
                          ? `Nothing matches "${query}".`
                          : "Rooms appear here as users register them."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((room, i) => (
                  <RoomItem
                    key={room.id}
                    room={room}
                    i={i}
                    onClick={() => nav(`rooms/${room.id}`)}
                  />
                ))
              )}

              {hasNextPage && (
                <TableRow ref={ref}>
                  <TableCell colSpan={4} className="text-center py-2">
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
                  <TableCell colSpan={4} className="text-center py-2 border-t">
                    <span className="text-[10px] text-gray-400">
                      Showing all {items.length} room
                      {items.length !== 1 ? "s" : ""}
                    </span>
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

export default Rooms;
