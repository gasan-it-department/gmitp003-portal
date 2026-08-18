import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
//
import {
  deleteMessageTemplate,
  listMessageBatches,
  listMessageTemplates,
  messageBatchDetail,
  messagePlaceholders,
  previewMessageFor,
  retryMessageBatch,
  saveMessageTemplate,
  searchMessageRecipients,
  sendMessageBatch,
  type Audience,
  type MessageChannel,
  type RecipientRow,
} from "@/db/statements/hrMessage";
//
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Send,
  Search,
  Loader2,
  Trash2,
  Mail,
  MessageSquare,
  RotateCw,
  Save,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  History,
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

// ── Compose ───────────────────────────────────────────────────────────────
const Compose = ({ token }: { token: string }) => {
  const qc = useQueryClient();
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  const [channel, setChannel] = useState<MessageChannel>("sms");
  const [audience, setAudience] = useState<Audience>("plantilla");
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [picked, setPicked] = useState<Record<string, RecipientRow>>({});
  const [templateId, setTemplateId] = useState<string>("");
  const [saveOpen, setSaveOpen] = useState(false);
  const [tplName, setTplName] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);

  const placeholders = useQuery({
    queryKey: ["hr-msg-placeholders"],
    queryFn: () => messagePlaceholders(token),
    enabled: !!token,
    staleTime: 60 * 60 * 1000,
  });

  const templates = useQuery({
    queryKey: ["hr-msg-templates"],
    queryFn: () => listMessageTemplates(token),
    enabled: !!token,
  });

  const recipients = useQuery({
    queryKey: ["hr-msg-recipients", audience, search, channel],
    queryFn: () =>
      searchMessageRecipients(token, {
        audience: audience === "custom" ? undefined : audience,
        query: search || undefined,
        channel,
      }),
    enabled: !!token,
  });

  const MAX = recipients.data?.max ?? 20;
  const chosen = Object.values(picked);

  // Switching channel invalidates every pick: the address that made someone
  // sendable by SMS says nothing about whether they have a Gmail account.
  useEffect(() => {
    setPicked({});
  }, [channel]);

  const insertToken = (tok: string) => {
    const el = bodyRef.current;
    if (!el) {
      setBody((b) => b + tok);
      return;
    }
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const next = body.slice(0, start) + tok + body.slice(end);
    setBody(next);
    // Put the caret after the inserted token so HR can keep typing.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + tok.length, start + tok.length);
    });
  };

  const loadTemplate = (id: string) => {
    setTemplateId(id);
    const t = templates.data?.templates.find((x) => x.id === id);
    if (!t) return;
    setChannel(t.channel);
    setSubject(t.subject ?? "");
    setBody(t.body);
  };

  const toggle = (r: RecipientRow) => {
    setPicked((p) => {
      if (p[r.id]) {
        const { [r.id]: _drop, ...rest } = p;
        return rest;
      }
      if (Object.keys(p).length >= MAX) {
        toast.error(`You can send to at most ${MAX} people at a time.`);
        return p;
      }
      return { ...p, [r.id]: r };
    });
  };

  const saveTpl = useMutation({
    mutationFn: () =>
      saveMessageTemplate(token, {
        id: templateId || undefined,
        name: tplName.trim(),
        channel,
        subject: channel === "email" ? subject : undefined,
        body,
      }),
    onSuccess: (t) => {
      toast.success("Template saved");
      setSaveOpen(false);
      setTemplateId(t.id);
      qc.invalidateQueries({ queryKey: ["hr-msg-templates"] });
    },
    onError: (e) => toast.error(surfaceErr(e, "Could not save the template")),
  });

  const removeTpl = useMutation({
    mutationFn: (id: string) => deleteMessageTemplate(token, id),
    onSuccess: () => {
      toast.success("Template deleted");
      setTemplateId("");
      qc.invalidateQueries({ queryKey: ["hr-msg-templates"] });
    },
    onError: (e) => toast.error(surfaceErr(e, "Could not delete the template")),
  });

  const preview = useQuery({
    queryKey: ["hr-msg-preview", body, chosen[0]?.id],
    queryFn: () => previewMessageFor(token, { body, userId: chosen[0].id }),
    enabled: previewOpen && !!chosen[0]?.id && !!body.trim(),
  });

  const send = useMutation({
    mutationFn: () =>
      sendMessageBatch(token, {
        templateId: templateId || undefined,
        channel,
        subject: channel === "email" ? subject : undefined,
        body,
        audience,
        userIds: chosen.map((r) => r.id),
      }),
    onSuccess: (r) => {
      setConfirmSend(false);
      if (r.failed === 0) toast.success(`Sent to all ${r.sent} recipients.`);
      else if (r.sent === 0)
        toast.error(`All ${r.failed} failed — open History to retry.`);
      else
        toast.warning(
          `${r.sent} sent, ${r.failed} failed — open History to retry the failures.`,
        );
      setPicked({});
      qc.invalidateQueries({ queryKey: ["hr-msg-batches"] });
    },
    onError: (e) => toast.error(surfaceErr(e, "Could not send")),
  });

  const list = recipients.data?.recipients ?? [];
  const unsendablePicked = chosen.filter((r) => !r.sendable);
  const segments = Math.max(1, Math.ceil(body.length / SEGMENT));

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px] mt-3">
      {/* ── Left: the message ─────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="rounded-lg border bg-white p-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-md border overflow-hidden">
              <button
                type="button"
                onClick={() => setChannel("sms")}
                className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 ${
                  channel === "sms"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Text message
              </button>
              <button
                type="button"
                onClick={() => setChannel("email")}
                className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 border-l ${
                  channel === "email"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Mail className="h-3.5 w-3.5" />
                Email (Gmail)
              </button>
            </div>

            <div className="flex-1 min-w-[180px]">
              <Select
                value={templateId || "none"}
                onValueChange={(v) =>
                  v === "none" ? setTemplateId("") : loadTemplate(v)
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Start from a template…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template</SelectItem>
                  {(templates.data?.templates ?? []).map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} · {t.channel === "email" ? "Email" : "SMS"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {templateId && (
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600 hover:text-red-700"
                onClick={() => removeTpl.mutate(templateId)}
                disabled={removeTpl.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {channel === "email" && (
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="h-9"
            />
          )}

          <Textarea
            ref={bodyRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            placeholder="Good day, {{fullName}} of {{office}}…"
            className="text-sm"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
            <span>
              {body.length} characters
              {channel === "sms" && (
                <>
                  {" · "}
                  <span className={segments > 1 ? "text-amber-600" : ""}>
                    {segments} SMS segment{segments > 1 ? "s" : ""} each
                  </span>
                </>
              )}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5"
                onClick={() => {
                  if (!chosen.length) {
                    toast.error("Pick a recipient to preview against");
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
                className="h-8 gap-1.5"
                onClick={() => {
                  if (!body.trim()) {
                    toast.error("The message is empty");
                    return;
                  }
                  setTplName(
                    templates.data?.templates.find((t) => t.id === templateId)
                      ?.name ?? "",
                  );
                  setSaveOpen(true);
                }}
              >
                <Save className="h-3.5 w-3.5" />
                Save as template
              </Button>
            </div>
          </div>
        </div>

        {/* Placeholder palette */}
        <div className="rounded-lg border bg-white p-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Insert a placeholder
          </p>
          <p className="text-[11px] text-gray-500 mb-2">
            Each one is replaced with that person's own information when the
            message is sent.
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto">
            {(placeholders.data?.placeholders ?? []).map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => insertToken(p.token)}
                title={p.token}
                className="px-2 py-1 rounded border text-[11px] bg-gray-50 hover:bg-blue-50 hover:border-blue-300 text-gray-700"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: who gets it ────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="rounded-lg border bg-white p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Recipients
            </p>
            <Badge
              variant={chosen.length >= MAX ? "destructive" : "secondary"}
              className="text-[10px]"
            >
              {chosen.length} / {MAX}
            </Badge>
          </div>

          <Select
            value={audience}
            onValueChange={(v) => setAudience(v as Audience)}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="plantilla">Plantilla</SelectItem>
              <SelectItem value="non-plantilla">Non-Plantilla</SelectItem>
              <SelectItem value="custom">Everyone</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, position or office…"
              className="pl-8 h-9"
            />
          </div>

          {chosen.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {chosen.map((r) => (
                <span
                  key={r.id}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] ${
                    r.sendable
                      ? "bg-blue-50 text-blue-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {r.name}
                  <button type="button" onClick={() => toggle(r)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="border rounded-md divide-y max-h-[420px] overflow-y-auto">
            {recipients.isLoading ? (
              <div className="p-4 flex justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            ) : list.length === 0 ? (
              <p className="p-4 text-xs text-center text-gray-500">
                No employees match this filter.
              </p>
            ) : (
              list.map((r) => {
                const on = !!picked[r.id];
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => toggle(r)}
                    className={`w-full text-left px-2.5 py-2 flex items-start gap-2 hover:bg-gray-50 ${
                      on ? "bg-blue-50/60" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      readOnly
                      checked={on}
                      className="mt-0.5 h-3.5 w-3.5 accent-blue-600"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-medium text-gray-900 truncate">
                        {r.name}
                      </span>
                      <span className="block text-[11px] text-gray-500 truncate">
                        {r.position ?? "—"}
                        {r.office ? ` · ${r.office}` : ""}
                      </span>
                      {r.sendable ? (
                        <span className="block text-[11px] text-gray-400 truncate">
                          {r.to}
                        </span>
                      ) : (
                        <span className="flex text-[11px] text-amber-600 items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {r.reason}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {unsendablePicked.length > 0 && (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-2.5 text-[11px] text-amber-800">
            {unsendablePicked.length} selected{" "}
            {unsendablePicked.length === 1 ? "person has" : "people have"} no
            usable {channel === "email" ? "Gmail address" : "mobile number"}.
            They will be recorded as failed so you can fix the record and retry.
          </div>
        )}

        <Button
          className="w-full gap-1.5"
          disabled={!chosen.length || !body.trim() || send.isPending}
          onClick={() => {
            if (channel === "email" && !subject.trim()) {
              toast.error("Email needs a subject");
              return;
            }
            setConfirmSend(true);
          }}
        >
          {send.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Send to {chosen.length}{" "}
          {chosen.length === 1 ? "recipient" : "recipients"}
        </Button>
      </div>

      {/* ── Save template ─────────────────────────────────────────────── */}
      <Modal
        title="Save as template"
        onOpen={saveOpen}
        setOnOpen={() => setSaveOpen(false)}
        className="sm:max-w-md"
        footer={true}
        loading={saveTpl.isPending}
        yesTitle={templateId ? "Update template" : "Save template"}
        onFunction={() => {
          if (!tplName.trim()) {
            toast.error("Give the template a name");
            return;
          }
          saveTpl.mutate();
        }}
      >
        <div className="space-y-2">
          <Input
            value={tplName}
            onChange={(e) => setTplName(e.target.value)}
            placeholder="e.g. Payroll reminder"
            className="h-9"
          />
          {templateId && (
            <p className="text-[11px] text-gray-500">
              This overwrites the template you loaded. Change the name to keep
              both.
            </p>
          )}
        </div>
      </Modal>

      {/* ── Preview ───────────────────────────────────────────────────── */}
      <Modal
        title={`Preview for ${chosen[0]?.name ?? ""}`}
        onOpen={previewOpen}
        setOnOpen={() => setPreviewOpen(false)}
        className="sm:max-w-lg"
        footer={false}
      >
        {preview.isLoading ? (
          <div className="p-4 flex justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-2">
            {channel === "email" && (
              <p className="text-xs">
                <span className="text-gray-500">Subject:</span>{" "}
                <span className="font-medium">{subject || "—"}</span>
              </p>
            )}
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 border rounded p-3 font-sans">
              {preview.data?.rendered ?? ""}
            </pre>
            {!!preview.data?.unresolved?.length && (
              <p className="text-[11px] text-amber-700 flex items-start gap-1">
                <AlertTriangle className="h-3.5 w-3.5 mt-px flex-shrink-0" />
                These placeholders have no value for this person and will be
                sent as-is: {preview.data.unresolved.join(", ")}
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* ── Confirm ───────────────────────────────────────────────────── */}
      <Modal
        title="Send this message?"
        onOpen={confirmSend}
        setOnOpen={() => setConfirmSend(false)}
        className="sm:max-w-md"
        footer={true}
        loading={send.isPending}
        yesTitle={`Send to ${chosen.length}`}
        onFunction={() => send.mutate()}
      >
        <div className="text-sm text-gray-600 space-y-2">
          <p>
            {chosen.length} {chosen.length === 1 ? "person" : "people"} will
            receive this by{" "}
            <strong>{channel === "email" ? "email" : "text message"}</strong>.
          </p>
          {channel === "sms" && segments > 1 && (
            <p className="text-amber-700">
              Each message is {segments} SMS segments — that is{" "}
              {segments * chosen.length} segments in total.
            </p>
          )}
          <p className="text-xs text-gray-500">
            This cannot be undone. Sent messages appear under History.
          </p>
        </div>
      </Modal>
    </div>
  );
};

// ── History ───────────────────────────────────────────────────────────────
const HistoryTab = ({ token }: { token: string }) => {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);

  const batches = useQuery({
    queryKey: ["hr-msg-batches", page],
    queryFn: () => listMessageBatches(token, page),
    enabled: !!token,
  });

  const detail = useQuery({
    queryKey: ["hr-msg-batch", openId],
    queryFn: () => messageBatchDetail(token, openId as string),
    enabled: !!openId,
  });

  const retry = useMutation({
    mutationFn: (v: { batchId: string; recipientIds?: string[] }) =>
      retryMessageBatch(token, v),
    onSuccess: (r) => {
      if (r.nowSent) toast.success(`${r.nowSent} of ${r.retried} went through.`);
      else toast.error(`Retried ${r.retried} — all still failing.`);
      qc.invalidateQueries({ queryKey: ["hr-msg-batch", openId] });
      qc.invalidateQueries({ queryKey: ["hr-msg-batches"] });
    },
    onError: (e) => toast.error(surfaceErr(e, "Retry failed")),
  });

  const rows = batches.data?.batches ?? [];
  const recips = detail.data?.recipients ?? [];
  const failedCount = recips.filter((r) => r.status === "failed").length;

  return (
    <div className="space-y-3 mt-3">
      {batches.isLoading ? (
        <div className="p-8 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border bg-white p-10 text-center">
          <History className="h-8 w-8 mx-auto text-gray-300" />
          <p className="mt-2 text-sm font-medium text-gray-900">
            Nothing sent yet
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Messages you send will be listed here with who received them.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border bg-white divide-y">
          {rows.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setOpenId(b.id)}
              className="w-full text-left p-3 hover:bg-gray-50 flex items-start gap-3"
            >
              {b.channel === "email" ? (
                <Mail className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              ) : (
                <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {b.subject || b.body.slice(0, 80) || "(no content)"}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {fmtDate(b.createdAt)}
                  {b.createdByName ? ` · ${b.createdByName}` : ""}
                  {b.audience !== "custom" ? ` · ${b.audience}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Badge className="bg-green-100 text-green-800 text-[10px] hover:bg-green-100">
                  {b.sentCount} sent
                </Badge>
                {b.failedCount > 0 && (
                  <Badge variant="destructive" className="text-[10px]">
                    {b.failedCount} failed
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {(batches.data?.pages ?? 0) > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-xs text-gray-500 self-center">
            Page {page + 1} of {batches.data?.pages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page + 1 >= (batches.data?.pages ?? 1)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* ── Who received it ───────────────────────────────────────────── */}
      <Modal
        title="Delivery report"
        onOpen={!!openId}
        setOnOpen={() => setOpenId(null)}
        className="sm:max-w-2xl"
        footer={false}
      >
        {detail.isLoading ? (
          <div className="p-4 flex justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-3">
            {failedCount > 0 && (
              <div className="flex items-center justify-between rounded-md border border-amber-300 bg-amber-50 px-3 py-2">
                <span className="text-xs text-amber-800">
                  {failedCount} {failedCount === 1 ? "message" : "messages"}{" "}
                  failed to send.
                </span>
                <Button
                  size="sm"
                  className="h-7 gap-1.5"
                  disabled={retry.isPending}
                  onClick={() => retry.mutate({ batchId: openId as string })}
                >
                  {retry.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCw className="h-3.5 w-3.5" />
                  )}
                  Retry all failed
                </Button>
              </div>
            )}

            <div className="border rounded-md divide-y max-h-[55vh] overflow-y-auto">
              {recips.map((r) => (
                <div key={r.id} className="p-2.5 flex items-start gap-2">
                  {r.status === "sent" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900">
                      {r.name}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">
                      {r.toAddress || "— no contact detail —"}
                      {r.sentAt ? ` · ${fmtDate(r.sentAt)}` : ""}
                      {r.attempts > 1 ? ` · ${r.attempts} attempts` : ""}
                    </p>
                    {r.error && (
                      <p className="text-[11px] text-red-600 mt-0.5">
                        {r.error}
                      </p>
                    )}
                    <details className="mt-1">
                      <summary className="text-[11px] text-blue-600 cursor-pointer">
                        What was sent
                      </summary>
                      <pre className="whitespace-pre-wrap text-[11px] bg-gray-50 border rounded p-2 mt-1 font-sans">
                        {r.renderedBody}
                      </pre>
                    </details>
                  </div>
                  {r.status === "failed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] flex-shrink-0"
                      disabled={retry.isPending}
                      onClick={() =>
                        retry.mutate({
                          batchId: openId as string,
                          recipientIds: [r.id],
                        })
                      }
                    >
                      Retry
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────
const MessageQueue = () => {
  const auth = useAuth();
  const token = auth.token as string;

  const header = useMemo(
    () => (
      <div>
        <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Send className="h-5 w-5 text-blue-600" />
          Message Queue
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Write once with placeholders, pick who it goes to, and send it as a
          text message or email.
        </p>
      </div>
    ),
    [],
  );

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {header}
      <Tabs defaultValue="compose">
        <TabsList>
          <TabsTrigger value="compose" className="gap-1.5">
            <Send className="h-3.5 w-3.5" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="h-3.5 w-3.5" />
            History
          </TabsTrigger>
        </TabsList>
        <TabsContent value="compose">
          <Compose token={token} />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab token={token} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MessageQueue;
