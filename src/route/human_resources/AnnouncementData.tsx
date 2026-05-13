import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import axios from "@/db/axios";
import {
  announcementData,
  announcementStatusUpdate,
  removeAnnouncement,
} from "@/db/statements/announcement";
import { useAuth } from "@/provider/ProtectedRoute";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Modal from "@/components/custom/Modal";
import ConfirmDelete from "@/layout/ConfirmDelete";
import UserSelection from "@/layout/UserSelection";
import {
  Form,
  FormControl,
  FormDescription,
  FormItem,
  FormField,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  AtSign,
  BookOpenCheck,
  ClipboardX,
  PauseCircle,
  PlayCircle,
  Loader2,
  Megaphone,
  X,
  Users as UsersIcon,
} from "lucide-react";

import { AnnouncementFormSchema } from "@/interface/zod";
import type {
  Announcement,
  AnnouncementFormProps,
  User,
} from "@/interface/data";

const statusMeta: Record<
  number,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  0: { label: "Draft",     variant: "secondary"   },
  1: { label: "Published", variant: "default"     },
  2: { label: "Paused",    variant: "outline"     },
  3: { label: "Archived",  variant: "destructive" },
};

const AnnouncementData = () => {
  const [onOpen, setOnOpen] = useState(0);
  const auth = useAuth();
  const nav = useNavigate();
  const { announcementId, lineId } = useParams();
  const queryClient = useQueryClient();

  const { data, isFetching } = useQuery<Announcement>({
    queryKey: ["announcement-data", announcementId, "announcements", lineId],
    queryFn: () =>
      announcementData(
        auth.token as string,
        announcementId as string,
        auth.userId as string,
      ),
    enabled: !!auth.token && !!announcementId,
    refetchOnWindowFocus: false,
  });

  const form = useForm<AnnouncementFormProps>({
    resolver: zodResolver(AnnouncementFormSchema),
    defaultValues: { title: "", content: "", mentions: [] },
  });

  useEffect(() => {
    if (data) {
      form.reset({
        title: data.title || "",
        content: data.content || "",
        mentions: [],
      });
    }
  }, [data, form]);

  const {
    formState: { isSubmitting, errors },
    handleSubmit,
    control,
    watch,
  } = form;

  const contentValue = watch("content");
  const isPublished = data?.status === 1;
  const isLocked = isPublished; // can't edit title/content while published

  const onSubmit = async (formData: AnnouncementFormProps) => {
    if (!announcementId || !lineId || !auth.userId) {
      toast.error("Missing required data");
      return;
    }
    if (!data) {
      toast.error("Announcement not loaded");
      return;
    }
    try {
      const response = await axios.patch(
        "/announcement/publish",
        {
          title: formData.title,
          content: formData.content,
          authorId: auth.userId,
          lineId,
          id: announcementId,
          // Toggle: from draft → published, from published → draft
          status: data.status === 1 ? 0 : 1,
          mentions: formData.mentions
            ? formData.mentions.map((m) => m.id)
            : [],
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
        throw new Error(response.data?.message ?? "Failed");
      }

      await queryClient.invalidateQueries({
        queryKey: ["announcement-data", announcementId],
        refetchType: "active",
      });
      toast.success(
        data.status === 1
          ? "Announcement withdrawn"
          : "Announcement published",
      );
      setOnOpen(0);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        (err instanceof Error ? err.message : "Failed to submit");
      toast.error(msg);
    }
  };

  const updateStatus = useMutation({
    mutationFn: async (status: number) => {
      if (!auth.token || !auth.userId || !lineId || !announcementId) {
        throw new Error("Unauthorized");
      }
      return announcementStatusUpdate(
        auth.token,
        announcementId,
        auth.userId,
        status,
        lineId,
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["announcement-data", announcementId],
        refetchType: "active",
      });
      toast.success("Status updated");
    },
    onError: (err) => {
      toast.error("Failed to update status", { description: err.message });
    },
  });

  const removeAnnouncementMutation = useMutation({
    mutationFn: () =>
      removeAnnouncement(
        auth.token as string,
        announcementId as string,
        lineId as string,
        auth.userId as string,
      ),
    onSuccess: () => {
      toast.success("Announcement discarded");
      nav(-1);
    },
    onError: () => {
      toast.error("Failed to discard", { description: "Please try again" });
    },
  });

  const mentions = useFieldArray({ control, name: "mentions" });

  const handleAddMention = (user: User) => {
    if (mentions.fields.find((m) => m.id === user.id)) return;
    mentions.append({
      id: user.id,
      username: user.username,
      firstname: user.firstName,
      lastname: user.lastName,
    });
    toast.success(`Mentioned @${user.username}`);
  };

  // ── Loading ──────────────────────────────────────────────────────────
  if (isFetching && !data) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="text-xs">Loading announcement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <div className="p-3 flex-1 flex flex-col min-h-0 max-w-4xl mx-auto w-full">

        {/* Header card */}
        <div className="border rounded-lg bg-white overflow-hidden mb-3">
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 min-w-0">
              <Megaphone className="h-3 w-3 text-blue-500" />
              <div className="min-w-0">
                <h3 className="text-xs font-semibold text-gray-800">
                  {data ? "Edit Announcement" : "Create Announcement"}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {data && (
                    <Badge
                      variant={statusMeta[data.status]?.variant ?? "outline"}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {statusMeta[data.status]?.label ?? "Unknown"}
                    </Badge>
                  )}
                  <span className="text-[10px] text-gray-500 truncate">
                    {data?.title ?? "Untitled"}
                  </span>
                </div>
              </div>
            </div>

            {data && (
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={removeAnnouncementMutation.isPending}
                  onClick={() => setOnOpen(2)}
                  className="h-7 text-xs gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
                >
                  <ClipboardX className="h-3 w-3" />
                  Discard
                </Button>

                {data.status === 0 && (
                  <Button
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => setOnOpen(1)}
                    className="h-7 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700"
                  >
                    <BookOpenCheck className="h-3 w-3" />
                    Publish
                  </Button>
                )}

                {data.status === 1 && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutateAsync(2)}
                    className="h-7 text-xs gap-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 hover:border-amber-200"
                  >
                    <PauseCircle className="h-3 w-3" />
                    Pause
                  </Button>
                )}

                {data.status === 2 && (
                  <Button
                    size="sm"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutateAsync(1)}
                    className="h-7 text-xs gap-1.5 bg-green-600 hover:bg-green-700"
                  >
                    <PlayCircle className="h-3 w-3" />
                    Resume
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 min-h-0 overflow-auto">
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

              {/* Title card */}
              <div className="border rounded-lg bg-white overflow-hidden">
                <div className="px-3 py-2 border-b bg-gray-50">
                  <h4 className="text-xs font-semibold text-gray-800">Title</h4>
                </div>
                <div className="p-3">
                  <FormField
                    disabled={isLocked}
                    control={control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Announcement title"
                            className="h-9 text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-[10px]">
                          A clear, concise title for your announcement
                        </FormDescription>
                        {errors.title && (
                          <FormMessage className="text-[10px]">
                            {errors.title.message}
                          </FormMessage>
                        )}
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Content card */}
              <div className="border rounded-lg bg-white overflow-hidden">
                <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-gray-800">
                    Content
                  </h4>
                  <span className="text-[10px] text-gray-500">
                    {contentValue?.length || 0} characters
                  </span>
                </div>
                <div className="p-3">
                  <FormField
                    disabled={isLocked}
                    control={control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Write the body of your announcement..."
                            className="min-h-[280px] text-xs resize-none"
                            {...field}
                          />
                        </FormControl>
                        {errors.content && (
                          <FormMessage className="text-[10px]">
                            {errors.content.message}
                          </FormMessage>
                        )}
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Mentions card */}
              <div className="border rounded-lg bg-white overflow-hidden">
                <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <UsersIcon className="h-3 w-3 text-blue-500" />
                    <h4 className="text-xs font-semibold text-gray-800">
                      Mentions
                    </h4>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {mentions.fields.length}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isLocked}
                    onClick={() => setOnOpen(3)}
                    className="h-7 text-xs gap-1.5"
                  >
                    <AtSign className="h-3 w-3" />
                    Add mention
                  </Button>
                </div>
                <div className="p-3">
                  {mentions.fields.length === 0 ? (
                    <p className="text-[10px] text-gray-400 italic">
                      No mentions yet. Add specific people to notify them.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {mentions.fields.map((user, i) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-gray-50 border rounded-md"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">
                              {user.lastname}, {user.firstname}
                            </p>
                            <p className="text-[10px] text-gray-500 truncate">
                              @{user.username}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={isLocked}
                            onClick={() => mentions.remove(i)}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {isLocked && (
                <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-100 rounded-md">
                  <PauseCircle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700">
                    This announcement is <strong>Published</strong>. Pause it
                    first to make edits.
                  </p>
                </div>
              )}
            </form>
          </Form>
        </div>
      </div>

      {/* ── Publish Confirmation Modal ───────────────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded-md">
              <BookOpenCheck className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <span className="text-sm font-semibold">Publish Announcement</span>
          </div>
        }
        onOpen={onOpen === 1}
        className="max-w-sm"
        setOnOpen={() => {
          if (isSubmitting) return;
          setOnOpen(0);
        }}
        footer={true}
        yesTitle="Publish"
        loading={isSubmitting}
        onFunction={handleSubmit(onSubmit)}
      >
        <div className="space-y-3 p-1">
          <p className="text-xs text-gray-700">
            Once published, this announcement will be visible to all line
            members. You can pause it afterwards if needed.
          </p>
          <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-100 rounded-md">
            <BookOpenCheck className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-700">
              Make sure your title, content, and mentions are correct before
              publishing.
            </p>
          </div>
        </div>
      </Modal>

      {/* ── Discard Confirmation ─────────────────────────────────────── */}
      <Modal
        title={undefined}
        children={
          <ConfirmDelete
            confirmation={"confirm"}
            setOnOpen={setOnOpen}
            onFunction={() => removeAnnouncementMutation.mutateAsync()}
            isLoading={removeAnnouncementMutation.isPending}
          />
        }
        onOpen={onOpen === 2}
        className=""
        footer={1}
        setOnOpen={() => setOnOpen(0)}
      />

      {/* ── Mention picker ────────────────────────────────────────────── */}
      <Modal
        title={undefined}
        children={
          <UserSelection
            lineId={lineId as string}
            token={auth.token as string}
            onSelect={handleAddMention}
          />
        }
        onOpen={onOpen === 3}
        className="min-w-2xl max-h-11/12 overflow-auto"
        setOnOpen={() => setOnOpen(0)}
      />
    </div>
  );
};

export default AnnouncementData;
