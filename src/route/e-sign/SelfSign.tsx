import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useAuth } from "@/provider/ProtectedRoute";
import { useRoom } from "@/provider/DocumentRoomProvider";
//
import {
  archiveSelfSignDoc,
  fetchSignedDocument,
  fetchDocumentFile,
  listSelfSignDocs,
  removeSelfSignDoc,
  uploadSelfSignDoc,
  type SelfSignListRow,
} from "@/db/statements/document";
//
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  PenLine,
  Upload,
  Loader2,
  FileText,
  Inbox,
  CheckCircle2,
  Clock,
  Download,
  Archive as ArchiveIcon,
  Trash2,
} from "lucide-react";

const surfaceErr = (err: unknown, fallback = "Something went wrong") => {
  const e = err as any;
  return e?.response?.data?.message || e?.response?.data?.error || e?.message || fallback;
};

const SelfSign = () => {
  const { lineId } = useParams();
  const auth = useAuth();
  const { room } = useRoom();
  const nav = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { ref } = useInView({
    onChange(inView) {
      if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
  });
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["self-sign", "list", auth.userId, lineId],
    queryFn: ({ pageParam }) =>
      listSelfSignDocs(auth.token as string, {
        userId: auth.userId as string,
        lineId: lineId as string,
        lastCursor: pageParam,
        limit: "20",
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (l) => (l.hasMore ? l.lastCursor : undefined),
    enabled: !!auth.token && !!auth.userId && !!lineId,
    refetchOnMount: "always",
  });

  const rows = useMemo(
    () => (data?.pages ?? []).flatMap((p) => p.list),
    [data],
  );

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
      alert("Only PDF files are allowed.");
      return;
    }
    setUploading(true);
    try {
      const res = await uploadSelfSignDoc(auth.token as string, {
        userId: auth.userId as string,
        lineId: (room?.lineId as string) ?? (lineId as string),
        file,
      });
      await qc.invalidateQueries({ queryKey: ["self-sign", "list"] });
      // Hop straight into the editor.
      nav(res.document.id);
    } catch (e) {
      alert(surfaceErr(e));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const archiveMu = useMutation({
    mutationFn: (id: string) =>
      archiveSelfSignDoc(auth.token as string, {
        documentId: id,
        userId: auth.userId as string,
      }),
    onSuccess: (r) => {
      alert(
        r.existed
          ? "This document is already in the archive."
          : "Archived into the room archive.",
      );
      qc.invalidateQueries({ queryKey: ["self-sign", "list"] });
    },
    onError: (e) => alert(surfaceErr(e)),
  });

  const removeMu = useMutation({
    mutationFn: (id: string) =>
      removeSelfSignDoc(auth.token as string, id, auth.userId as string),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["self-sign", "list"] }),
    onError: (e) => alert(surfaceErr(e)),
  });

  const handleDownload = async (row: SelfSignListRow) => {
    try {
      const blob =
        row.arrangement?.status === 1
          ? await fetchSignedDocument(auth.token as string, row.id)
          : await fetchDocumentFile(auth.token as string, row.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const base = (row.title || row.file?.fileName || "document").replace(
        /\.pdf$/i,
        "",
      );
      a.download =
        row.arrangement?.status === 1
          ? `${base}-signed.pdf`
          : `${base}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(surfaceErr(e));
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => nav("..")}
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
        </Button>
        <div className="h-7 w-7 rounded-md bg-white border flex items-center justify-center">
          <PenLine className="h-3.5 w-3.5 text-gray-700" />
        </div>
        <div>
          <div className="text-xs font-semibold">Self Sign</div>
          <div className="text-[10px] text-gray-500">
            Upload your own document, drop signature boxes, sign all in one
            click.
          </div>
        </div>
        <Button
          size="sm"
          className="h-7 text-xs ml-auto"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5 mr-1" />
          )}
          Upload PDF
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      <div className="flex-1 overflow-auto p-3">
        {isLoading ? (
          <div className="h-40 flex items-center justify-center text-xs text-gray-500">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...
          </div>
        ) : rows.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center">
            <Inbox className="h-6 w-6 text-gray-300 mb-2" />
            <div className="text-xs font-medium text-gray-700">
              Nothing self-signed yet
            </div>
            <div className="text-[10px] text-gray-500">
              Click <span className="font-semibold">Upload PDF</span> to start.
            </div>
          </div>
        ) : (
          <div className="border rounded-lg bg-white overflow-hidden divide-y">
            {rows.map((r) => {
              const signed = r.arrangement?.status === 1;
              return (
                <div
                  key={r.id}
                  className="px-3 py-2 flex items-center gap-3 hover:bg-gray-50"
                >
                  <FileText className="h-4 w-4 text-gray-500 shrink-0" />
                  <div
                    className="min-w-0 flex-1 cursor-pointer"
                    onClick={() => nav(r.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium truncate">
                        {r.title || r.file?.fileName || "Untitled"}
                      </span>
                      {signed ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] h-5 px-1.5 bg-emerald-50 text-emerald-700 border-emerald-200"
                        >
                          <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Signed
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] h-5 px-1.5 bg-amber-50 text-amber-700 border-amber-200"
                        >
                          <Clock className="h-2.5 w-2.5 mr-0.5" /> Draft
                        </Badge>
                      )}
                      {r.archived ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] h-5 px-1.5 bg-blue-50 text-blue-700 border-blue-200"
                        >
                          Archived
                        </Badge>
                      ) : null}
                    </div>
                    <div className="mt-0.5 text-[10px] text-gray-500 flex items-center gap-3">
                      <span>{r.boxCount} signature box{r.boxCount === 1 ? "" : "es"}</span>
                      <span>
                        {signed && r.arrangement?.signedAt
                          ? `Signed ${new Date(r.arrangement.signedAt).toLocaleString()}`
                          : `Uploaded ${new Date(r.timestamp).toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleDownload(r)}
                      title={signed ? "Download signed PDF" : "Download original"}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    {signed && !r.archived ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => archiveMu.mutate(r.id)}
                        disabled={archiveMu.isPending}
                        title="Archive to room"
                      >
                        <ArchiveIcon className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                    {!signed ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50"
                        onClick={() => removeMu.mutate(r.id)}
                        disabled={removeMu.isPending}
                        title="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
            <div ref={ref} className="h-6 flex items-center justify-center">
              {isFetchingNextPage ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelfSign;
