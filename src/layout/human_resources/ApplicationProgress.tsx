import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useEffect, useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import axios from "@/db/axios";
import { isAxiosError } from "axios";

import {
  applicationConversation,
  getApplicationData,
  updateApplicantStatus,
} from "@/db/statement";
import { joinChatRoom, type ChatMessagePayload } from "@/db/socketClient";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Modal from "@/components/custom/Modal";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";

import {
  Send,
  Calendar,
  User,
  MessageSquare,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { applicationStatus, getInitials } from "@/utils/helper";
import { formatDateToday } from "@/utils/date";
import { ApplicationStatusProgress } from "@/utils/element";

import { ConcludeApplicationSchema } from "@/interface/zod";
import type {
  ApplicationConversationProps,
  ConcludeApplicationProps,
  SubmittedApplicationProps,
} from "@/interface/data";

interface Props {
  token: string;
  applicationId: string;
  userId: string;
  lineId: string;
}

interface ListProps {
  list: ApplicationConversationProps[];
  hasMore: boolean;
  lastCursor: string | null;
}

const ApplicationProgress = ({
  token,
  applicationId,
  userId,
  lineId,
}: Props) => {
  const [message, setMessage] = useState("");
  const [onOpen, setOnOpen] = useState(0);
  const queryClient = useQueryClient();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousMessagesCountRef = useRef<number>(0);
  const isFirstLoadRef = useRef(true);

  // ── Queries ───────────────────────────────────────────────────────
  const applicationData = useQuery<SubmittedApplicationProps>({
    queryKey: ["application", applicationId],
    queryFn: () => getApplicationData(token, applicationId),
    enabled: !!applicationId,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const {
    data,
    isFetchingNextPage,
    isFetching,
    hasNextPage,
    fetchNextPage,
    isError,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["application-conversation", applicationId],
    queryFn: ({ pageParam }) =>
      applicationConversation(
        token,
        applicationId,
        pageParam as string | null,
        "20",
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    refetchOnWindowFocus: false,
  });

  // ── Form (conclude) ───────────────────────────────────────────────
  const form = useForm<ConcludeApplicationProps>({
    resolver: zodResolver(ConcludeApplicationSchema),
    defaultValues: { sendInviteLink: true, accepted: false },
  });
  const { control, watch, setValue } = form;
  const accepted = watch("accepted", false);

  useEffect(() => {
    if (accepted) setValue("sendInviteLink", true);
  }, [accepted, setValue]);

  // ── Mutations ─────────────────────────────────────────────────────
  const concludeMut = useMutation({
    mutationFn: async (vals: ConcludeApplicationProps) => {
      const res = await axios.patch(
        "/application/conclude",
        { applicationId, ...vals },
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
      await queryClient.invalidateQueries({
        queryKey: ["application", applicationId],
        refetchType: "active",
      });
      toast.success("Application concluded");
      setOnOpen(0);
    },
    onError: (err) => {
      const msg = isAxiosError(err)
        ? err.response?.data?.message ?? err.message
        : err instanceof Error
          ? err.message
          : "Failed to conclude";
      toast.error(msg);
    },
  });

  const statusMut = useMutation({
    mutationFn: (status: number) =>
      updateApplicantStatus(
        token,
        status,
        applicationData.data?.id as string,
        userId,
        lineId,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["application", applicationId],
        refetchType: "active",
      });
      toast.success("Status updated");
      setOnOpen(0);
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ??
          (err instanceof Error ? err.message : "Failed to update status"),
      );
    },
  });

  const sendMut = useMutation({
    mutationFn: async (msg: string) => {
      const res = await axios.post(
        "/application/send/admin-conversation",
        { userId, message: msg, applicationId },
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
      await queryClient.invalidateQueries({
        queryKey: ["application-conversation", applicationId],
        refetchType: "active",
      });
      setMessage("");
      setTimeout(() => scrollToBottom(), 100);
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

  // ── Scroll bookkeeping ────────────────────────────────────────────
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  const allConversations = data?.pages.flatMap((p) => p.list) ?? [];

  useEffect(() => {
    const count = allConversations.length;
    if (isFirstLoadRef.current && count > 0) {
      setTimeout(() => scrollToBottom("auto"), 100);
      isFirstLoadRef.current = false;
      previousMessagesCountRef.current = count;
    } else if (count > previousMessagesCountRef.current) {
      setTimeout(() => scrollToBottom(), 100);
      previousMessagesCountRef.current = count;
    } else {
      previousMessagesCountRef.current = count;
    }
  }, [allConversations.length, scrollToBottom]);

  // ── Real-time subscription ───────────────────────────────────────
  // Join the chat room for this application; on every incoming message
  // append it to the cached first page so the UI updates without a
  // refetch. Dedupes by id in case the optimistic POST response and the
  // socket push race each other.
  useEffect(() => {
    if (!applicationId) return;
    const unsubscribe = joinChatRoom(applicationId, (msg: ChatMessagePayload) => {
      queryClient.setQueryData<{
        pages: ListProps[];
        pageParams: unknown[];
      }>(["application-conversation", applicationId], (prev) => {
        if (!prev) return prev;
        // If the message is already in any page, skip.
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
      // Auto-scroll for newly-arrived messages.
      setTimeout(() => scrollToBottom(), 80);
    });
    return unsubscribe;
  }, [applicationId, queryClient]);

  // Top sentinel for "load earlier" infinite scroll.
  const { ref: topRef } = useInView({
    threshold: 0.5,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetching && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
  });

  // ── Loading / not found ───────────────────────────────────────────
  if (applicationData.isFetching && !applicationData.data) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center gap-1.5 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="text-xs">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!applicationData.data) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-3">
        <div className="border rounded-lg bg-white p-6 text-center max-w-sm w-full">
          <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-gray-800">
            Application not found
          </p>
        </div>
      </div>
    );
  }

  const isPending = statusMut.isPending || concludeMut.isPending;
  const app = applicationData.data;
  const isFinal = app.status >= 2;

  const handleConfirm = async () => {
    if (app.status === 1) {
      await concludeMut.mutateAsync(form.getValues());
    } else {
      await statusMut.mutateAsync(app.status + 1);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMut.isPending) return;
    sendMut.mutateAsync(message);
  };

  // Group messages by date for sticky separators.
  const groupedMessages = allConversations.reduce(
    (groups, m) => {
      const date = formatDateToday(m.timestamp);
      if (!groups[date]) groups[date] = [];
      groups[date].push(m);
      return groups;
    },
    {} as Record<string, ApplicationConversationProps[]>,
  );

  const fmtTime = (date: string) =>
    new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">

      {/* Header card */}
      <div className="bg-white border-b flex-shrink-0">
        <div className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <Avatar className="h-9 w-9 flex-shrink-0">
                <AvatarFallback className="bg-blue-100 text-blue-700 text-[10px] font-semibold">
                  {getInitials(
                    `${app.firstname ?? ""} ${app.lastname ?? ""}`,
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">
                  {app.firstname} {app.lastname}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                  <span className="flex items-center gap-0.5">
                    <Calendar className="h-2.5 w-2.5" />
                    Applied{" "}
                    {new Date(app.timestamp).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <User className="h-2.5 w-2.5" />#{applicationId.slice(-6)}
                  </span>
                </div>
              </div>
            </div>
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200 flex-shrink-0"
            >
              {applicationStatus[app.status]}
            </Badge>
          </div>

          {/* Progress bar */}
          <div className="border rounded-md bg-gray-50 p-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold text-gray-700">
                Application Progress
              </span>
              <Button
                size="sm"
                disabled={isFinal || isPending}
                onClick={() => setOnOpen(1)}
                className="h-6 text-[10px] gap-1.5 bg-blue-600 hover:bg-blue-700"
              >
                {isFinal ? "Final Stage" : "Update Status"}
              </Button>
            </div>
            <ApplicationStatusProgress index={app.status + 1} />
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 min-h-0 bg-gray-50 overflow-auto">
        <div className="p-3">
          {/* Top sentinel for older messages */}
          {hasNextPage && <div ref={topRef} className="h-2" />}

          {isFetchingNextPage && (
            <div className="flex justify-center py-2">
              <div className="flex items-center gap-1.5 bg-white border rounded-full px-3 py-1">
                <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                <span className="text-[10px] text-gray-600">
                  Loading earlier...
                </span>
              </div>
            </div>
          )}

          {isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-5 w-5 text-red-500 mb-1.5" />
              <p className="text-xs font-medium text-red-600">
                Failed to load messages
              </p>
            </div>
          ) : isFetching && allConversations.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              <span className="text-[10px]">Loading messages...</span>
            </div>
          ) : allConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                <MessageSquare className="h-5 w-5 text-gray-300" />
              </div>
              <p className="text-xs font-semibold text-gray-700">
                No messages yet
              </p>
              <p className="text-[10px] text-gray-500 mt-1 max-w-[260px]">
                Send a message below to start the conversation with the
                applicant.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(groupedMessages).map(([date, msgs]) => (
                <div key={date} className="space-y-2">
                  <div className="flex justify-center sticky top-0 z-10">
                    <div className="bg-white border rounded-full px-2.5 py-0.5 shadow-xs">
                      <span className="text-[10px] font-medium text-gray-600 flex items-center gap-1">
                        <Calendar className="h-2.5 w-2.5" />
                        {date}
                      </span>
                    </div>
                  </div>

                  {msgs.map((c) => (
                    <div
                      key={c.id}
                      className={`flex gap-1.5 ${
                        c.fromHr ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!c.fromHr && (
                        <Avatar className="h-6 w-6 flex-shrink-0 mt-0.5">
                          <AvatarFallback className="bg-gray-100 text-gray-700 text-[9px]">
                            {getInitials(
                              `${app.firstname ?? ""} ${app.lastname ?? ""}`,
                            )}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={`max-w-[75%] rounded-xl px-2.5 py-1.5 ${
                          c.fromHr
                            ? "bg-blue-600 text-white rounded-br-sm"
                            : "bg-white text-gray-800 border rounded-bl-sm"
                        }`}
                      >
                        <p className="text-[11px] leading-relaxed whitespace-pre-wrap break-words">
                          {c.messageContent}
                        </p>
                        <div
                          className={`flex items-center gap-1.5 mt-1 text-[9px] ${
                            c.fromHr
                              ? "text-blue-100 justify-end"
                              : "text-gray-500 justify-start"
                          }`}
                        >
                          <span>{fmtTime(c.timestamp)}</span>
                          {c.fromHr && (
                            <span className="flex items-center gap-0.5">
                              <User className="h-2 w-2" />
                              You
                            </span>
                          )}
                        </div>
                      </div>

                      {c.fromHr && (
                        <Avatar className="h-6 w-6 flex-shrink-0 mt-0.5">
                          <AvatarFallback className="bg-blue-100 text-blue-700 text-[9px]">
                            HR
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} style={{ height: 1 }} />
        </div>
      </div>

      {/* Composer */}
      <div className="border-t bg-white flex-shrink-0 px-3 py-2">
        <form onSubmit={handleSend} className="flex gap-1.5">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="min-h-[36px] max-h-32 resize-none text-xs"
            rows={1}
            disabled={sendMut.isPending || isFinal}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e as any);
              }
            }}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!message.trim() || sendMut.isPending || isFinal}
            className="h-9 w-9 p-0 flex-shrink-0 bg-blue-600 hover:bg-blue-700"
          >
            {sendMut.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </form>
        {isFinal && (
          <p className="text-[10px] text-gray-400 mt-1">
            This application has been concluded — messaging is disabled.
          </p>
        )}
      </div>

      {/* Status update modal */}
      <Modal
        title="Update Application Status"
        onOpen={onOpen === 1}
        footer={1}
        className="max-w-md"
        setOnOpen={() => {
          if (isPending) return;
          setOnOpen(0);
        }}
        loading={isPending}
      >
        <div className="space-y-3">
          <p className="text-[11px] text-gray-700">
            Proceed to{" "}
            <span className="font-semibold text-blue-600">
              {applicationStatus[app.status + 1] ?? "next stage"}
            </span>
            ?
          </p>

          {app.status === 1 && (
            <Form {...form}>
              <div className="space-y-2 border rounded-md bg-gray-50 p-2.5">
                <p className="text-[10px] font-semibold text-gray-700">
                  Mark this application as:
                </p>
                <FormField
                  control={control}
                  name="accepted"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-[11px] font-medium">
                        Accepted
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="sendInviteLink"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          disabled={!accepted}
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel
                        className={`text-[11px] font-medium ${
                          !accepted ? "text-gray-400" : ""
                        }`}
                      >
                        Send invitation through email
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </Form>
          )}

          <p className="text-[10px] text-orange-600">
            This action cannot be undone.
          </p>

          <div className="flex gap-2 justify-end pt-1 border-t">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px]"
              onClick={() => setOnOpen(0)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-7 text-[10px] gap-1.5 bg-blue-600 hover:bg-blue-700"
              onClick={handleConfirm}
              disabled={isPending}
            >
              {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ApplicationProgress;
