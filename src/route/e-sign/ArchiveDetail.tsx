import axios from "@/db/axios";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";

import { archiveDetail } from "@/db/statements/document";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import RemoveFromAcrhive from "@/layout/e-sign/RemoveFromAcrhive";

import {
  Download,
  FileText,
  Calendar,
  Hash,
  ArchiveIcon,
  ArrowLeft,
  Loader2,
  Building2,
  Network,
} from "lucide-react";

import type { ArchiveDocument } from "@/interface/data";
import { archiveDocType } from "@/utils/helper";

const formatDateTime = (iso?: Date | string | null) => {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const ArchiveDetail = () => {
  const auth = useAuth();
  const nav = useNavigate();
  const { archiveId, lineId } = useParams();

  const { data, isFetching } = useQuery<ArchiveDocument>({
    queryKey: ["archive-detail", archiveId],
    queryFn: () => archiveDetail(auth.token as string, archiveId as string),
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    enabled: !!archiveId && !!auth.token,
  });

  const handleDownloadFile = async () => {
    const response = await axios.get("/document/download/file", {
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "X-Requested-With": "XMLHttpRequest",
      },
      responseType: "blob",
      params: { id: archiveId },
    });

    const contentDisposition = response.headers["content-disposition"];
    let filename = `document_${archiveId}`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="(.+)"/);
      if (match?.[1]) filename = match[1];
    }

    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const { mutateAsync: download, isPending: isDownloading } = useMutation({
    mutationFn: handleDownloadFile,
    onSuccess: () =>
      toast.success("Download started", {
        description: "The file is being saved to your downloads.",
      }),
    onError: (err) =>
      toast.error("Download failed", {
        description: err.message,
      }),
  });

  // ── Loading ──────────────────────────────────────────────────────────
  if (isFetching && !data) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="text-xs">Loading archive details...</p>
        </div>
      </div>
    );
  }

  // ── Not Found ────────────────────────────────────────────────────────
  if (!data) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-3">
        <div className="border rounded-lg bg-white p-6 text-center max-w-sm w-full">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center">
            <ArchiveIcon className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Archive Not Found
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            This archived document doesn't exist or you don't have permission to
            view it.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1.5"
            onClick={() => nav(-1)}
          >
            <ArrowLeft className="h-3 w-3" />
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
      <div className="p-3 max-w-6xl mx-auto space-y-3">

        {/* Header */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 min-w-0">
              <ArchiveIcon className="h-3 w-3 text-blue-500" />
              <div className="min-w-0">
                <h3 className="text-xs font-semibold text-gray-800 truncate">
                  {data.document?.title ?? "Untitled"}
                </h3>
                <p className="text-[10px] text-gray-500 leading-none mt-0.5 font-mono">
                  ID: {data.id}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1.5"
                onClick={() => nav(-1)}
              >
                <ArrowLeft className="h-3 w-3" />
                Back
              </Button>
              <Button
                size="sm"
                disabled={isDownloading}
                onClick={() => download()}
                className="h-7 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700"
              >
                {isDownloading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Download className="h-3 w-3" />
                )}
                Download
              </Button>
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

          {/* Left column — content (2/3) */}
          <div className="lg:col-span-2 space-y-3">

            {/* Document content */}
            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
                <FileText className="h-3 w-3 text-blue-500" />
                <h4 className="text-xs font-semibold text-gray-800">
                  Document
                </h4>
              </div>
              <div className="p-3">
                {data.document ? (
                  <>
                    <p className="text-sm font-semibold text-gray-900">
                      {data.document.title || "Untitled Document"}
                    </p>
                    {data.document.timestamp && (
                      <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                        <Calendar className="h-2.5 w-2.5" />
                        Last updated {formatDateTime(data.document.timestamp)}
                      </p>
                    )}
                    <div className="mt-3 p-3 bg-gray-50 border rounded-md">
                      <p className="text-xs text-gray-500 italic">
                        Click <strong>Download</strong> above to view the
                        original file.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <FileText className="h-7 w-7 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">
                      No document attached
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Abstract */}
            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="px-3 py-2 border-b bg-gray-50">
                <h4 className="text-xs font-semibold text-gray-800">
                  Abstract
                </h4>
              </div>
              <div className="p-3">
                {data.abstract ? (
                  <div className="space-y-2">
                    {data.abstract.title && (
                      <p className="text-xs font-semibold text-gray-800">
                        {data.abstract.title}
                      </p>
                    )}
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {data.abstract.content || "No abstract content."}
                    </p>
                    {data.abstract.timestamp && (
                      <p className="text-[10px] text-gray-400 pt-2 border-t">
                        Created {formatDateTime(data.abstract.timestamp)}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    No abstract recorded for this document.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right column — metadata (1/3) */}
          <div className="space-y-3">

            {/* Document info */}
            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="px-3 py-2 border-b bg-gray-50">
                <h4 className="text-xs font-semibold text-gray-800">
                  Information
                </h4>
              </div>
              <div className="p-3 space-y-2.5">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                    Status
                  </p>
                  <Badge
                    variant={data.status === 1 ? "default" : "secondary"}
                    className="text-[10px] px-1.5 py-0 mt-1"
                  >
                    {data.status === 1 ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                    Type
                  </p>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-1">
                    {archiveDocType[data.docType ?? 0] ?? "Other"}
                  </Badge>
                </div>

                {data.documentId && (
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      <Hash className="h-2.5 w-2.5" /> Document ID
                    </p>
                    <p className="text-[10px] font-mono text-gray-700 break-all mt-1">
                      {data.documentId}
                    </p>
                  </div>
                )}

                {data.timestamp && (
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      <Calendar className="h-2.5 w-2.5" /> Archived
                    </p>
                    <p className="text-xs text-gray-700 mt-1">
                      {formatDateTime(data.timestamp)}
                    </p>
                  </div>
                )}

                {data.retentionDate && (
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                      Retention Date
                    </p>
                    <p className="text-xs text-gray-700 mt-1">
                      {formatDateTime(data.retentionDate)}
                    </p>
                  </div>
                )}

                {data.safeDate && (
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                      Safe Date
                    </p>
                    <p className="text-xs text-gray-700 mt-1">
                      {formatDateTime(data.safeDate)}
                    </p>
                  </div>
                )}

                {data.receivingRoom && (
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      <Building2 className="h-2.5 w-2.5" /> Receiving Room
                    </p>
                    <p className="text-xs text-gray-700 mt-1">
                      {data.receivingRoom.address}
                    </p>
                    {data.receivingRoom.code && (
                      <p className="text-[10px] text-gray-400">
                        Code: {data.receivingRoom.code}
                      </p>
                    )}
                  </div>
                )}

                {data.line && (
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      <Network className="h-2.5 w-2.5" /> Line
                    </p>
                    <p className="text-xs text-gray-700 mt-1">
                      {data.line.name || data.lineId || "N/A"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="px-3 py-2 border-b bg-gray-50">
                <h4 className="text-xs font-semibold text-gray-800">Actions</h4>
              </div>
              <div className="p-3 space-y-2">
                <RemoveFromAcrhive
                  token={auth.token as string}
                  userId={auth.userId as string}
                  lineId={lineId as string}
                  id={data.id}
                  roomId={data.receivingRoomId as string}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchiveDetail;
