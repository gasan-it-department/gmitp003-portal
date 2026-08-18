import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
//
import {
  addBatchRecipients,
  deleteMessageBatch,
  messageBatchDetail,
  messagePlaceholders,
  previewMessageFor,
  removeBatchRecipient,
  retryMessageBatch,
  saveMessageTemplate,
  searchMessageEmployees,
  sendMessageBatch,
  updateMessageBatch,
  type Audience,
  type BatchRecipientRow,
  type MessageChannel,
} from "@/db/statements/hrMessage";
//
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Modal from "@/components/custom/Modal";
import { toast } from "sonner";
import {
  ArrowLeft,
  Send,
  Search,
  Loader2,
  Mail,
  MessageSquare,
  Trash2,
  Save,
  Eye,
  UserPlus,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RotateCw,
  Users,
  X,
} from "lucide-react";

const surfaceErr = (err: unknown, fallback = "Something went wrong") => {
  const e = err as any;
  return (
    e?.response?.data?.message ||
    e?.response?.data?.error ||
    e?.message ||
    fallback
  );
};

const fmtDate = (v?: string | null) =>
  v
    ? new Date(v).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

/** SMS is billed per 160-character segment — show HR what a message costs. */
const SEGMENT = 160;

const RecipientIcon = ({ status }: { status: BatchRecipientRow["status"] }) => {
  if (status === "sent")
    return (
      <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 flex-shrink-0">
        <CheckCircle2 className="h-4 w-4" />
      </span>
    );
  if (status === "failed")
    return (
      <span className="p-1.5 rounded-lg bg-red-50 text-red-600 flex-shrink-0">
        <XCircle className="h-4 w-4" />
      </span>
    );
  return (
    <span className="p-1.5 rounded-lg bg-gray-100 text-gray-500 flex-shrink-0">
      <Clock className="h-4 w-4" />
    </span>
  );
};

const MessageBatchDetail = () => {
  const auth = useAuth();
  const token = auth.token as string;
  const { lineId, batchId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  const [rSearch, setRSearch] = useState("");
  const [rStatus, setRStatus] = useState("all");
  const [rPage, setRPage] = useState(0);
  /** Pending rows ticked for THIS wave. Empty means "send the next ones". */
  const [wave, setWave] = useState<Record<string, true>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saveTplOpen, setSaveTplOpen] = useState(false);
  const [tplName, setTplName] = useState("");

  // Local edits to the draft, flushed on blur / explicit save.
  const [draft, setDraft] = useState<{
    name: string;
    subject: string;
    body: string;
  } | null>(null);

  const detail = useQuery({
    queryKey: ["hr-msg-batch", batchId, rSearch, rStatus, rPage],
    queryFn: () =>
      messageBatchDetail(token, batchId as string, {
        search: rSearch || undefined,
        status: rStatus === "all" ? undefined : rStatus,
        page: rPage,
      }),
    enabled: !!token && !!batchId,
  });

  const batch = detail.data?.batch;
  const counts = detail.data?.counts;
  const PER_SEND = detail.data?.maxPerSend ?? 20;
  const PER_BATCH = detail.data?.maxPerBatch ?? 1000;
  const recipients = detail.data?.recipients ?? [];
  // "draft" = nothing dispatched yet (message still editable).
  // "sending" = waves in progress; recipients can still be added and sent.
  const isDraft = batch?.status === "draft";
  const isDone = batch?.status === "sent";
  const canSend = !isDone;

  // Seed the editable fields once the batch arrives. Keyed on identity +
  // status so a send (draft -> sent) re-syncs, but typing is never clobbered
  // by a background refetch.
  useEffect(() => {
    if (!batch) return;
    setDraft({
      name: batch.name ?? "",
      subject: batch.subject ?? "",
      body: batch.body ?? "",
    });
  }, [batch?.id, batch?.status]);

  const save = useMutation({
    mutationFn: (patch: Parameters<typeof updateMessageBatch>[2]) =>
      updateMessageBatch(token, batchId as string, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hr-msg-batch", batchId] }),
    onError: (e) => toast.error(surfaceErr(e, "Could not save")),
  });

  const send = useMutation({
    mutationFn: (ids?: string[]) =>
      sendMessageBatch(token, batchId as string, ids),
    onSuccess: (r) => {
      setConfirmSend(false);
      setWave({});
      const tail = r.done ? "" : ` ${r.pending} still waiting.`;
      if (r.failed === 0)
        toast.success(`${r.dispatched} sent.${tail}`);
      else
        toast.warning(
          `${r.dispatched} dispatched — ${r.sent} delivered, ${r.failed} failed so far.${tail}`,
        );
      qc.invalidateQueries({ queryKey: ["hr-msg-batch", batchId] });
      qc.invalidateQueries({ queryKey: ["hr-msg-batches"] });
    },
    onError: (e) => toast.error(surfaceErr(e, "Could not send")),
  });

  const retry = useMutation({
    mutationFn: (ids?: string[]) =>
      retryMessageBatch(token, batchId as string, ids),
    onSuccess: (r) => {
      if (r.nowSent) toast.success(`${r.nowSent} of ${r.retried} went through.`);
      else toast.error(`Retried ${r.retried} — all still failing.`);
      qc.invalidateQueries({ queryKey: ["hr-msg-batch", batchId] });
      qc.invalidateQueries({ queryKey: ["hr-msg-batches"] });
    },
    onError: (e) => toast.error(surfaceErr(e, "Retry failed")),
  });

  const removeOne = useMutation({
    mutationFn: (rid: string) =>
      removeBatchRecipient(token, batchId as string, rid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr-msg-batch", batchId] });
      qc.invalidateQueries({ queryKey: ["hr-msg-batches"] });
    },
    onError: (e) => toast.error(surfaceErr(e, "Could not remove")),
  });

  const remove = useMutation({
    mutationFn: () => deleteMessageBatch(token, batchId as string),
    onSuccess: () => {
      toast.success("Draft deleted");
      qc.invalidateQueries({ queryKey: ["hr-msg-batches"] });
      navigate(`/${lineId}/hr/messages`);
    },
    onError: (e) => toast.error(surfaceErr(e, "Could not delete")),
  });

  const placeholders = useQuery({
    queryKey: ["hr-msg-placeholders"],
    queryFn: () => messagePlaceholders(token),
    enabled: !!token,
    staleTime: 60 * 60 * 1000,
  });

  const preview = useQuery({
    queryKey: ["hr-msg-preview", batchId, draft?.body, recipients[0]?.userId],
    queryFn: () =>
      previewMessageFor(token, {
        body: draft?.body ?? "",
        userId: recipients[0].userId,
      }),
    enabled: previewOpen && !!recipients[0]?.userId,
  });

  const saveTpl = useMutation({
    mutationFn: () =>
      saveMessageTemplate(token, {
        name: tplName.trim(),
        channel: (batch?.channel ?? "sms") as MessageChannel,
        subject: batch?.channel === "email" ? draft?.subject : undefined,
        body: draft?.body ?? "",
      }),
    onSuccess: () => {
      toast.success("Saved as a template");
      setSaveTplOpen(false);
      qc.invalidateQueries({ queryKey: ["hr-msg-templates"] });
    },
    onError: (e) => toast.error(surfaceErr(e, "Could not save the template")),
  });

  const insertToken = (tok: string) => {
    const el = bodyRef.current;
    const body = draft?.body ?? "";
    if (!el) {
      setDraft((d) => (d ? { ...d, body: body + tok } : d));
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    setDraft((d) =>
      d ? { ...d, body: body.slice(0, start) + tok + body.slice(end) } : d,
    );
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + tok.length, start + tok.length);
    });
  };

  if (detail.isLoading || !batch || !draft) {
    return (
      <div className="w-full h-full bg-gray-50 flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const segments = Math.max(1, Math.ceil((draft.body || "").length / SEGMENT));
  const failedCount = counts?.failed ?? 0;
  const pendingCount = counts?.pending ?? 0;
  const totalCount = counts?.total ?? 0;
  const doneCount = (counts?.sent ?? 0) + failedCount;
  const waveIds = Object.keys(wave);
  // With nothing ticked the server takes the next people in line, so the
  // button always says exactly how many will go out.
  const thisWave = waveIds.length || Math.min(pendingCount, PER_SEND);
  const wavesLeft = Math.ceil(pendingCount / PER_SEND);
  const unreachable = recipients.filter(
    (r) => r.status === "pending" && !r.toAddress,
  ).length;

  const toggleWave = (id: string) =>
    setWave((w) => {
      if (w[id]) {
        const { [id]: _drop, ...rest } = w;
        return rest;
      }
      if (Object.keys(w).length >= PER_SEND) {
        toast.error(
          `${PER_SEND} is the most that can go out at once. Send these, then pick the next ${PER_SEND}.`,
        );
        return w;
      }
      return { ...w, [id]: true };
    });

  return (
    <div className="w-full h-full bg-gray-50">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            type="button"
            onClick={() => navigate(`/${lineId}/hr/messages`)}
            className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1.5 mb-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            All batches
          </button>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={`p-2 rounded-lg border flex-shrink-0 ${
                  batch.channel === "email"
                    ? "bg-indigo-50 border-indigo-100 text-indigo-600"
                    : "bg-blue-50 border-blue-100 text-blue-600"
                }`}
              >
                {batch.channel === "email" ? (
                  <Mail className="h-6 w-6" />
                ) : (
                  <MessageSquare className="h-6 w-6" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900 truncate">
                    {batch.name || "Untitled batch"}
                  </h1>
                  {isDraft ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      Draft
                    </span>
                  ) : isDone ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                      Sent {fmtDate(batch.sentAt)}
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 tabular-nums">
                      Sending · {doneCount} of {totalCount}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {batch.channel === "email"
                    ? "Sent by email (Gmail addresses only)"
                    : "Sent as a text message"}
                  {` · ${totalCount} ${totalCount === 1 ? "recipient" : "recipients"}`}
                  {pendingCount > 0 &&
                    ` · ${pendingCount} still waiting, ${wavesLeft} ${
                      wavesLeft === 1 ? "send" : "sends"
                    } of ${PER_SEND} to go`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isDraft && (
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Delete draft</span>
                </Button>
              )}
              {failedCount > 0 && (
                <Button
                  variant="outline"
                  className="gap-2"
                  disabled={retry.isPending}
                  onClick={() => retry.mutate(undefined)}
                >
                  {retry.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCw className="h-4 w-4" />
                  )}
                  Retry {failedCount} failed
                </Button>
              )}
              {canSend && pendingCount > 0 && (
                <Button
                  className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-sm"
                  disabled={!draft.body.trim() || send.isPending}
                  onClick={() => setConfirmSend(true)}
                >
                  {send.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {waveIds.length
                    ? `Send to ${waveIds.length} selected`
                    : `Send next ${thisWave}`}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* ── Progress ───────────────────────────────────────────────── */}
        {!isDraft && (
          <div className="bg-white rounded-lg border shadow-sm p-4 sm:p-5 space-y-3.5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900">
                {isDone
                  ? "Everyone on this batch has been contacted"
                  : `${doneCount} of ${totalCount} contacted`}
              </p>
              {!isDone && (
                <p className="text-xs text-gray-500 tabular-nums">
                  {pendingCount} waiting · {wavesLeft}{" "}
                  {wavesLeft === 1 ? "more send" : "more sends"} of {PER_SEND}
                </p>
              )}
            </div>

            <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{
                  width: `${((counts?.sent ?? 0) / Math.max(1, totalCount)) * 100}%`,
                }}
              />
              <div
                className="bg-red-500 h-full transition-all duration-300"
                style={{
                  width: `${(failedCount / Math.max(1, totalCount)) * 100}%`,
                }}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-2xl font-bold text-emerald-600 tabular-nums leading-none">
                  {counts?.sent ?? 0}
                </p>
                <p className="text-xs text-gray-500 mt-1.5">Delivered</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600 tabular-nums leading-none">
                  {failedCount}
                </p>
                <p className="text-xs text-gray-500 mt-1.5">Failed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none">
                  {pendingCount}
                </p>
                <p className="text-xs text-gray-500 mt-1.5">Not sent yet</p>
              </div>
            </div>
          </div>
        )}

        {/* ── The message ────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="border-b bg-gray-50/50 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-gray-900">
              {isDraft ? "Message" : "Message that was sent"}
            </h2>
            {isDraft && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => {
                    if (!recipients.length) {
                      toast.error("Add a recipient first to preview against them");
                      return;
                    }
                    setPreviewOpen(true);
                  }}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => {
                    if (!draft.body.trim()) {
                      toast.error("The message is empty");
                      return;
                    }
                    setTplName(batch.name ?? "");
                    setSaveTplOpen(true);
                  }}
                >
                  <Save className="h-3.5 w-3.5" />
                  Save as template
                </Button>
              </div>
            )}
          </div>

          <div className="p-5 space-y-4">
            {isDraft ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Batch name
                    </label>
                    <Input
                      value={draft.name}
                      onChange={(e) =>
                        setDraft({ ...draft, name: e.target.value })
                      }
                      onBlur={() => save.mutate({ name: draft.name })}
                      placeholder="e.g. October payroll reminder"
                      className="h-10 mt-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Who this is for
                    </label>
                    <Select
                      value={batch.audience}
                      onValueChange={(v) => save.mutate({ audience: v as Audience })}
                    >
                      <SelectTrigger className="h-10 mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plantilla">Plantilla</SelectItem>
                        <SelectItem value="non-plantilla">Non-Plantilla</SelectItem>
                        <SelectItem value="custom">Selected employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {batch.channel === "email" && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Subject
                    </label>
                    <Input
                      value={draft.subject}
                      onChange={(e) =>
                        setDraft({ ...draft, subject: e.target.value })
                      }
                      onBlur={() => save.mutate({ subject: draft.subject })}
                      placeholder="What the email is about"
                      className="h-10 mt-1.5"
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Message
                  </label>
                  <Textarea
                    ref={bodyRef}
                    value={draft.body}
                    onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                    onBlur={() => save.mutate({ body: draft.body })}
                    rows={7}
                    placeholder="Good day, {{fullName}} of {{office}}…"
                    className="mt-1.5 text-sm"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                    <p className="text-xs text-gray-500 tabular-nums">
                      {draft.body.length} characters
                      {batch.channel === "sms" && (
                        <>
                          {" · "}
                          <span className={segments > 1 ? "text-amber-600" : ""}>
                            {segments} SMS segment{segments > 1 ? "s" : ""} per
                            person
                          </span>
                        </>
                      )}
                    </p>
                    {save.isPending && (
                      <span className="text-xs text-gray-400 flex items-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Saving
                      </span>
                    )}
                  </div>
                </div>

                {/* Placeholder palette */}
                <div className="rounded-lg border bg-gray-50/60 p-3">
                  <p className="text-sm font-medium text-gray-700">
                    Insert a placeholder
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 mb-2.5">
                    Each is replaced with that person's own information when the
                    message is sent.
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                    {(placeholders.data?.placeholders ?? []).map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => insertToken(p.token)}
                        title={p.token}
                        className="px-2.5 py-1 rounded-md border bg-white hover:bg-blue-50 hover:border-blue-300 text-xs text-gray-700 transition-colors"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                {batch.subject && (
                  <p className="text-sm">
                    <span className="text-gray-500">Subject:</span>{" "}
                    <span className="font-medium text-gray-900">
                      {batch.subject}
                    </span>
                  </p>
                )}
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 border rounded-lg p-4 font-sans text-gray-800">
                  {batch.body}
                </pre>
                <p className="text-xs text-gray-400">
                  Placeholders were filled in per person — open a recipient
                  below to see exactly what they received.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Recipients ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="border-b bg-gray-50/50 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-900">
                Recipients
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-white border text-xs text-gray-600 tabular-nums">
                {totalCount}
              </span>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-xs text-blue-700 tabular-nums">
                  {pendingCount} waiting
                </span>
              )}
            </div>
            {canSend && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => setAddOpen(true)}
                disabled={totalCount >= PER_BATCH}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add recipients
              </Button>
            )}
          </div>

          <div className="px-5 py-3 border-b flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={rSearch}
                onChange={(e) => {
                  setRSearch(e.target.value);
                  setRPage(0);
                }}
                placeholder="Search this list by name…"
                className="pl-9 h-9"
              />
            </div>
            <Select
              value={rStatus}
              onValueChange={(v) => {
                setRStatus(v);
                setRPage(0);
              }}
            >
              <SelectTrigger className="h-9 w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Not sent yet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {canSend && pendingCount > 0 && (
            <div className="px-5 py-2.5 border-b bg-blue-50/40 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-gray-700">
                {waveIds.length ? (
                  <>
                    <strong className="tabular-nums">{waveIds.length}</strong>{" "}
                    picked for this send
                  </>
                ) : (
                  <>
                    Sends go out {PER_SEND} at a time. Tick people below, or
                    just send the next{" "}
                    <strong className="tabular-nums">{thisWave}</strong> in
                    order.
                  </>
                )}
              </p>
              <div className="flex items-center gap-2">
                {waveIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setWave({})}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Clear selection
                  </button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => {
                    const next: Record<string, true> = {};
                    for (const r of recipients) {
                      if (r.status !== "pending") continue;
                      if (Object.keys(next).length >= PER_SEND) break;
                      next[r.id] = true;
                    }
                    if (!Object.keys(next).length) {
                      toast.error("Nobody on this page is still waiting.");
                      return;
                    }
                    setWave(next);
                  }}
                >
                  Select up to {PER_SEND} here
                </Button>
              </div>
            </div>
          )}

          {unreachable > 0 && canSend && (
            <div className="mx-5 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                {unreachable}{" "}
                {unreachable === 1 ? "person has" : "people have"} no{" "}
                {batch.channel === "email" ? "Gmail address" : "mobile number"}{" "}
                on file. They will be recorded as failed so you can fix the
                record and retry.
              </p>
            </div>
          )}

          {recipients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
              <div className="bg-gray-50 rounded-full p-4 mb-4">
                <Users className="h-10 w-10 text-gray-300" strokeWidth={1.5} />
              </div>
              <p className="text-gray-500 font-medium">
                {rSearch || rStatus !== "all"
                  ? "Nobody matches this filter"
                  : "No recipients yet"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {rSearch || rStatus !== "all"
                  ? "Try a different search."
                  : `Add everyone who needs this message — it goes out ${PER_SEND} at a time.`}
              </p>
              {canSend && !rSearch && rStatus === "all" && (
                <Button
                  variant="outline"
                  className="mt-4 gap-2"
                  onClick={() => setAddOpen(true)}
                >
                  <UserPlus className="h-4 w-4" />
                  Add recipients
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {recipients.map((r) => (
                <div
                  key={r.id}
                  className={`px-5 py-3.5 flex items-start gap-3 transition-colors ${
                    wave[r.id] ? "bg-blue-50/60" : "hover:bg-gray-50/60"
                  }`}
                >
                  {canSend && r.status === "pending" ? (
                    <button
                      type="button"
                      onClick={() => toggleWave(r.id)}
                      className="mt-0.5 flex-shrink-0"
                      title="Include in this send"
                    >
                      <input
                        type="checkbox"
                        readOnly
                        checked={!!wave[r.id]}
                        className="h-4 w-4 accent-blue-600"
                      />
                    </button>
                  ) : null}
                  <RecipientIcon status={r.status} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {r.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {r.toAddress || (
                        <span className="text-amber-600">
                          no contact detail on file
                        </span>
                      )}
                      {r.sentAt ? ` · delivered ${fmtDate(r.sentAt)}` : ""}
                      {r.attempts > 1 ? ` · ${r.attempts} attempts` : ""}
                    </p>
                    {r.error && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                        {r.error}
                      </p>
                    )}
                    {r.renderedBody && (
                      <details className="mt-1.5">
                        <summary className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer">
                          What they received
                        </summary>
                        <pre className="whitespace-pre-wrap text-xs bg-gray-50 border rounded-md p-2.5 mt-1.5 font-sans text-gray-700">
                          {r.renderedBody}
                        </pre>
                      </details>
                    )}
                  </div>

                  {r.status === "failed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5 flex-shrink-0"
                      disabled={retry.isPending}
                      onClick={() => retry.mutate([r.id])}
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                      Retry
                    </Button>
                  )}
                  {isDraft && r.status === "pending" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-gray-400 hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                      disabled={removeOne.isPending}
                      onClick={() => removeOne.mutate(r.id)}
                      title="Remove from this batch"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {(detail.data?.pages ?? 0) > 1 && (
            <div className="px-5 py-3 border-t flex items-center justify-center gap-3">
              <Button
                size="sm"
                variant="outline"
                disabled={rPage === 0}
                onClick={() => setRPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-500 tabular-nums">
                Page {rPage + 1} of {detail.data?.pages} ·{" "}
                {detail.data?.matching} shown
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={rPage + 1 >= (detail.data?.pages ?? 1)}
                onClick={() => setRPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Add recipients ───────────────────────────────────────────── */}
      <AddRecipients
        open={addOpen}
        onClose={() => setAddOpen(false)}
        token={token}
        batchId={batchId as string}
        channel={batch.channel}
        audience={batch.audience}
        remaining={PER_BATCH - totalCount}
        onAdded={() => {
          qc.invalidateQueries({ queryKey: ["hr-msg-batch", batchId] });
          qc.invalidateQueries({ queryKey: ["hr-msg-batches"] });
        }}
      />

      {/* ── Preview ──────────────────────────────────────────────────── */}
      <Modal
        title={`Preview for ${recipients[0]?.name ?? ""}`}
        onOpen={previewOpen}
        setOnOpen={() => setPreviewOpen(false)}
        className="sm:max-w-lg"
        footer={false}
      >
        {preview.isLoading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-3">
            {batch.channel === "email" && (
              <p className="text-sm">
                <span className="text-gray-500">Subject:</span>{" "}
                <span className="font-medium">{draft.subject || "—"}</span>
              </p>
            )}
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 border rounded-lg p-4 font-sans text-gray-800">
              {preview.data?.rendered ?? ""}
            </pre>
            {!!preview.data?.unresolved?.length && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  No value for this person, so these will be sent as written:{" "}
                  {preview.data.unresolved.map((u) => `{{${u}}}`).join(", ")}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Save as template ─────────────────────────────────────────── */}
      <Modal
        title="Save as template"
        onOpen={saveTplOpen}
        setOnOpen={() => setSaveTplOpen(false)}
        className="sm:max-w-md"
        footer={true}
        loading={saveTpl.isPending}
        yesTitle="Save template"
        onFunction={() => {
          if (!tplName.trim()) {
            toast.error("Give the template a name");
            return;
          }
          saveTpl.mutate();
        }}
      >
        <div>
          <label className="text-sm font-medium text-gray-700">
            Template name
          </label>
          <Input
            value={tplName}
            onChange={(e) => setTplName(e.target.value)}
            placeholder="e.g. Payroll reminder"
            className="h-10 mt-1.5"
          />
          <p className="text-xs text-gray-500 mt-1.5">
            Available next time you create a batch.
          </p>
        </div>
      </Modal>

      {/* ── Confirm send ─────────────────────────────────────────────── */}
      <Modal
        title={pendingCount > thisWave ? "Send this wave?" : "Send this message?"}
        onOpen={confirmSend}
        setOnOpen={() => setConfirmSend(false)}
        className="sm:max-w-md"
        footer={true}
        loading={send.isPending}
        yesTitle={`Send to ${thisWave}`}
        onFunction={() => send.mutate(waveIds.length ? waveIds : undefined)}
      >
        <div className="text-sm text-gray-600 space-y-2.5">
          <p>
            <strong className="text-gray-900 tabular-nums">{thisWave}</strong>{" "}
            {thisWave === 1 ? "person" : "people"} will receive this by{" "}
            <strong className="text-gray-900">
              {batch.channel === "email" ? "email" : "text message"}
            </strong>
            {waveIds.length ? " — the ones you ticked." : " — the next in order."}
          </p>
          {pendingCount > thisWave && (
            <p>
              <strong className="text-gray-900 tabular-nums">
                {pendingCount - thisWave}
              </strong>{" "}
              will still be waiting afterwards. Come back and send the next{" "}
              {PER_SEND} whenever you are ready.
            </p>
          )}
          {batch.channel === "sms" && segments > 1 && (
            <p className="text-amber-700">
              Each message is {segments} SMS segments — {segments * thisWave}{" "}
              segments in this send.
            </p>
          )}
          <p className="text-xs text-gray-500">
            This cannot be undone.
            {isDraft
              ? " Once the first message goes out the wording is locked."
              : ""}
          </p>
        </div>
      </Modal>

      {/* ── Confirm delete ───────────────────────────────────────────── */}
      <Modal
        title="Delete this draft?"
        onOpen={confirmDelete}
        setOnOpen={() => setConfirmDelete(false)}
        className="sm:max-w-md"
        footer={true}
        loading={remove.isPending}
        yesTitle="Delete draft"
        onFunction={() => remove.mutate()}
      >
        <p className="text-sm text-gray-600">
          "{batch.name || "Untitled batch"}" and its {counts?.total ?? 0}{" "}
          selected {counts?.total === 1 ? "recipient" : "recipients"} will be
          removed. Nothing has been sent, so nobody is affected.
        </p>
      </Modal>
    </div>
  );
};

// ── Recipient picker ────────────────────────────────────────────────────
const AddRecipients = ({
  open,
  onClose,
  token,
  batchId,
  channel,
  audience,
  remaining,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  token: string;
  batchId: string;
  channel: MessageChannel;
  audience: Audience;
  remaining: number;
  onAdded: () => void;
}) => {
  const [aud, setAud] = useState<Audience>(audience);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Record<string, true>>({});

  useEffect(() => {
    if (open) {
      setPicked({});
      setAud(audience);
      setQuery("");
    }
  }, [open, audience]);

  const employees = useQuery({
    queryKey: ["hr-msg-employees", batchId, aud, query, channel],
    queryFn: () =>
      searchMessageEmployees(token, {
        audience: aud === "custom" ? undefined : aud,
        query: query || undefined,
        channel,
        batchId,
      }),
    enabled: open && !!token,
  });

  const add = useMutation({
    mutationFn: () => addBatchRecipients(token, batchId, Object.keys(picked)),
    onSuccess: (r) => {
      toast.success(`${r.added} added — ${r.total} on this batch.`);
      onAdded();
      onClose();
    },
    onError: (e) => toast.error(surfaceErr(e, "Could not add recipients")),
  });

  const list = employees.data?.employees ?? [];
  const count = Object.keys(picked).length;

  const toggle = (id: string) =>
    setPicked((p) => {
      if (p[id]) {
        const { [id]: _drop, ...rest } = p;
        return rest;
      }
      if (Object.keys(p).length >= remaining) {
        toast.error(
          remaining === 0
            ? "This batch is already full."
            : `You can add ${remaining} more to this batch.`,
        );
        return p;
      }
      return { ...p, [id]: true };
    });

  return (
    <Modal
      title="Add recipients"
      onOpen={open}
      setOnOpen={onClose}
      className="sm:max-w-2xl"
      footer={true}
      loading={add.isPending}
      yesTitle={count ? `Add ${count}` : "Add"}
      onFunction={() => {
        if (!count) {
          toast.error("Pick at least one employee");
          return;
        }
        add.mutate();
      }}
    >
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Select value={aud} onValueChange={(v) => setAud(v as Audience)}>
            <SelectTrigger className="h-10 w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="plantilla">Plantilla</SelectItem>
              <SelectItem value="non-plantilla">Non-Plantilla</SelectItem>
              <SelectItem value="custom">Everyone</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, position or office…"
              className="pl-9 h-10"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            {count} selected
            {remaining > 0 && ` · room for ${remaining}`}
          </span>
          {count > 0 && (
            <button
              type="button"
              onClick={() => setPicked({})}
              className="text-blue-600 hover:text-blue-700"
            >
              Clear
            </button>
          )}
        </div>

        <div className="border rounded-lg divide-y max-h-[45vh] overflow-y-auto">
          {employees.isLoading ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : list.length === 0 ? (
            <p className="py-10 text-sm text-center text-gray-500">
              No employees match this filter.
            </p>
          ) : (
            list.map((e) => {
              const on = !!picked[e.id];
              return (
                <button
                  key={e.id}
                  type="button"
                  disabled={e.added}
                  onClick={() => toggle(e.id)}
                  className={`w-full text-left px-3.5 py-2.5 flex items-start gap-3 transition-colors ${
                    e.added
                      ? "bg-gray-50 cursor-not-allowed"
                      : on
                        ? "bg-blue-50/70 hover:bg-blue-50"
                        : "hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    readOnly
                    disabled={e.added}
                    checked={on || e.added}
                    className="mt-1 h-4 w-4 accent-blue-600"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {e.name}
                      </span>
                      {e.added && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-200 text-gray-600">
                          Already added
                        </span>
                      )}
                    </span>
                    <span className="block text-xs text-gray-500 truncate">
                      {e.position ?? "—"}
                      {e.office ? ` · ${e.office}` : ""}
                    </span>
                    {e.sendable ? (
                      <span className="block text-xs text-gray-400 truncate">
                        {e.to}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-amber-600">
                        <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                        {e.reason}
                      </span>
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};

export default MessageBatchDetail;
