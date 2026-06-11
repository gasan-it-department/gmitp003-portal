import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
import {
  addEvidence,
  complaintDetail,
  fetchEvidence,
  removeEvidence,
  replyComplaint,
  updateComplaintStatus,
  type ComplaintEvidence,
} from "@/db/statements/service";
//
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Modal from "@/components/custom/Modal";
import {
  ArrowLeft,
  Loader2,
  Send,
  MessageSquareWarning,
  User,
  UserX,
  Paperclip,
  Upload,
  X,
  Eye,
  Download,
  Trash2,
} from "lucide-react";

const surfaceErr = (err: unknown, fallback = "Something went wrong") => {
  const e = err as any;
  return e?.response?.data?.message || e?.response?.data?.error || e?.message || fallback;
};

const STATUS: Record<string, { label: string; cls: string }> = {
  open:         { label: "Open",        cls: "bg-amber-50 text-amber-700 border-amber-200" },
  in_progress:  { label: "In Progress", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  resolved:     { label: "Resolved",    cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  closed:       { label: "Closed",      cls: "bg-gray-100 text-gray-700 border-gray-200" },
};

const fullName = (u?: {
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
} | null) =>
  `${u?.firstName ?? ""} ${u?.lastName ?? ""}`.trim() || u?.username || "—";

const ComplaintDetail = () => {
  const { lineId, id } = useParams();
  const auth = useAuth();
  const qc = useQueryClient();
  const [reply, setReply] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["complaint", id],
    queryFn: () => complaintDetail(auth.token as string, id as string),
    enabled: !!auth.token && !!id,
    refetchOnMount: "always",
  });

  const replyMu = useMutation({
    mutationFn: () =>
      replyComplaint(auth.token as string, {
        complaintId: id as string,
        userId: auth.userId as string,
        content: reply,
      }),
    onSuccess: () => {
      setReply("");
      qc.invalidateQueries({ queryKey: ["complaint", id] });
    },
    onError: (e) => alert(surfaceErr(e)),
  });

  const statusMu = useMutation({
    mutationFn: (status: string) =>
      updateComplaintStatus(auth.token as string, {
        id: id as string,
        status,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["complaint", id] }),
    onError: (e) => alert(surfaceErr(e)),
  });

  if (isLoading || !data) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...
      </div>
    );
  }

  const s = STATUS[data.status] ?? STATUS.open;
  const isAuthor = data.userId === auth.userId;

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-2">
        <Link
          to={`/${lineId}/services/complaints`}
          className="h-7 px-2 rounded hover:bg-white border bg-white text-[10px] flex items-center gap-1 text-gray-600"
        >
          <ArrowLeft className="h-3 w-3" /> Complaints
        </Link>
        <div className="h-7 w-7 rounded-md bg-white border flex items-center justify-center">
          <MessageSquareWarning className="h-3.5 w-3.5 text-gray-700" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold truncate">{data.title}</div>
          <div className="text-[10px] text-gray-500">
            {data.category} · filed {new Date(data.createdAt).toLocaleString()}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className={`text-[10px] h-6 px-2 ${s.cls}`}>
            {s.label}
          </Badge>
          <Select
            value={data.status}
            onValueChange={(v) => statusMu.mutate(v)}
          >
            <SelectTrigger className="h-7 text-[10px] w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open" className="text-xs">Open</SelectItem>
              <SelectItem value="in_progress" className="text-xs">In Progress</SelectItem>
              <SelectItem value="resolved" className="text-xs">Resolved</SelectItem>
              <SelectItem value="closed" className="text-xs">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
        {/* Parties */}
        <div className="border rounded-lg bg-white">
          <div className="px-3 py-2 border-b bg-gray-50 text-[10px] font-semibold uppercase text-gray-600">
            Parties
          </div>
          <div className="px-3 py-2 grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] text-gray-500 mb-1">Filed by</div>
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold flex items-center justify-center">
                  {(data.user?.firstName?.[0] ?? "") + (data.user?.lastName?.[0] ?? "")}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">
                    {fullName(data.user)}
                    {isAuthor ? (
                      <Badge variant="outline" className="ml-2 text-[10px] h-4 px-1">
                        You
                      </Badge>
                    ) : null}
                  </div>
                  <div className="text-[10px] text-gray-500 truncate">
                    {data.user?.Position?.name || "—"}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 mb-1">
                Complaint against
              </div>
              {data.againstUser ? (
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-rose-100 text-rose-700 text-[10px] font-semibold flex items-center justify-center">
                    {(data.againstUser.firstName?.[0] ?? "") +
                      (data.againstUser.lastName?.[0] ?? "")}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate flex items-center gap-1">
                      <UserX className="h-3 w-3 text-rose-600" />
                      {fullName(data.againstUser)}
                    </div>
                    <div className="text-[10px] text-gray-500 truncate">
                      {data.againstUser.Position?.name || "—"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-gray-400 italic">
                  Not directed at a specific coworker.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Original message */}
        <div className="border rounded-lg bg-white">
          <div className="px-3 py-2 border-b bg-gray-50 text-[10px] font-semibold uppercase text-gray-600">
            Description
          </div>
          <div className="px-3 py-3 text-xs whitespace-pre-wrap text-gray-800">
            {data.description}
          </div>
        </div>

        {/* Evidence */}
        <EvidenceSection
          complaintId={data.id}
          evidence={data.evidence}
          canEdit={isAuthor && data.status !== "closed"}
        />

        {/* Replies */}
        {data.replies.length > 0 ? (
          <div className="border rounded-lg bg-white">
            <div className="px-3 py-2 border-b bg-gray-50 text-[10px] font-semibold uppercase text-gray-600">
              Discussion ({data.replies.length})
            </div>
            <div className="divide-y">
              {data.replies.map((r) => (
                <div key={r.id} className="px-3 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-3 w-3 text-gray-500" />
                    <div className="text-[11px] font-medium">
                      {fullName(r.user)}
                      {r.user?.Position?.name ? (
                        <span className="text-gray-500">
                          {" "}· {r.user.Position.name}
                        </span>
                      ) : null}
                    </div>
                    <span className="ml-auto text-[10px] text-gray-400">
                      {new Date(r.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs whitespace-pre-wrap text-gray-800 pl-5">
                    {r.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Compose */}
        {data.status !== "closed" ? (
          <div className="border rounded-lg bg-white p-3 space-y-2">
            <label className="text-[10px] font-semibold uppercase text-gray-600">
              Add a reply
            </label>
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type your reply..."
              className="text-xs min-h-[80px]"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                className="h-7 text-xs"
                disabled={!reply.trim() || replyMu.isPending}
                onClick={() => replyMu.mutate()}
              >
                {replyMu.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5 mr-1" />
                )}
                Send reply
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-[10px] text-gray-500 text-center py-2">
            This complaint is closed. Re-open from the status dropdown if more
            discussion is needed.
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintDetail;

// ─── Evidence: thumbnails for images, file chips for everything else ──
const EvidenceSection = ({
  complaintId,
  evidence,
  canEdit,
}: {
  complaintId: string;
  evidence: ComplaintEvidence[];
  canEdit: boolean;
}) => {
  const auth = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewing, setPreviewing] = useState<ComplaintEvidence | null>(null);

  const addMu = useMutation({
    mutationFn: (files: File[]) =>
      addEvidence(auth.token as string, {
        complaintId,
        userId: auth.userId as string,
        files,
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["complaint", complaintId] }),
    onError: (e) => alert(surfaceErr(e)),
  });

  const removeMu = useMutation({
    mutationFn: (id: string) =>
      removeEvidence(auth.token as string, id, auth.userId as string),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["complaint", complaintId] }),
    onError: (e) => alert(surfaceErr(e)),
  });

  const handleUpload = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    addMu.mutate(Array.from(list));
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="border rounded-lg bg-white">
      <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase text-gray-600 flex items-center gap-1">
          <Paperclip className="h-3 w-3" /> Evidence ({evidence.length})
        </span>
        {canEdit ? (
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[10px]"
            onClick={() => fileRef.current?.click()}
            disabled={addMu.isPending}
          >
            {addMu.isPending ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Upload className="h-3 w-3 mr-1" />
            )}
            Add more
          </Button>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,application/pdf"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>
      {evidence.length === 0 ? (
        <div className="px-3 py-4 text-[10px] text-gray-500 text-center">
          No evidence attached.
        </div>
      ) : (
        <div className="p-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {evidence.map((e) => (
            <EvidenceTile
              key={e.id}
              ev={e}
              onPreview={() => setPreviewing(e)}
              onRemove={
                canEdit && e.uploadedById === auth.userId
                  ? () => removeMu.mutate(e.id)
                  : undefined
              }
            />
          ))}
        </div>
      )}

      <PreviewModal
        ev={previewing}
        onClose={() => setPreviewing(null)}
      />
    </div>
  );
};

const EvidenceTile = ({
  ev,
  onPreview,
  onRemove,
}: {
  ev: ComplaintEvidence;
  onPreview: () => void;
  onRemove?: () => void;
}) => {
  const auth = useAuth();
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const isImage = ev.fileType.startsWith("image/");

  useEffect(() => {
    let cancelled = false;
    let revoke: string | null = null;
    if (isImage) {
      fetchEvidence(auth.token as string, ev.id)
        .then((blob) => {
          if (cancelled) return;
          const u = URL.createObjectURL(blob);
          revoke = u;
          setThumbUrl(u);
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [auth.token, ev.id, isImage]);

  return (
    <div className="relative group border rounded-md overflow-hidden bg-gray-50">
      <button
        type="button"
        onClick={onPreview}
        className="w-full aspect-square flex items-center justify-center bg-white"
        title="Preview"
      >
        {isImage && thumbUrl ? (
          <img
            src={thumbUrl}
            alt={ev.fileName}
            className="w-full h-full object-cover"
          />
        ) : isImage ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        ) : (
          <div className="text-center p-2">
            <Paperclip className="h-5 w-5 text-gray-400 mx-auto mb-1" />
            <div className="text-[9px] uppercase text-gray-500 font-semibold">
              {(ev.fileType.split("/")[1] || "file").slice(0, 4)}
            </div>
          </div>
        )}
      </button>
      <div className="px-1.5 py-1 border-t bg-white">
        <div className="text-[10px] truncate" title={ev.fileName}>
          {ev.fileName}
        </div>
        <div className="text-[9px] text-gray-500">
          {(ev.fileSize / 1024).toFixed(0)} KB
        </div>
      </div>
      <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
        <button
          type="button"
          className="h-5 w-5 rounded bg-white border shadow flex items-center justify-center"
          onClick={onPreview}
          title="Preview"
        >
          <Eye className="h-3 w-3 text-gray-700" />
        </button>
        {onRemove ? (
          <button
            type="button"
            className="h-5 w-5 rounded bg-white border shadow flex items-center justify-center hover:bg-rose-50"
            onClick={onRemove}
            title="Remove"
          >
            <Trash2 className="h-3 w-3 text-rose-600" />
          </button>
        ) : null}
      </div>
    </div>
  );
};

// Larger preview modal — image stays inline, other types get a download.
const PreviewModal = ({
  ev,
  onClose,
}: {
  ev: ComplaintEvidence | null;
  onClose: () => void;
}) => {
  const auth = useAuth();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let revoke: string | null = null;
    setUrl(null);
    if (ev) {
      fetchEvidence(auth.token as string, ev.id)
        .then((blob) => {
          if (cancelled) return;
          const u = URL.createObjectURL(blob);
          revoke = u;
          setUrl(u);
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [auth.token, ev]);

  return (
    <Modal
      title={ev?.fileName ?? ""}
      onOpen={!!ev}
      setOnOpen={onClose}
      footer={1}
      onFunction={() => {}}
      className="sm:max-w-3xl"
    >
      {!ev ? null : !url ? (
        <div className="h-48 flex items-center justify-center text-xs text-gray-500">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...
        </div>
      ) : ev.fileType.startsWith("image/") ? (
        <div className="bg-gray-100 rounded-md p-1 flex items-center justify-center">
          <img
            src={url}
            alt={ev.fileName}
            className="max-h-[60vh] object-contain"
          />
        </div>
      ) : ev.fileType === "application/pdf" ? (
        <iframe
          src={url}
          title={ev.fileName}
          className="w-full h-[60vh] border rounded-md"
        />
      ) : (
        <div className="text-xs text-gray-600 p-4 text-center">
          Preview not supported for this file type.
        </div>
      )}
      {ev && url ? (
        <div className="flex justify-between items-center pt-2">
          <span className="text-[10px] text-gray-500">
            {(ev.fileSize / 1024).toFixed(0)} KB ·{" "}
            {new Date(ev.createdAt).toLocaleString()}
          </span>
          <a
            href={url}
            download={ev.fileName}
            className="text-[10px] text-blue-700 hover:underline flex items-center gap-1"
          >
            <Download className="h-3 w-3" /> Download
          </a>
        </div>
      ) : null}
    </Modal>
  );
};
