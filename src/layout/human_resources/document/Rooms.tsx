import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
//
import { rooms as roomList } from "@/db/statements/document";

//
import {
  Table,
  TableBody,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import SWWItem from "@/layout/item/SWWItem";
import RoomItem from "../item/RoomItem";
//
import type { ReceivingRoom } from "@/interface/data";
import { Loader2 } from "lucide-react";

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

const Rooms = ({ lineId, userId, token }: Props) => {
  const { ref } = useInView({
    threshold: 0.5,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
  });

  const { data, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery<ListProps>({
      queryKey: ["rooms", lineId],
      queryFn: ({ pageParam }) =>
        roomList(token as string, lineId, pageParam as string | null, "20", ""),
      initialPageParam: null,
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.lastCursor : undefined,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    });

  const rooms = data?.pages.flatMap((page) => page.list) ?? [];
  const isEmpty = !isFetching && rooms.length === 0;

  const nav = useNavigate();

  return (
    <div className="w-full h-full bg-white rounded-lg border shadow-sm overflow-hidden">
      <div className="overflow-auto max-h-[calc(100vh-200px)]">
        <Table>
          <TableHeader className="bg-gray-50 sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-20 font-semibold text-gray-700">
                No.
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                Address
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                Code
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching && rooms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-48">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-500">Loading rooms...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : isEmpty ? (
              <TableRow>
                <TableCell colSpan={3} className="h-48">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <svg
                      className="h-12 w-12 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                    <p>No rooms found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : data ? (
              <>
                {rooms.map((room, i) => (
                  <RoomItem
                    key={room.id}
                    room={room}
                    i={i}
                    onClick={() => nav(`rooms/${room.id}`)}
                  />
                ))}

                {/* Infinite scroll trigger */}
                {hasNextPage && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-4" ref={ref}>
                      <div className="flex items-center justify-center">
                        {isFetchingNextPage ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                            <span className="ml-2 text-sm text-gray-500">
                              Loading more...
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">
                            Scroll for more
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ) : (
              <SWWItem colSpan={3} />
            )}
          </TableBody>
        </Table>
      </div>

      {/* Stats footer */}
      {rooms.length > 0 && !isFetching && (
        <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500">
          Showing {rooms.length} room{rooms.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
};

export default Rooms;
