import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import axios from "@/db/axios";
//
import {
  applicationPublicConversation,
  sendPublicApplication,
} from "@/db/statement";
//
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
//
import { MessageSquare, Send, User, Clock, ChevronDown } from "lucide-react";
//
import { formatDate } from "@/utils/date";

//props/interface/schema
import type { ApplicationConversationProps } from "@/interface/data";
import { toast } from "sonner";
interface Props {
  applicationId: string;
  token: string;
}

interface ListProps {
  list: ApplicationConversationProps[];
  hasMore: boolean;
  lastCursor: string | null;
}

const PublicApplicationContact = ({ applicationId, token }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();

  const {
    data,
    isFetchingNextPage,
    hasNextPage,
    isFetching,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["application-conversation", applicationId],
    queryFn: ({ pageParam }) =>
      applicationPublicConversation(
        token,
        applicationId,
        pageParam as string | null,
        "20",
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    enabled: !!applicationId && isOpen,
  });

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [data, isOpen]);

  // Load more messages when scrolling to top
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const allMessages = data?.pages.flatMap((page) => page.list) || [];
  const totalMessages = allMessages.length;

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!applicationId || !token) return toast.warning("INVALID REQUIRED ID");
    try {
      console.log("Sending message:", newMessage);
      const response = await axios.post(
        "/application/send/applicant-conversation",
        {
          applicationId,
          message: newMessage,
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
        throw new Error(response.data.message);
      }
      setNewMessage("");
      await queryClient.invalidateQueries({
        queryKey: ["application-conversation", applicationId],
        refetchType: "active",
      });
    } catch (error) {
      console.log(error);
    }

    // TODO: Implement send message API call
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            className="rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-blue-600 hover:bg-blue-700 h-14 w-14 relative"
            size="icon"
          >
            <MessageSquare className="h-6 w-6" />
            {totalMessages > 0 && (
              <Badge
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500"
                variant="destructive"
              >
                {totalMessages > 9 ? "9+" : totalMessages}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-96 h-[500px] p-0 flex flex-col"
          align="end"
          sideOffset={10}
        >
          {/* Header */}
          <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">
                    Application Conversation
                  </h3>
                  <p className="text-blue-100 text-xs">
                    {totalMessages > 0
                      ? `${totalMessages} messages`
                      : "No messages yet"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-white/20 text-white"
                onClick={() => setIsOpen(false)}
              >
                ×
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Messages Container - This will scroll */}
            <div
              ref={scrollAreaRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto"
            >
              <div className="p-4 space-y-4 min-h-full">
                {/* Load more indicator */}
                {hasNextPage && (
                  <div className="flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="text-xs"
                    >
                      {isFetchingNextPage ? (
                        <Spinner className="h-3 w-3 mr-2" />
                      ) : (
                        <ChevronDown className="h-3 w-3 mr-2" />
                      )}
                      Load older messages
                    </Button>
                  </div>
                )}

                {/* Loading state */}
                {isFetching &&
                  !isFetchingNextPage &&
                  allMessages.length === 0 && (
                    <div className="flex justify-center py-8">
                      <Spinner className="h-6 w-6" />
                    </div>
                  )}

                {/* No messages state */}
                {!isFetching && allMessages.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs mt-1">
                      Start a conversation with the applicant
                    </p>
                  </div>
                )}

                {/* Messages list */}
                {allMessages.map((message, index) => {
                  const isHR = !message.fromHr; // Applicant messages have no hrAdmin
                  const isFirstInGroup =
                    index === 0 ||
                    allMessages[index - 1].hrAdmin?.id !== message.hrAdmin?.id;

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        isHR ? "justify-end" : "justify-start"
                      }`}
                    >
                      {/* Applicant Avatar (LEFT) */}
                      {isHR && isFirstInGroup && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}

                      {/* HR Avatar (RIGHT) */}
                      {!isHR && isFirstInGroup && (
                        <Avatar className="h-8 w-8 flex-shrink-0 order-2">
                          <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                            HR
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={`flex flex-col max-w-[80%] ${
                          isHR ? "items-end" : "items-start"
                        }`}
                      >
                        {isFirstInGroup && (
                          <div
                            className={`flex items-center gap-2 mb-1 ${
                              isHR ? "flex-row-reverse" : ""
                            }`}
                          >
                            <Badge
                              variant="outline"
                              className={`text-xs px-1 py-0 h-4 ${
                                isHR
                                  ? "bg-gray-100 text-gray-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {isHR ? "Applicant" : "HR"}
                            </Badge>
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            isHR
                              ? "bg-white text-gray-900 border border-gray-200 rounded-br-md" // HR - White background
                              : "bg-blue-600 text-white rounded-bl-md" // Applicant - Blue background
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">
                            {message.messageContent}
                          </p>
                        </div>

                        {/* Timestamp */}
                        <div
                          className={`flex items-center gap-1 mt-1 ${
                            isHR ? "flex-row-reverse" : ""
                          }`}
                        >
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {formatDate(message.timestamp)}
                          </span>
                        </div>
                      </div>

                      {/* Spacer for alignment */}
                      {!isHR && <div className="w-8 flex-shrink-0" />}
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-gray-50 flex-shrink-0">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  size="icon"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Press Enter to send
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default PublicApplicationContact;
