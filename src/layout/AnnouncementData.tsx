import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";

import { announcementData, toogleReaction } from "@/db/statements/announcement";

//
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

import type { Announcement } from "@/interface/data";

//icons
import { Heart } from "lucide-react";

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
        auth.userId as string
      ),
    enabled: !!auth.token || !!announcementDataId,
  });

  const toogleReactionMutate = useMutation({
    mutationFn: () =>
      toogleReaction(
        auth.token as string,
        announcementDataId as string,
        auth.userId as string,
        data?.reacted
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["announcement", announcementDataId],
        refetchType: "active",
      });
    },
    onError: (err) => {
      toast.error("TRANSACTION FAILED", {
        description: `${err.message}`,
      });
    },
  });

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-6xl text-gray-400 mb-4">📄</div>
        <h2 className="mb-2 text-2xl font-semibold text-gray-600">
          Announcement Not Found
        </h2>
        <p className="text-gray-500">
          The announcement you're looking for doesn't exist or has been removed.
        </p>
      </div>
    );
  }

  const formatFileSize = (size: string) => {
    const bytes = parseInt(size);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="h-full overflow-auto px-4 py-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg">
          {/* Header */}
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-gray-600">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="font-semibold text-blue-600">
                      {data.author?.username?.charAt(0) || "U"}
                    </span>
                  </div>
                  <div className="ml-3">
                    {data.author ? (
                      <p className="font-medium text-gray-900">
                        {`${data.author.firstName} ${data.author.lastName}`}{" "}
                        {data.author.id === auth.userId && "(You)"}
                      </p>
                    ) : (
                      <p className="font-medium text-gray-900">
                        {"Unknown Author"}
                      </p>
                    )}

                    <p className="text-sm text-gray-500">
                      {new Date(data.createdAt).toLocaleDateString("en-US", {
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

            <h1 className="text-4xl font-bold text-gray-900 leading-tight">
              {data.title}
            </h1>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-lg">
                {data.content}
              </div>
            </div>

            {/* Files Section */}
            {data.files && data.files.length > 0 && (
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Attachments
                </h3>
                <div className="grid gap-3">
                  {data.files.map((file) => (
                    <a
                      key={file.id}
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {file.file_type.split("/")[1]?.toUpperCase() ||
                              "FILE"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {file.file_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(file.file_size)} • {file.file_type}
                          </p>
                        </div>
                      </div>
                      <span className="text-blue-600 font-medium">
                        Download
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Stats Section */}
            <div className="mt-12 pt-8 border-t border-gray-200 flex justify-between items-center">
              <div className="flex space-x-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {data._count.views || 0}
                  </div>
                  <div className="text-sm text-gray-600">Seen</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {data._count.mentions || 0}
                  </div>
                  <div className="text-sm text-gray-600">Mentions</div>
                </div>
              </div>
              <div className=" h-full flex items-center">
                {toogleReactionMutate.isPending ? (
                  <Spinner />
                ) : (
                  <button
                    onClick={() => toogleReactionMutate.mutateAsync()}
                    className=" flex gap-1 items-center"
                  >
                    <Heart
                      fill={data.reacted ? "red" : "white"}
                      strokeWidth={data.reacted ? "1px" : ""}
                    />
                    {data._count.reactions > 0 && (
                      <span>{data._count.reactions}</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementData;
