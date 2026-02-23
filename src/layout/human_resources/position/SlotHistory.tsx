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
//interface
import type { UnitPositionHistory } from "@/interface/data";
//icons
import { History, Calendar, Briefcase, ChevronDown } from "lucide-react";

interface Props {
  unitPositionId: string;
  token: string;
}

interface ListProps {
  list: UnitPositionHistory[];
  hasMore: boolean;
  lastCursor: string | null;
}

const SlotHistory = ({ unitPositionId, token }: Props) => {
  const { ref, inView } = useInView({
    threshold: 0,
  });

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
      refetchOnReconnect: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allItems = data?.pages.flatMap((page) => page.list) || [];

  const getInitials = (user: any) => {
    if (!user) return "?";
    return (
      `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() ||
      "U"
    );
  };

  if (isFetching && !allItems.length) {
    return (
      <div className="w-full h-full p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!allItems.length) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6">
        <History className="h-8 w-8 text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">No history records</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-white">
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Slot</TableHead>
              <TableHead>Unit Position</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs bg-gray-100">
                        {getInitials(item.user)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {item.user?.firstName} {item.user?.lastName}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    <Briefcase className="w-3 h-3 mr-1" />
                    {item.slot?.id?.substring(0, 6)}...
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">
                    {item.unitPost?.id?.substring(0, 6)}...
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.timestamp).toLocaleDateString()}
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {isFetchingNextPage && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  <div className="flex items-center justify-center gap-1">
                    <ChevronDown className="h-4 w-4 animate-bounce" />
                    <span className="text-sm text-gray-400">
                      Loading more...
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {hasNextPage && (
              <TableRow ref={ref}>
                <TableCell colSpan={4} className="h-4" />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SlotHistory;
