import { useEffect, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
import { useInView } from "react-intersection-observer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/db/axios";

import { Search, Plus } from "lucide-react";

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormItem,
  FormMessage,
  FormField,
  FormLabel,
} from "@/components/ui/form";
import Modal from "@/components/custom/Modal";

//
import { formatDate } from "@/utils/date";
import { searchedChar } from "@/utils/element";

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

  const {
    data,
    isFetchingNextPage,
    isFetching,
    refetch,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery<ListProps>({
    queryFn: ({ pageParam }) =>
      announcements(
        auth.token as string,
        lineId as string,
        pageParam as string | null,
        "20"
      ),
    queryKey: ["announcement", lineId],
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

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <Badge variant="destructive">Draft</Badge>;
      case 1:
        return <Badge variant="default">Published</Badge>;
      case 2:
        return <Badge variant="secondary">Paused</Badge>;
      case 3:
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
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
        }
      );

      if (response.status !== 200) {
        throw new Error(response.data.message);
      }
      await queryClient.invalidateQueries({
        queryKey: ["announcement", lineId],
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
    <div className="w-full h-full flex flex-col p-4 md:p-6 space-y-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">
            Stay updated with the latest announcements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="gap-2" onClick={() => setOnOpen(1)}>
            <Plus className="h-4 w-4" />
            New Announcement
          </Button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            All
          </Button>
          <Button variant="ghost" size="sm">
            Published
          </Button>
          <Button variant="ghost" size="sm">
            Drafts
          </Button>
        </div>
      </div>

      {/* Announcements Grid */}
      <ScrollArea className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
          {allAnnouncements.map((announcement) => (
            <Card
              key={announcement.id}
              className="hover:shadow-lg transition-shadow duration-200 h-fit cursor-pointer"
              onClick={() => nav(announcement.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-2">
                    {announcement.title}
                  </CardTitle>
                  {getStatusBadge(announcement.status)}
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Avatar className="h-8 w-8">
                    {/* <AvatarImage
                      src={announcement.author.avatar}
                      alt={announcement.author.firstName}
                    /> */}
                    {/* <AvatarFallback>
                      {getInitials(announcement.author.name)}
                    </AvatarFallback> */}
                  </Avatar>
                  <div className="text-sm">
                    {/* <p className="font-medium">{announcement.author.name}</p> */}
                    {/* <p className="text-muted-foreground">
                      {format(new Date(announcement.createdAt), "MMM d, yyyy")}
                    </p> */}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground line-clamp-3">
                  {announcement.content}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-4 px-0"
                  onClick={() => {
                    // Handle read more
                  }}
                >
                  Read more →
                </Button>
              </CardContent>
              <CardFooter>
                <CardContent className=" text-sm text-muted-foreground">
                  {formatDate(announcement.createdAt)}
                </CardContent>
              </CardFooter>
            </Card>
          ))}

          {/* Loading Skeletons */}
          {(isFetching || isFetchingNextPage) && (
            <>
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={`skeleton-${index}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3 mb-4" />
                    <Skeleton className="h-8 w-24" />
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>

        {/* Infinite scroll trigger */}
        <div ref={ref} className="h-10 flex items-center justify-center">
          {hasNextPage ? (
            <p className="text-sm text-muted-foreground">Loading more...</p>
          ) : allAnnouncements.length > 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No more announcements to load
            </p>
          ) : null}
        </div>

        {/* Empty State */}
        {!isFetching && allAnnouncements.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No announcements</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              There are no announcements yet. Create your first one to get
              started.
            </p>
            <Button className="mt-4">Create Announcement</Button>
          </div>
        )}
      </ScrollArea>

      <Modal
        title={"New Announcement"}
        footer={true}
        yesTitle="Create"
        children={
          <div>
            <Form {...form}>
              <FormField
                control={control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        disabled={isSubmitting}
                        placeholder="Enter announcement title..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Form>
          </div>
        }
        onFunction={handleSubmit(onSubmit)}
        onOpen={onOpen === 1}
        className={""}
        setOnOpen={() => {
          if (isSubmitting) return;
          setOnOpen(0);
        }}
      />
    </div>
  );
};

export default Announcement;
