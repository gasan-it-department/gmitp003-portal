import { useInfiniteQuery } from "@tanstack/react-query";
import { useRef } from "react";

//
import { userNotifications } from "@/db/statement";
//
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import NotificationItem from "./item/NotificationItem";
//
import { BellOff } from "lucide-react";
//
import type { Notification } from "@/interface/data";

interface Props {
  token: string;
  userId: string;
}

interface ListProps {
  list: Notification[];
  lastCursor: string | null;
  hasMore: boolean;
}

const UserNotification = ({ token, userId }: Props) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { data, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery<ListProps>({
      queryKey: ["notifications", userId],
      queryFn: ({ pageParam }) =>
        userNotifications(token, userId, pageParam as string | null, "10"),
      initialPageParam: null,
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.lastCursor : undefined,
      enabled: !!userId && !!token,
    });

  const allNotifications = data?.pages.flatMap((page) => page.list) || [];

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (
      scrollHeight - scrollTop <= clientHeight + 100 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between">
          {/* <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-gray-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <p className="text-gray-500 text-sm">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </p>
            </div>
          </div> */}
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1">
        <ScrollArea
          ref={scrollAreaRef}
          onScroll={handleScroll}
          className="h-full"
        >
          <div className="p-2">
            {isFetching && allNotifications.length === 0 ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="p-3 space-y-2 border-b border-gray-100"
                >
                  <div className="flex gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </div>
              ))
            ) : allNotifications.length > 0 ? (
              // Notifications list
              allNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  item={notification}
                  token={token}
                  userId={userId}
                />
              ))
            ) : (
              // Empty state
              <div className="text-center py-12 text-gray-500">
                <BellOff className="h-16 w-16 mx-auto mb-3 text-gray-300" />
                <p className="text-base font-medium">No notifications</p>
                <p className="text-sm mt-1">You're all caught up!</p>
              </div>
            )}

            {/* Load more indicator */}
            {isFetchingNextPage && (
              <div className="p-4 flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            )}

            {hasNextPage && !isFetchingNextPage && (
              <div className="p-4 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  className="text-sm"
                >
                  Load more notifications
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Footer */}
      {allNotifications.length > 0 && (
        <div className="p-3 border-t bg-gray-50">
          <div className="text-center">
            <span className="text-sm text-gray-500">
              {allNotifications.length} total notifications
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserNotification;
