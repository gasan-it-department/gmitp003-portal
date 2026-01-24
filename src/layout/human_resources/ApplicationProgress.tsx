import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useEffect, useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
//db/statement
import {
  applicationConversation,
  getApplicationData,
  updateApplicantStatus,
} from "@/db/statement";
//components
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Modal from "@/components/custom/Modal";
import { Checkbox } from "@/components/ui/checkbox";
//icons
import {
  Paperclip,
  Send,
  FileText,
  X,
  Calendar,
  User,
  MessageSquare,
} from "lucide-react";
//utils
import { applicationStatus, getInitials } from "@/utils/helper";
import { formatDateToday } from "@/utils/date";
//
import type {
  ApplicationConversationProps,
  SubmittedApplicationProps,
} from "@/interface/data";
import { ApplicationStatusProgress } from "@/utils/element";
import axios from "@/db/axios";
import { toast } from "sonner";
//
import { ConcludeApplicationSchema } from "@/interface/zod";
import type { ConcludeApplicationProps } from "@/interface/data";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";

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
  const { ref, inView } = useInView();
  const [message, setMessage] = useState("");
  const [onOpen, setOnOpen] = useState(0);
  const [attachments, setAttachments] = useState<File[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const previousMessagesCountRef = useRef<number>(0);
  const isFirstLoadRef = useRef(true);

  const queryClient = useQueryClient();

  const applicationData = useQuery<SubmittedApplicationProps>({
    queryKey: ["application", applicationId],
    queryFn: () => getApplicationData(token as string, applicationId as string),
    enabled: !!applicationId,
  });

  const form = useForm<ConcludeApplicationProps>({
    resolver: zodResolver(ConcludeApplicationSchema),
    defaultValues: {
      sendInviteLink: true,
      accepted: false,
    },
  });

  const {
    formState: { isSubmitting },
    control,
    watch,
    setValue,
  } = form;

  const accepted = watch("accepted", false);

  // FIXED: Use mutation for concludeApplication
  const { mutateAsync: concludeApplication, isPending: isConcluding } =
    useMutation({
      mutationFn: async (data: ConcludeApplicationProps) => {
        console.log({ data });

        const response = await axios.patch(
          "/application/conclude",
          {
            applicationId: applicationId,
            ...data,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
              "X-Requested-With": "XMLHttpRequest",
            },
          },
        );

        if (response.status !== 200) {
          throw new Error("FAILED TO SUBMIT");
        }

        return response.data;
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: ["application", applicationId],
          refetchType: "active",
        });
        toast.success("Application concluded successfully");
        setOnOpen(0);
      },
      onError: (error) => {
        toast.error("FAILED TO CONCLUDE APPLICATION");
        console.error("Conclude application error:", error);
      },
    });

  const { data, isFetchingNextPage, isFetching, hasNextPage, fetchNextPage } =
    useInfiniteQuery<ListProps>({
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
    });

  const allConversations = data?.pages.flatMap((item) => item.list) || [];

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
    }
  }, []);

  useEffect(() => {
    const currentMessagesCount = allConversations.length;

    if (isFirstLoadRef.current && currentMessagesCount > 0) {
      setTimeout(() => scrollToBottom("auto"), 100);
      isFirstLoadRef.current = false;
      previousMessagesCountRef.current = currentMessagesCount;
    } else if (currentMessagesCount > previousMessagesCountRef.current) {
      const newMessagesCount =
        currentMessagesCount - previousMessagesCountRef.current;

      if (newMessagesCount > 0) {
        setTimeout(() => scrollToBottom(), 100);
      }

      previousMessagesCountRef.current = currentMessagesCount;
    } else {
      previousMessagesCountRef.current = currentMessagesCount;
    }
  }, [allConversations.length, scrollToBottom]);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (accepted) {
      setValue("sendInviteLink", true);
    }
  }, [accepted]);

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setAttachments((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && attachments.length === 0) return;

    try {
      const response = await axios.post(
        "/application/send/admin-conversation",
        {
          userId,
          message,
          applicationId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
        },
      );

      if (response.status !== 200) throw new Error(response.data.message);

      await queryClient.invalidateQueries({
        queryKey: ["application-conversation", applicationId],
        refetchType: "active",
      });

      setMessage("");
      setAttachments([]);

      // Scroll to bottom after sending message
      setTimeout(() => scrollToBottom(), 150);
    } catch (error) {
      toast.error("Failed to submit");
    }
  };

  const { mutateAsync: updateStatus, isPending: isUpdatingStatus } =
    useMutation({
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
        toast.success("Status updated successfully");
        setOnOpen(0);
      },
      onError: (err) => {
        toast.error("Failed to update status", {
          description: err.message,
        });
      },
    });

  // FIXED: Handle confirm button click
  const handleConfirm = async () => {
    if (applicationData.data?.status === 1) {
      const formData = form.getValues();
      await concludeApplication(formData);
    } else {
      await updateStatus(applicationData.data!.status + 1);
    }
  };

  // Group messages by date
  const groupedMessages = allConversations.reduce(
    (groups, message) => {
      const date = formatDateToday(message.timestamp);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    },
    {} as Record<string, ApplicationConversationProps[]>,
  );

  if (applicationData.isFetching) {
    return (
      <div className="w-full h-full flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Spinner className="w-8 h-8 mx-auto" />
          <p className="text-gray-600 text-sm">Loading application data...</p>
        </div>
      </div>
    );
  }

  if (!applicationData.data) {
    return (
      <div className="w-full h-full flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-gray-800 text-lg">
              Application Not Found
            </p>
            <p className="text-gray-600 text-sm max-w-sm">
              The application data could not be loaded or doesn't exist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isPending = isUpdatingStatus || isConcluding;

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
              <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 font-semibold text-sm">
                {getInitials(
                  `${applicationData.data.firstname || ""} ${
                    applicationData.data.lastname || ""
                  }`,
                )}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h2 className="font-semibold text-gray-900 text-lg">
                {applicationData.data.firstname || ""}{" "}
                {applicationData.data.lastname || ""}
              </h2>

              <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Applied{" "}
                    {new Date(
                      applicationData.data.timestamp,
                    ).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>Application #{applicationId.slice(-6)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">
              Application Progress
            </span>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700">
              {applicationStatus[applicationData.data.status]}
            </Badge>
          </div>
          <div className="w-full">
            <ApplicationStatusProgress
              index={applicationData.data.status + 1}
            />
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                if (applicationData.data?.status >= 2) {
                  return toast.warning("Application is already at final stage");
                }
                setOnOpen(1);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4"
            >
              Update Status
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 min-h-0 bg-gray-50">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-6">
            {/* Loading State */}
            {isFetching && allConversations.length === 0 && (
              <div className="flex justify-center items-center py-12">
                <div className="flex items-center gap-3">
                  <Spinner className="w-5 h-5" />
                  <span className="text-gray-600 text-sm">
                    Loading messages...
                  </span>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isFetching && allConversations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No messages yet
                </h3>
                <p className="text-gray-600 text-sm max-w-sm">
                  Send a message to start the conversation with the applicant.
                </p>
              </div>
            )}

            {/* Messages */}
            {!isFetching && allConversations.length > 0 && (
              <div className="space-y-6">
                {Object.entries(groupedMessages).map(([date, messages]) => (
                  <div key={date} className="space-y-4">
                    {/* Date Separator */}
                    <div className="flex justify-center">
                      <div className="bg-white border border-gray-200 px-4 py-2 rounded-full shadow-xs">
                        <span className="text-xs font-medium text-gray-600 flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {date}
                        </span>
                      </div>
                    </div>

                    {/* Messages for this date */}
                    <div className="space-y-4">
                      {messages.map((conversation) => (
                        <div
                          key={conversation.id}
                          className={`flex gap-3 ${
                            conversation.fromHr
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          {!conversation.fromHr && (
                            <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                              <AvatarFallback className="bg-gray-100 text-gray-700 text-xs">
                                {getInitials(
                                  `${applicationData.data.firstname || ""} ${
                                    applicationData.data.lastname || ""
                                  }`,
                                )}
                              </AvatarFallback>
                            </Avatar>
                          )}

                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                              conversation.fromHr
                                ? "bg-blue-600 text-white rounded-br-none"
                                : "bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-xs"
                            }`}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {conversation.messageContent}
                            </p>
                            <div
                              className={`flex items-center gap-2 mt-2 text-xs ${
                                conversation.fromHr
                                  ? "text-blue-100 justify-end"
                                  : "text-gray-500 justify-start"
                              }`}
                            >
                              <span>{formatTime(conversation.timestamp)}</span>
                              {conversation.fromHr && (
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  You
                                </span>
                              )}
                            </div>
                          </div>

                          {conversation.fromHr && (
                            <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                                HR
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Loading More Indicator */}
                {isFetchingNextPage && (
                  <div className="flex justify-center py-4">
                    <div className="flex items-center gap-3 bg-white border border-gray-200 px-4 py-2 rounded-full">
                      <Spinner className="w-4 h-4" />
                      <span className="text-sm text-gray-600">
                        Loading earlier messages...
                      </span>
                    </div>
                  </div>
                )}

                {/* Infinite Scroll Trigger */}
                {hasNextPage && !isFetchingNextPage && (
                  <div ref={ref} className="h-4" />
                )}
              </div>
            )}

            {/* Bottom reference for auto-scroll */}
            <div ref={messagesEndRef} style={{ height: "1px" }} />
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 bg-white p-4 flex-shrink-0">
        {/* Attachment Preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
              >
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700 truncate max-w-[150px]">
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={onSubmit} className="flex gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
          />
          <Button
            type="submit"
            size="icon"
            disabled={
              (!message.trim() && attachments.length === 0) || isSubmitting
            }
            className="flex-shrink-0 bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {/* Status Update Modal */}
      <Modal
        title="Update Application Status"
        children={
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to proceed to{" "}
              <span className="font-semibold text-blue-600">
                {applicationStatus[applicationData.data.status + 1]}
              </span>
              ?
            </p>

            {applicationData.data.status === 1 && (
              <Form {...form}>
                <div>
                  <FormDescription>Mark this application as:</FormDescription>
                  <FormField
                    control={control}
                    name="accepted"
                    render={({ field }) => (
                      <FormItem className=" mt-1.5">
                        <div className=" w-full flex items-center gap-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(e) => field.onChange(e)}
                            />
                          </FormControl>
                          <FormLabel>Accepted</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="sendInviteLink"
                    render={({ field }) => (
                      <FormItem className=" mt-1.5">
                        <div className=" w-full flex items-center gap-2">
                          <FormControl>
                            <Checkbox
                              disabled={!accepted}
                              checked={field.value}
                              onCheckedChange={(e) => field.onChange(e)}
                            />
                          </FormControl>
                          <FormLabel>Send Invitation through email</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </Form>
            )}
            <p className="text-orange-600">
              You cannot undo this action afterwards.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setOnOpen(0)}
                className="rounded-lg"
              >
                Cancel
              </Button>
              <Button
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-700 rounded-lg"
                onClick={handleConfirm}
              >
                {isPending ? "Processing..." : "Confirm"}
              </Button>
            </div>
          </div>
        }
        onOpen={onOpen === 1}
        footer={1}
        className="max-w-md"
        setOnOpen={() => {
          if (isPending) return;
          setOnOpen(0);
        }}
        loading={isPending}
      />
    </div>
  );
};

export default ApplicationProgress;
