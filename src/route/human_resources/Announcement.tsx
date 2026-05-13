import { useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
import { useInView } from "react-intersection-observer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import axios from "@/db/axios";

import { announcements } from "@/db/statements/announcement";
import { formatDate } from "@/utils/date";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

import {
  Plus,
  Megaphone,
  CalendarDays,
  User as UserIcon,
  Loader2,
  ChevronRight,
  Info,
} from "lucide-react";

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

const statusMeta: Record<
  number,
  { label: string; bg: string; text: string }
> = {
  0: { label: "Draft",     bg: "bg-gray-100",   text: "text-gray-700"   },
  1: { label: "Published", bg: "bg-green-100",  text: "text-green-700"  },
  2: { label: "Paused",    bg: "bg-amber-100",  text: "text-amber-700"  },
  3: { label: "Archived",  bg: "bg-red-100",    text: "text-red-700"    },
};

const StatusBadge = ({ status }: { status: number }) => {
  const meta = statusMeta[status] ?? {
    label: "Unknown",
    bg: "bg-gray-100",
    text: "text-gray-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-1.5 py-0 text-[10px] font-medium ${meta.bg} ${meta.text}`}
    >
      {meta.label}
    </span>
  );
};

const Announcement = () => {
  const [onOpen, setOnOpen] = useState(0);
  const { lineId } = useParams();
  const auth = useAuth();
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
      refetchOnWindowFocus: false,
    });

  const { ref } = useInView({
    threshold: 0.5,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
  });

  const items = data?.pages.flatMap((p) => p.list) ?? [];
  const total = items.length;
  const isLoading = isFetching && !isFetchingNextPage && total === 0;

  const form = useForm<NewAnnouncementProps>({
    resolver: zodResolver(NewAnnouncementSchema),
    defaultValues: { title: "" },
  });
  const {
    handleSubmit,
    formState: { isSubmitting },
    control,
    reset,
  } = form;

  const onSubmit = async (formData: NewAnnouncementProps) => {
    if (!auth.userId) {
      toast.warning("Missing user authentication");
      return;
    }
    try {
      const response = await axios.post(
        "/announcement/new",
        { lineId, authorId: auth.userId, title: formData.title },
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
        throw new Error(response.data?.message ?? "Failed to create");
      }

      await queryClient.invalidateQueries({
        queryKey: ["announcements", lineId],
        refetchType: "active",
      });
      setOnOpen(0);
      reset();
      nav(`${response.data.id}`);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        (err instanceof Error ? err.message : "Failed to submit");
      toast.error(msg);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <div className="p-3 flex-1 flex flex-col min-h-0">

        {/* Header */}
        <div className="border rounded-lg bg-white overflow-hidden mb-3">
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Megaphone className="h-3 w-3 text-blue-500" />
              <div>
                <h3 className="text-xs font-semibold text-gray-800">
                  Announcements
                </h3>
                <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                  {total} announcement{total !== 1 ? "s" : ""} on this line
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="h-7 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700"
              onClick={() => setOnOpen(1)}
            >
              <Plus className="h-3 w-3" />
              New Announcement
            </Button>
          </div>
        </div>

        {/* List area */}
        <div className="flex-1 overflow-auto min-h-0">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="border rounded-lg bg-white overflow-hidden"
                >
                  <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-7 w-7 rounded-full" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-2.5 w-24" />
                        <Skeleton className="h-2 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-2.5 w-full" />
                    <Skeleton className="h-2.5 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : total > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((a) => (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => nav(a.id)}
                  className="group border rounded-lg bg-white overflow-hidden hover:border-blue-300 hover:shadow-sm transition-all text-left flex flex-col"
                >
                  {/* Card header */}
                  <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-gray-800 group-hover:text-blue-600 transition-colors truncate flex-1">
                      {a.title || "Untitled"}
                    </p>
                    <StatusBadge status={a.status} />
                  </div>

                  {/* Body */}
                  <div className="p-3 flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-[10px]">
                          <UserIcon className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-gray-800 truncate">
                          {a.author?.firstName ?? "Unknown"}
                          {a.author?.lastName ? ` ${a.author.lastName}` : ""}
                        </p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          <CalendarDays className="h-2.5 w-2.5" />
                          {formatDate(a.createdAt)}
                        </p>
                      </div>
                    </div>

                    <p className="text-[10px] text-gray-600 line-clamp-3">
                      {a.content || (
                        <span className="text-gray-400 italic">
                          No content yet
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="px-3 py-1.5 border-t bg-gray-50 flex items-center justify-end">
                    <span className="text-[10px] text-blue-600 group-hover:underline flex items-center gap-0.5">
                      Open
                      <ChevronRight className="h-2.5 w-2.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </button>
              ))}

              {/* Infinite scroll trigger */}
              {hasNextPage && (
                <div ref={ref} className="col-span-full h-10" />
              )}

              {isFetchingNextPage && (
                <div className="col-span-full flex items-center justify-center gap-1.5 py-3 text-gray-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-[10px]">Loading more...</span>
                </div>
              )}

              {!hasNextPage && total > 0 && (
                <div className="col-span-full text-center py-2">
                  <p className="text-[10px] text-gray-400">
                    All {total} announcement{total !== 1 ? "s" : ""} loaded
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="border rounded-lg bg-white p-8 text-center max-w-sm">
                <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Megaphone className="h-6 w-6 text-gray-300" />
                </div>
                <h3 className="text-xs font-semibold text-gray-700 mb-1">
                  No announcements yet
                </h3>
                <p className="text-[10px] text-gray-500 mb-3">
                  Share important updates, news, or announcements with your team.
                </p>
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700"
                  onClick={() => setOnOpen(1)}
                >
                  <Plus className="h-3 w-3" />
                  Create First Announcement
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Announcement Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded-md">
              <Megaphone className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                New Announcement
              </h3>
              <p className="text-[10px] text-gray-500">
                Give it a clear title — you can add content next
              </p>
            </div>
          </div>
        }
        footer={true}
        yesTitle="Create"
        loading={isSubmitting}
        onFunction={handleSubmit(onSubmit)}
        onOpen={onOpen === 1}
        className="max-w-sm"
        setOnOpen={() => {
          if (isSubmitting) return;
          setOnOpen(0);
        }}
      >
        <div className="space-y-3 p-1">
          <Form {...form}>
            <FormField
              control={control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold text-gray-700">
                    Title *
                  </FormLabel>
                  <FormControl>
                    <Input
                      disabled={isSubmitting}
                      placeholder="e.g. Office holiday schedule 2026"
                      className="h-8 text-xs"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-[10px]">
                    A clear title helps people grasp what it's about
                  </FormDescription>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />
          </Form>

          <div className="flex items-start gap-2 p-2.5 bg-blue-50 border border-blue-100 rounded-md">
            <Info className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-700">
              You'll add the body, mentions, and publish status on the next screen.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Announcement;
