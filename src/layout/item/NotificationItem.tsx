import { memo } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  viewUserNotification,
  markNotificationAsRead,
} from "@/db/statements/notification";
import { getInitials } from "@/utils/helper";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
  ContextMenuItem,
} from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { ArrowRight, User as UserIcon, Check, Loader2 } from "lucide-react";

import type { Notification } from "@/interface/data";

interface Props {
  item: Notification;
  token: string;
  userId: string;
}

const formatRelative = (input: Date | string | undefined) => {
  if (!input) return "";
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "";
  const now = Date.now();
  const diff = Math.max(0, now - d.getTime());

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;

  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const NotificationItem = ({ item, token, userId }: Props) => {
  const nav = useNavigate();
  const queryClient = useQueryClient();

  // View navigates to item.path (also marks as viewed on the backend)
  const view = useMutation({
    mutationFn: () => viewUserNotification(token, item.id, userId),
    onError: (err) =>
      toast.error("Failed to open", { description: err.message }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["notifications", userId],
        refetchType: "active",
      });
      if (item.path) nav(item.path);
    },
  });

  // Mark this notification as read (no navigation)
  const markRead = useMutation({
    mutationFn: () => markNotificationAsRead(token, userId, item.id),
    onError: (err) =>
      toast.error("Failed to mark as read", { description: err.message }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["notifications", userId],
        refetchType: "active",
      });
    },
  });

  const isBusy = view.isPending || markRead.isPending;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={`group px-3 py-2.5 flex gap-2.5 cursor-pointer transition-colors hover:bg-gray-50 ${
            !item.isRead ? "bg-blue-50/40" : ""
          }`}
          onClick={() => {
            if (isBusy) return;
            if (item.path) view.mutateAsync();
            else if (!item.isRead) markRead.mutateAsync();
          }}
        >
          {/* Avatar */}
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
              {item.sender ? (
                `${getInitials(item.sender.firstName)}${getInitials(item.sender.lastName)}`
              ) : (
                <UserIcon className="h-3.5 w-3.5" />
              )}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p
                className={`text-xs line-clamp-2 ${
                  !item.isRead
                    ? "font-semibold text-gray-900"
                    : "font-medium text-gray-700"
                }`}
              >
                {item.title || "Notification"}
              </p>
              {!item.isRead && (
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
              )}
            </div>

            {item.content && (
              <p className="text-[10px] text-gray-600 line-clamp-2 mt-0.5">
                {item.content}
              </p>
            )}

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {item.sender?.Position?.name && (
                <span className="text-[10px] text-gray-400 truncate">
                  {item.sender.Position.name}
                </span>
              )}
              {item.createdAt && (
                <span className="text-[10px] text-gray-400">
                  {formatRelative(item.createdAt)}
                </span>
              )}

              <div className="flex-1" />

              {/* Mark as read inline (only when unread, click stops bubbling) */}
              {!item.isRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isBusy}
                  className="h-6 px-1.5 text-[10px] gap-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    markRead.mutateAsync();
                  }}
                >
                  {markRead.isPending ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  ) : (
                    <Check className="h-2.5 w-2.5" />
                  )}
                  Mark read
                </Button>
              )}

              {item.path && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isBusy}
                  className="h-6 px-1.5 text-[10px] gap-1 text-blue-600 hover:bg-blue-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    view.mutateAsync();
                  }}
                >
                  {view.isPending ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  ) : (
                    <>
                      View
                      <ArrowRight className="h-2.5 w-2.5" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="text-xs">
        <ContextMenuItem
          disabled={item.isRead || markRead.isPending}
          onClick={() => {
            if (item.isRead) return;
            markRead.mutateAsync();
          }}
          className="text-xs"
        >
          <Check className="mr-2 h-3 w-3" />
          Mark as read
        </ContextMenuItem>
        {item.path && (
          <ContextMenuItem
            disabled={view.isPending}
            onClick={() => view.mutateAsync()}
            className="text-xs"
          >
            <ArrowRight className="mr-2 h-3 w-3" />
            Open
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default memo(NotificationItem);
