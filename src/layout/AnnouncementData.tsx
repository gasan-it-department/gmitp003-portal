import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router";
import { toast } from "sonner";

import { useAuth } from "@/provider/ProtectedRoute";
import { announcementData, toogleReaction } from "@/db/statements/announcement";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import {
  Heart,
  Eye,
  AtSign,
  Megaphone,
  Loader2,
  FileText,
  Download,
  Calendar,
} from "lucide-react";

import type { Announcement } from "@/interface/data";

const statusMeta: Record<
  number,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  0: { label: "Draft",     variant: "secondary"   },
  1: { label: "Published", variant: "default"     },
  2: { label: "Paused",    variant: "outline"     },
  3: { label: "Archived",  variant: "destructive" },
};

const formatBytes = (size: string) => {
  const bytes = parseInt(size, 10) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const formatFileExt = (type?: string | null) => {
  if (!type) return "FILE";
  const sub = type.split("/")[1];
  return (sub || type).toUpperCase().slice(0, 4);
};

const AnnouncementData = () => {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const { announcementDataId } = useParams();

  const { data, isFetching } = useQuery<Announcement>({
    queryKey: ["announcement", announcementDataId],
    queryFn: () =>
      announcementData(
        auth.token as string,
        announcementDataId as string,
        auth.userId as string,
      ),
    enabled: !!auth.token && !!announcementDataId,
    refetchOnWindowFocus: false,
  });

  const reactionMutate = useMutation({
    mutationFn: () =>
      toogleReaction(
        auth.token as string,
        announcementDataId as string,
        auth.userId as string,
        data?.reacted,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["announcement", announcementDataId],
        refetchType: "active",
      });
    },
    onError: (err) =>
      toast.error("Failed to react", { description: err.message }),
  });

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

  // ── Not found ────────────────────────────────────────────────────────
  if (!data) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="border rounded-lg bg-white p-6 text-center max-w-sm w-full">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <Megaphone className="h-6 w-6 text-gray-300" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Announcement not found
          </h3>
          <p className="text-[10px] text-gray-500">
            It may have been removed or you don't have permission to view it.
          </p>
        </div>
      </div>
    );
  }

  const status = statusMeta[data.status] ?? statusMeta[0];
  const isOwnAuthor = data.author?.id === auth.userId;
  const authorName = data.author
    ? `${data.author.firstName} ${data.author.lastName}`
    : "Unknown Author";
  const authorInitials = data.author
    ? `${data.author.firstName?.[0] ?? ""}${data.author.lastName?.[0] ?? ""}`
    : "?";

  return (
    <div className="w-full h-full overflow-auto bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-3 max-w-3xl mx-auto space-y-3">

        {/* ── Header card ─────────────────────────────────────────────── */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Megaphone className="h-3 w-3 text-blue-500" />
              <span className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                Announcement
              </span>
            </div>
            <Badge variant={status.variant} className="text-[10px] px-1.5 py-0">
              {status.label}
            </Badge>
          </div>

          <div className="p-3 space-y-3">
            {/* Title */}
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
              {data.title || (
                <span className="text-gray-400 italic">Untitled</span>
              )}
            </h1>

            {/* Author + date */}
            <div className="flex items-center gap-2.5">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-xs font-medium bg-blue-100 text-blue-700">
                  {authorInitials.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">
                  {authorName}
                  {isOwnAuthor && (
                    <span className="text-[10px] text-gray-400 ml-1">(You)</span>
                  )}
                </p>
                <p className="text-[10px] text-gray-500 flex items-center gap-0.5">
                  <Calendar className="h-2.5 w-2.5" />
                  {new Date(data.createdAt).toLocaleDateString("en-PH", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Content card ────────────────────────────────────────────── */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50">
            <h4 className="text-xs font-semibold text-gray-800">Content</h4>
          </div>
          <div className="p-4">
            {data.content ? (
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {data.content}
              </p>
            ) : (
              <p className="text-xs text-gray-400 italic">
                No content has been written for this announcement.
              </p>
            )}
          </div>
        </div>

        {/* ── Attachments card ────────────────────────────────────────── */}
        {data.files && data.files.length > 0 && (
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
              <FileText className="h-3 w-3 text-blue-500" />
              <h4 className="text-xs font-semibold text-gray-800">
                Attachments
              </h4>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {data.files.length}
              </Badge>
            </div>
            <div className="divide-y divide-gray-100">
              {data.files.map((file) => (
                <a
                  key={file.id}
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-2 px-3 py-2 hover:bg-blue-50/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-semibold text-blue-700">
                        {formatFileExt(file.file_type)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate group-hover:text-blue-700">
                        {file.file_name}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {formatBytes(file.file_size)} · {file.file_type}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-blue-600 flex items-center gap-0.5 flex-shrink-0">
                    <Download className="h-3 w-3" />
                    Download
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── Stats / reaction footer ─────────────────────────────────── */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="p-3 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center">
                  <Eye className="h-3.5 w-3.5 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900 leading-none">
                    {data._count.views ?? 0}
                  </p>
                  <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                    Views
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center">
                  <AtSign className="h-3.5 w-3.5 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900 leading-none">
                    {data._count.mentions ?? 0}
                  </p>
                  <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                    Mentions
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-7 w-7 rounded-full bg-red-50 flex items-center justify-center">
                  <Heart className="h-3.5 w-3.5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900 leading-none">
                    {data._count.reactions ?? 0}
                  </p>
                  <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                    Reactions
                  </p>
                </div>
              </div>
            </div>

            <Button
              size="sm"
              variant={data.reacted ? "default" : "outline"}
              disabled={reactionMutate.isPending}
              onClick={() => reactionMutate.mutateAsync()}
              className={`h-8 text-xs gap-1.5 ${
                data.reacted ? "bg-red-500 hover:bg-red-600" : ""
              }`}
            >
              {reactionMutate.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Heart
                  className="h-3 w-3"
                  fill={data.reacted ? "currentColor" : "none"}
                />
              )}
              {data.reacted ? "Reacted" : "React"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementData;
