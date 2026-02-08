import { useEffect, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
import { useInView } from "react-intersection-observer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/db/axios";

import { Plus, Megaphone, CalendarDays, User } from "lucide-react";

import { announcements } from "@/db/statements/announcement";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormItem,
  FormMessage,
  FormField,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import Modal from "@/components/custom/Modal";
import { Separator } from "@/components/ui/separator";

//
import { formatDate } from "@/utils/date";

import type {
  Announcement as AnnouncementProps,
  NewAnnouncementProps,
} from "@/interface/data";
import { NewAnnouncementSchema } from "@/interface/zod";

interface ListProps {
  list: AnnouncementProps[];
  hasMore: boolean;
  lastCursor: string | null;
}

const Announcement = () => {
  const [onOpen, setOnOpen] = useState(0);
  const { lineId } = useParams();
  const auth = useAuth();
  const { ref, inView } = useInView();
  const queryClient = useQueryClient();
  const nav = useNavigate();

  const { data, isFetchingNextPage, isFetching, hasNextPage, fetchNextPage } =
    useInfiniteQuery<ListProps>({
      queryFn: ({ pageParam }) =>
        announcements(
          auth.token as string,
          lineId as string,
          pageParam as string | null,
          "20",
        ),
      queryKey: ["announcements", lineId],
      initialPageParam: null,
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.lastCursor : undefined,
    });

  // Trigger fetch when scroll reaches bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allAnnouncements = data?.pages.flatMap((page) => page.list) || [];
  const totalAnnouncements = allAnnouncements.length;
  const isLoading =
    isFetching && !isFetchingNextPage && totalAnnouncements === 0;

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return (
          <Badge variant="destructive" className="text-xs">
            Draft
          </Badge>
        );
      case 1:
        return (
          <Badge
            variant="default"
            className="text-xs bg-green-100 text-green-800 hover:bg-green-100"
          >
            Published
          </Badge>
        );
      case 2:
        return (
          <Badge
            variant="secondary"
            className="text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
          >
            Paused
          </Badge>
        );
      case 3:
        return (
          <Badge
            variant="secondary"
            className="text-xs bg-gray-100 text-gray-800 hover:bg-gray-100"
          >
            Archived
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            Unknown
          </Badge>
        );
    }
  };

  const form = useForm<NewAnnouncementProps>({
    resolver: zodResolver(NewAnnouncementSchema),
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    control,
    resetField,
  } = form;

  const onSubmit = async (formData: NewAnnouncementProps) => {
    if (!auth.userId) {
      return toast.warning("INVALID REQUIRED ID");
    }
    try {
      const response = await axios.post(
        "/announcement/new",
        {
          lineId,
          authorId: auth.userId,
          title: formData.title,
        },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
        },
      );

      if (response.status !== 200) {
        throw new Error(response.data.message);
      }
      await queryClient.invalidateQueries({
        queryKey: ["announcements", lineId],
        refetchType: "active",
      });
      setOnOpen(0);
      resetField("title");
      nav(`${response.data.id}`);
    } catch (error) {
      console.log(error);

      toast.error("FAILED TO SUBMIT");
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Megaphone className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Announcements
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Stay updated with the latest news and updates
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isLoading && totalAnnouncements > 0 && (
              <div className="text-sm text-gray-600 px-3 py-1 bg-gray-100 rounded-full">
                {totalAnnouncements} announcement
                {totalAnnouncements !== 1 ? "s" : ""}
              </div>
            )}
            <Button
              className="gap-2 bg-blue-600 hover:bg-blue-700"
              onClick={() => setOnOpen(1)}
            >
              <Plus className="h-4 w-4" />
              New Announcement
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card
                key={`skeleton-${index}`}
                className="overflow-hidden border shadow-sm"
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                </CardContent>
                <CardFooter className="pt-4 border-t bg-gray-50">
                  <Skeleton className="h-4 w-32" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : totalAnnouncements > 0 ? (
          <ScrollArea className="h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
              {allAnnouncements.map((announcement) => (
                <Card
                  key={announcement.id}
                  className="overflow-hidden border hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  onClick={() => nav(announcement.id)}
                >
                  <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex justify-between items-start mb-3">
                      <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {announcement.title}
                      </CardTitle>
                      {getStatusBadge(announcement.status)}
                    </div>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">
                          {announcement.author?.firstName || "Unknown Author"}
                        </p>
                        <div className="flex items-center gap-1 text-gray-500">
                          <CalendarDays className="h-3 w-3" />
                          <span className="text-xs">
                            {formatDate(announcement.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="py-4">
                    <p className="text-gray-600 line-clamp-3 text-sm">
                      {announcement.content || "No content available..."}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-0"
                      >
                        Read more →
                      </Button>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-4 border-t bg-gray-50/50">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 text-gray-500">
                        <CalendarDays className="h-4 w-4" />
                        <span className="text-xs font-medium">
                          {formatDate(announcement.createdAt)}
                        </span>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              ))}

              {/* Infinite scroll loading skeletons */}
              {(isFetching || isFetchingNextPage) && (
                <>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Card
                      key={`loading-${index}`}
                      className="overflow-hidden border"
                    >
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start mb-3">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="py-4">
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3 mb-4" />
                      </CardContent>
                      <CardFooter className="pt-4 border-t bg-gray-50">
                        <Skeleton className="h-4 w-32" />
                      </CardFooter>
                    </Card>
                  ))}
                </>
              )}
            </div>

            {/* Infinite scroll trigger */}
            <div ref={ref} className="h-20 flex items-center justify-center">
              {hasNextPage ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                  <p className="text-sm text-gray-600">
                    Loading more announcements...
                  </p>
                </div>
              ) : totalAnnouncements > 0 ? (
                <div className="text-center py-6">
                  <div className="inline-flex items-center gap-2 text-gray-400">
                    <span className="h-px w-8 bg-gray-300"></span>
                    <span className="text-sm font-medium">
                      All announcements loaded
                    </span>
                    <span className="h-px w-8 bg-gray-300"></span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Showing {totalAnnouncements} announcement
                    {totalAnnouncements !== 1 ? "s" : ""}
                  </p>
                </div>
              ) : null}
            </div>
          </ScrollArea>
        ) : (
          // Empty State
          <div className="h-full flex items-center justify-center">
            <div className="max-w-md text-center space-y-6">
              <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
                <Megaphone className="h-12 w-12 text-gray-400" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-900">
                  No announcements yet
                </h3>
                <p className="text-gray-600">
                  Start sharing important updates, news, or announcements with
                  your team.
                </p>
              </div>
              <Button
                className="gap-2 bg-blue-600 hover:bg-blue-700"
                onClick={() => setOnOpen(1)}
                size="lg"
              >
                <Plus className="h-5 w-5" />
                Create Your First Announcement
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New Announcement Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Megaphone className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Announcement Details
              </h3>
              <p className="text-sm text-gray-500">
                Start by giving your announcement a clear title
              </p>
            </div>
          </div>
        }
        footer={true}
        yesTitle="Create"
        loading={isSubmitting}
        children={
          <Card className="border-none shadow-none">
            <CardContent className="p-2">
              <Form {...form}>
                <FormField
                  control={control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Announcement Title *
                      </FormLabel>
                      <FormControl>
                        <Input
                          disabled={isSubmitting}
                          placeholder="Enter a descriptive title for your announcement..."
                          {...field}
                          className="h-11"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        A clear title helps people understand what the
                        announcement is about
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Form>

              <Separator className="my-6" />

              <div className="rounded-lg bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-semibold text-blue-600">
                        i
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      Information
                    </p>
                    <p className="text-xs text-gray-600">
                      You can add more details, attachments, and customize the
                      announcement after creation.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        }
        onFunction={handleSubmit(onSubmit)}
        onOpen={onOpen === 1}
        className="max-w-lg"
        setOnOpen={() => {
          if (isSubmitting) return;
          setOnOpen(0);
        }}
      />
    </div>
  );
};

export default Announcement;
