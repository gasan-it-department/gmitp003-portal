import axios from "@/db/axios";
import { useState, type SetStateAction } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
import { useParams, useNavigate } from "react-router";

//
import { archiveDetail, removeArchiveDocument } from "@/db/statements/document";

//
import { Button } from "@/components/ui/button";
import { Download, FileText, Calendar, Hash, ArchiveIcon } from "lucide-react";
import { toast } from "sonner";
import ConfirmDelete from "@/layout/ConfirmDelete";
//
import type { ArchiveDocument } from "@/interface/data";
import Modal from "@/components/custom/Modal";

const ArchiveDetail = () => {
  const [isOpen, setIsOpen] = useState(0);
  const auth = useAuth();
  const { archiveId } = useParams();
  const navigate = useNavigate();

  const { data, isFetching } = useQuery<ArchiveDocument>({
    queryKey: ["archive-detail", archiveId],
    queryFn: () => archiveDetail(auth.token as string, archiveId as string),
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const handleDownloadFile = async () => {
    try {
      const response = await axios.get("/document/download/file", {
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "X-Requested-With": "XMLHttpRequest",
        },
        responseType: "blob",
        params: {
          id: archiveId,
        },
      });

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers["content-disposition"];
      let filename = `document_${archiveId}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Use the actual content type from the response
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      // Clean up
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Download started!", {
        description: "Your file is being downloaded.",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Download Failed", {
        description: "Failed to download the file. Please try again.",
      });
    }
  };

  const { mutateAsync, isPending } = useMutation({
    mutationFn: handleDownloadFile,
  });

  const removeArchiveMutation = useMutation({
    mutationFn: () =>
      removeArchiveDocument(
        auth.token as string,
        archiveId as string,
        auth.userId as string,
      ),
    onSuccess: () => {
      navigate(-1);
    },
    onError: () => {
      toast.error("TRANSACTION FAILED");
    },
  });

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <ArchiveIcon className="h-6 w-6 text-gray-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-600 font-medium">
            Loading archive details...
          </p>
          <p className="text-sm text-gray-400 mt-1">Please wait</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <ArchiveIcon className="h-10 w-10 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Archive Not Found
          </h3>
          <p className="text-gray-500 mb-4">
            The archived document you're looking for doesn't exist or you don't
            have permission to view it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Archive Document
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Document ID: {data.id}
                </p>
              </div>
            </div>
            <Button
              disabled={isPending}
              onClick={() => {
                mutateAsync();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Column (2/3 on desktop) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Document Content Card */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  Document Content
                </h2>
              </div>
              <div className="p-6">
                {data.document ? (
                  <div className="prose max-w-none">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {data.document.title || "Untitled Document"}
                    </h3>
                    <div className="text-gray-700 whitespace-pre-wrap">
                      {"No content available"}
                    </div>
                    {data.document.timestamp && (
                      <div className="mt-4 pt-4 border-t text-sm text-gray-500 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Last updated:{" "}
                        {new Date(data.document.timestamp).toLocaleString()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      No document content available
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Abstract Section */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-800">
                  Abstract
                </h2>
              </div>
              <div className="p-6">
                {data.abstract ? (
                  <div className="space-y-4">
                    {data.abstract.title && (
                      <div>
                        <h3 className="text-md font-semibold text-gray-700 mb-2">
                          {data.abstract.title}
                        </h3>
                      </div>
                    )}
                    <div className="text-gray-600 leading-relaxed">
                      {data.abstract.content || "No abstract content available"}
                    </div>
                    {data.abstract.timestamp && (
                      <div className="pt-4 border-t text-sm text-gray-500">
                        Created:{" "}
                        {new Date(data.abstract.timestamp).toLocaleString()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      No abstract available for this document
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Right Column (1/3 on desktop) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Document Information Card */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-800">
                  Document Information
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </label>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        data.status === 1
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {data.status === 1 ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {data.documentId && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      Document ID
                    </label>
                    <p className="mt-1 text-sm font-mono text-gray-700 break-all">
                      {data.documentId}
                    </p>
                  </div>
                )}

                {data.timestamp && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Archive Date
                    </label>
                    <p className="mt-1 text-sm text-gray-700">
                      {new Date(data.timestamp).toLocaleString()}
                    </p>
                  </div>
                )}

                {data.receivingRoom && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receiving Room
                    </label>
                    <div className="mt-1 space-y-1">
                      <p className="text-sm text-gray-700">
                        {data.receivingRoom.address}
                      </p>
                      <p className="text-xs text-gray-500">
                        Code: {data.receivingRoom.code}
                      </p>
                    </div>
                  </div>
                )}

                {data.line && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Line
                    </label>
                    <p className="mt-1 text-sm text-gray-700">
                      {data.line.name || data.lineId || "N/A"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-800">
                  Quick Actions
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    /* Handle restore */
                  }}
                >
                  <ArchiveIcon className="h-4 w-4 mr-2" />
                  Restore Document
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setIsOpen(1)}
                >
                  Delete Permanently
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal
        title={undefined}
        footer={1}
        children={
          <ConfirmDelete
            confirmation={"confirm"}
            setOnOpen={() => {
              if (removeArchiveMutation.isPending) return;
              setIsOpen(0);
            }}
            onFunction={() => {
              removeArchiveMutation.mutateAsync();
            }}
            isLoading={removeArchiveMutation.isPending}
          />
        }
        onOpen={isOpen === 1}
        className={""}
        setOnOpen={() => {
          if (removeArchiveMutation.isPending) return;
          setIsOpen(0);
        }}
      />
    </div>
  );
};

export default ArchiveDetail;
