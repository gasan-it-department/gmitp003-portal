import { useInfiniteQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useMemo } from "react";
import { toast } from "sonner";

import { userNotifications } from "@/db/statement";
import { markNotificationAsRead } from "@/db/statements/notification";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import NotificationItem from "./item/NotificationItem";

import { Bell, BellOff, Loader2, CheckCheck } from "lucide-react";

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
  const queryClient = useQueryClient();

  const { data, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery<ListProps>({
      queryKey: ["notifications", userId],
      queryFn: ({ pageParam }) =>
        userNotifications(token, userId, pageParam as string | null, "10"),
      initialPageParam: null,
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.lastCursor : undefined,
      enabled: !!userId && !!token,
      refetchOnWindowFocus: false,
    });

  const { ref } = useInView({
    threshold: 0.5,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
  });

  const notifications = data?.pages.flatMap((p) => p.list) ?? [];
  const total = notifications.length;
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );
  const isLoading = isFetching && total === 0;

  // Mark all unread as read (loops the existing single-mark endpoint)
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter((n) => !n.isRead);
      await Promise.all(
        unread.map((n) => markNotificationAsRead(token, userId, n.id)),
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["notifications", userId],
        refetchType: "active",
      });
      toast.success("All notifications marked as read");
    },
    onError: (err) =>
      toast.error("Failed to mark all as read", { description: err.message }),
  });

  return (
    <div className="w-full h-full flex flex-col bg-white">

      {/* Header */}
      <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <Bell className="h-3 w-3 text-blue-500" />
          <div>
            <h3 className="text-xs font-semibold text-gray-800">
              Notifications
            </h3>
            <p className="text-[10px] text-gray-500 leading-none mt-0.5">
              {unreadCount > 0 ? (
                <>
                  <span className="font-semibold text-blue-600">
                    {unreadCount}
                  </span>{" "}
                  unread
                </>
              ) : (
                "You're all caught up"
              )}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-[10px] gap-1 text-blue-600 hover:bg-blue-50"
            disabled={markAllAsRead.isPending}
            onClick={() => markAllAsRead.mutateAsync()}
          >
            {markAllAsRead.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <CheckCheck className="h-3 w-3" />
            )}
            Mark all read
          </Button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-3 py-2.5 flex gap-2.5">
                <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2.5 w-full" />
                  <Skeleton className="h-2.5 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : total > 0 ? (
          <>
            <div className="divide-y divide-gray-100">
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  item={n}
                  token={token}
                  userId={userId}
                />
              ))}
            </div>

            {/* Infinite scroll trigger */}
            {hasNextPage && <div ref={ref} className="h-8" />}

            {isFetchingNextPage && (
              <div className="flex items-center justify-center gap-1.5 py-3 text-gray-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-[10px]">Loading more...</span>
              </div>
            )}

            {!hasNextPage && total > 0 && (
              <div className="py-2 text-center border-t">
                <p className="text-[10px] text-gray-400">
                  All {total} notification{total !== 1 ? "s" : ""} loaded
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
              <BellOff className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-xs font-medium text-gray-500">
              No notifications
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              You're all caught up — new ones will appear here.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {total > 0 && (
        <div className="px-3 py-1.5 border-t bg-gray-50 flex items-center justify-between flex-shrink-0">
          <span className="text-[10px] text-gray-500">
            {total} total
          </span>
          {unreadCount > 0 && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0">
              {unreadCount} unread
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default UserNotification;
