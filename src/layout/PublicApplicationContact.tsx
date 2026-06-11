import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import axios from "@/db/axios";
import { applicationPublicConversation } from "@/db/statement";
import { joinChatRoom, type ChatMessagePayload } from "@/db/socketClient";
import { formatDateToday } from "@/utils/date";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import {
  MessageSquare,
  Send,
  X,
  Loader2,
  Calendar,
} from "lucide-react";

import type { ApplicationConversationProps } from "@/interface/data";

interface Props {
  applicationId: string;
  token: string;
}

interface ListProps {
  list: ApplicationConversationProps[];
  hasMore: boolean;
  lastCursor: string | null;
}

const fmtTime = (date: string) =>
  new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

const PublicApplicationContact = ({ applicationId, token }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFirstLoadRef = useRef(true);
  const previousCountRef = useRef(0);

  const queryClient = useQueryClient();

  const { data, isFetchingNextPage, hasNextPage, isFetching, fetchNextPage } =
    useInfiniteQuery<ListProps>({
      queryKey: ["application-conversation", applicationId],
      queryFn: ({ pageParam }) =>
        applicationPublicConversation(
          token,
          applicationId,
          pageParam as string | null,
          "20",
        ),
      initialPageParam: null,
      getNextPageParam: (last) =>
        last.hasMore ? last.lastCursor : undefined,
      enabled: !!applicationId && !!token && isOpen,
      refetchOnWindowFocus: false,
    });

  const allMessages = data?.pages.flatMap((p) => p.list) ?? [];
  const totalMessages = allMessages.length;

  // Auto-scroll bookkeeping — jump to bottom on first open, smooth-scroll
  // for subsequent new messages.
  useEffect(() => {
    if (!isOpen) {
      isFirstLoadRef.current = true;
      previousCountRef.current = 0;
      return;
    }
    if (isFirstLoadRef.current && totalMessages > 0) {
      setTimeout(
        () =>
          messagesEndRef.current?.scrollIntoView({
            behavior: "auto",
            block: "end",
          }),
        50,
      );
      isFirstLoadRef.current = false;
      previousCountRef.current = totalMessages;
    } else if (totalMessages > previousCountRef.current) {
      setTimeout(
        () =>
          messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
          }),
        50,
      );
      previousCountRef.current = totalMessages;
    } else {
      previousCountRef.current = totalMessages;
    }
  }, [totalMessages, isOpen]);

  // ── Real-time subscription ───────────────────────────────────────
  // Active while the popover is open (we don't bother holding a socket
  // for a chat the user can't see). Newly received messages are appended
  // to the first cached page; the auto-scroll effect above will sweep
  // them into view.
  useEffect(() => {
    if (!isOpen || !applicationId) return;
    const unsubscribe = joinChatRoom(applicationId, (msg: ChatMessagePayload) => {
      queryClient.setQueryData<{
        pages: ListProps[];
        pageParams: unknown[];
      }>(["application-conversation", applicationId], (prev) => {
        if (!prev) return prev;
        const exists = prev.pages.some((p) =>
          p.list.some((m) => m.id === msg.id),
        );
        if (exists) return prev;
        const [first, ...rest] = prev.pages;
        if (!first) return prev;
        return {
          ...prev,
          pages: [
            {
              ...first,
              list: [
                ...first.list,
                {
                  id: msg.id,
                  messageContent: msg.messageContent,
                  fromHr: msg.fromHr,
                  timestamp: msg.timestamp,
                  hrAdmin: msg.hrAdmin ?? null,
                } as unknown as ApplicationConversationProps,
              ],
            },
            ...rest,
          ],
        };
      });
    });
    return unsubscribe;
  }, [isOpen, applicationId, queryClient]);

  // Top sentinel for "load earlier" infinite scroll.
  const { ref: topRef } = useInView({
    threshold: 0.5,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetching && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
  });

  const sendMut = useMutation({
    mutationFn: async (msg: string) => {
      const res = await axios.post(
        "/application/send/applicant-conversation",
        { applicationId, message: msg },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
        },
      );
      return res.data;
    },
    onSuccess: async () => {
      setNewMessage("");
      await queryClient.invalidateQueries({
        queryKey: ["application-conversation", applicationId],
        refetchType: "active",
      });
      setTimeout(
        () =>
          messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
          }),
        100,
      );
    },
    onError: (err) => {
      const msg = isAxiosError(err)
        ? err.response?.data?.message ?? err.message
        : err instanceof Error
          ? err.message
          : "Failed to send";
      toast.error(msg);
    },
  });

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || sendMut.isPending) return;
    if (!applicationId || !token) {
      toast.warning("Session expired — please re-verify.");
      return;
    }
    sendMut.mutateAsync(newMessage);
  };

  // Group messages by date for sticky separators.
  const grouped = allMessages.reduce(
    (acc, m) => {
      const date = formatDateToday(m.timestamp);
      if (!acc[date]) acc[date] = [];
      acc[date].push(m);
      return acc;
    },
    {} as Record<string, ApplicationConversationProps[]>,
  );

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-blue-600 hover:bg-blue-700 relative"
          >
            <MessageSquare className="h-5 w-5" />
            {totalMessages > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[9px] leading-none rounded-full"
              >
                {totalMessages > 99 ? "99+" : totalMessages}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-80 sm:w-96 h-[480px] p-0 flex flex-col overflow-hidden"
          align="end"
          sideOffset={8}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2 flex-shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="p-1 bg-blue-600 rounded">
                <MessageSquare className="h-3 w-3 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">
                  Application Inbox
                </p>
                <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                  {totalMessages > 0
                    ? `${totalMessages} message${totalMessages === 1 ? "" : "s"}`
                    : "No messages yet"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-auto bg-gray-50 px-3 py-2">
            {hasNextPage && <div ref={topRef} className="h-2" />}

            {isFetchingNextPage && (
              <div className="flex justify-center py-2">
                <div className="flex items-center gap-1.5 bg-white border rounded-full px-2.5 py-1">
                  <Loader2 className="h-2.5 w-2.5 animate-spin text-blue-500" />
                  <span className="text-[10px] text-gray-600">
                    Loading earlier...
                  </span>
                </div>
              </div>
            )}

            {isFetching && allMessages.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                <span className="text-[10px]">Loading messages...</span>
              </div>
            ) : allMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-1.5">
                  <MessageSquare className="h-5 w-5 text-gray-300" />
                </div>
                <p className="text-xs font-semibold text-gray-700">
                  No messages yet
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5 max-w-[220px]">
                  Send a message to start a conversation with HR.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {Object.entries(grouped).map(([date, msgs]) => (
                  <div key={date} className="space-y-2">
                    <div className="flex justify-center sticky top-0 z-10">
                      <div className="bg-white border rounded-full px-2 py-0.5">
                        <span className="text-[10px] font-medium text-gray-600 flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5" />
                          {date}
                        </span>
                      </div>
                    </div>

                    {msgs.map((m) => {
                      // `fromHr === true` → message authored by HR side.
                      // The applicant viewing this chat sees THEIR OWN messages
                      // on the right, HR's messages on the left.
                      const isOwn = !m.fromHr;
                      return (
                        <div
                          key={m.id}
                          className={`flex gap-1.5 ${
                            isOwn ? "justify-end" : "justify-start"
                          }`}
                        >
                          {!isOwn && (
                            <Avatar className="h-6 w-6 flex-shrink-0 mt-0.5">
                              <AvatarFallback className="bg-blue-100 text-blue-700 text-[9px]">
                                HR
                              </AvatarFallback>
                            </Avatar>
                          )}

                          <div
                            className={`max-w-[78%] rounded-xl px-2.5 py-1.5 ${
                              isOwn
                                ? "bg-blue-600 text-white rounded-br-sm"
                                : "bg-white text-gray-800 border rounded-bl-sm"
                            }`}
                          >
                            <p className="text-[11px] leading-relaxed whitespace-pre-wrap break-words">
                              {m.messageContent}
                            </p>
                            <p
                              className={`mt-1 text-[9px] ${
                                isOwn ? "text-blue-100" : "text-gray-500"
                              }`}
                            >
                              {fmtTime(m.timestamp)}
                            </p>
                          </div>

                          {isOwn && (
                            <Avatar className="h-6 w-6 flex-shrink-0 mt-0.5">
                              <AvatarFallback className="bg-gray-100 text-gray-700 text-[9px]">
                                You
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div ref={messagesEndRef} style={{ height: 1 }} />
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t bg-white p-2 flex-shrink-0">
            <form onSubmit={handleSend} className="flex gap-1.5">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type your message..."
                className="min-h-[34px] max-h-32 resize-none text-xs flex-1"
                rows={1}
                disabled={sendMut.isPending}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!newMessage.trim() || sendMut.isPending}
                className="h-8 w-8 p-0 flex-shrink-0 bg-blue-600 hover:bg-blue-700"
              >
                {sendMut.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </Button>
            </form>
            <p className="text-[10px] text-gray-400 mt-1 text-center">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default PublicApplicationContact;
