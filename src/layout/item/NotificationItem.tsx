import { memo } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
//
import {
  viewUserNotification,
  masrkNotificationsAsRead,
} from "@/db/statements/notification";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemHeader,
  ItemTitle,
} from "@/components/ui/item";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
  ContextMenuItem,
} from "@/components/ui/context-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
//
import { getInitials } from "@/utils/helper";
//
import type { Notification } from "@/interface/data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

//
import { ArrowRight, User } from "lucide-react";

//
interface Props {
  item: Notification;
  token: string;
  userId: string;
}

const NotificationItem = ({ item, token, userId }: Props) => {
  const nav = useNavigate();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: () => viewUserNotification(token, item.id, userId),
    onError: (err) => {
      toast.error("FAILED TO SUBMIT", {
        description: err.message,
      });
    },
    onSuccess: () => {
      if (!item.path) return;
      nav(`${item.path}`);
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: () => masrkNotificationsAsRead(token, userId, item.id),
    onError: (err) => {
      toast.error("FAILED TO MARK AS READ", {
        description: err.message,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["notifications", userId],
        refetchType: "active",
      });
    },
  });
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Item
          key={item.id}
          className={`p-3 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 mt-1 ${
            !item.isRead ? "bg-blue-50" : ""
          }`}
          // onClick={() => handleMarkAsRead(item.id)}
        >
          <div className="flex gap-3">
            {/* Sender Avatar */}

            <Avatar className="h-10 w-10 flex-shrink-0">
              {/* {item.sender && (
            <AvatarImage
              src={item.sender.userProfilePictures.file_url}
              alt={item.sender.userProfilePictures.id}
            />
          )} */}
              <AvatarFallback className="text-xs bg-gray-100 text-gray-600">
                {item.sender ? (
                  `${getInitials(item.sender.firstName)}${getInitials(
                    item.sender.lastName,
                  )}`
                ) : (
                  <User className="h-4 w-4" />
                )}
              </AvatarFallback>
            </Avatar>

            {/* Notification Content */}
            <div className="flex-1 min-w-0">
              <ItemHeader className="mb-1">
                <div className="flex items-start justify-between gap-2">
                  <ItemTitle
                    className={`text-sm font-medium line-clamp-2 ${
                      !item.isRead ? "text-gray-900" : "text-gray-600"
                    }`}
                  >
                    {item.title}
                  </ItemTitle>
                  {!item.isRead && (
                    <Badge
                      variant="default"
                      className="bg-blue-500 h-2 w-2 p-0 rounded-full flex-shrink-0"
                    />
                  )}
                </div>
              </ItemHeader>

              <ItemContent className="mb-2">
                <ItemDescription className="text-sm text-gray-600 line-clamp-2">
                  {item.content}
                </ItemDescription>

                {/* Sender Info */}
                {item.sender && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-gray-500">
                      {item.sender.Position && (
                        <span className="text-gray-400">
                          {" "}
                          • {item.sender.Position.name}
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </ItemContent>

              <ItemFooter className="flex items-center justify-between">
                {/* <span className="text-xs text-gray-400">
              {formatTimestamp(item.createdAt)}
            </span> */}

                {/* Action Button */}
                {item.path && (
                  <Button
                    disabled={isPending}
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={(e) => {
                      if (isPending) return;
                      e.stopPropagation();
                      mutateAsync();
                    }}
                  >
                    View
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </ItemFooter>
            </div>
          </div>
        </Item>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => {
            if (item.isRead) return;
            markAsReadMutation.mutateAsync();
          }}
        >
          Mark as read
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default memo(NotificationItem);
