import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
//
import {
  createMessageBatch,
  listMessageBatches,
  listMessageTemplates,
  type MessageBatchRow,
  type MessageChannel,
} from "@/db/statements/hrMessage";
//
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Mail,
  MessageSquare,
  Plus,
  Inbox,
  ChevronRight,
  CheckCircle2,
  XCircle,
  FileEdit,
  Clock,
  Users,
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

const AUDIENCE_LABEL: Record<string, string> = {
  plantilla: "Plantilla",
  "non-plantilla": "Non-Plantilla",
  custom: "Selected employees",
};

/** One coloured pill telling you the outcome at a glance. */
const StatusPill = ({ batch }: { batch: MessageBatchRow }) => {
  if (batch.status === "draft")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        <FileEdit className="h-3.5 w-3.5" />
        Draft
      </span>
    );
  // Part-way through: waves are still going out.
  if (batch.status === "sending") {
    const done = batch.sentCount + batch.failedCount;
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 tabular-nums">
        <Clock className="h-3.5 w-3.5" />
        {done} of {batch.total} sent
      </span>
    );
  }
  if (batch.failedCount === 0)
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        All sent
      </span>
    );
  if (batch.sentCount === 0)
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
        <XCircle className="h-3.5 w-3.5" />
        All failed
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
      <XCircle className="h-3.5 w-3.5" />
      {batch.failedCount} failed
    </span>
  );
};

/** Delivery split as a bar — reads faster than two numbers. */
const DeliveryBar = ({ batch }: { batch: MessageBatchRow }) => {
  const total = Math.max(1, batch.total);
  const sent = (batch.sentCount / total) * 100;
  const failed = (batch.failedCount / total) * 100;
  return (
    <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden flex">
      <div className="bg-emerald-500 h-full" style={{ width: `${sent}%` }} />
      <div className="bg-red-500 h-full" style={{ width: `${failed}%` }} />
    </div>
  );
};

const StatCard = ({
  label,
  value,
  Icon,
  tone,
}: {
  label: string;
  value: number;
  Icon: typeof Send;
  tone: "gray" | "emerald" | "red" | "blue";
}) => {
  const tones = {
    gray: "bg-gray-50 text-gray-600",
    emerald: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    blue: "bg-blue-50 text-blue-600",
  } as const;
  return (
    <div className="bg-white rounded-lg border shadow-sm p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 leading-none tabular-nums">
          {value}
        </p>
        <p className="text-xs text-gray-500 mt-1 truncate">{label}</p>
      </div>
    </div>
  );
};

const MessageQueue = () => {
  const auth = useAuth();
  const token = auth.token as string;
  const { lineId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(0);

  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    channel: MessageChannel;
    templateId: string;
  }>({ name: "", channel: "sms", templateId: "" });

  const batches = useQuery({
    queryKey: ["hr-msg-batches", page, search, status],
    queryFn: () =>
      listMessageBatches(token, {
        page,
        search: search || undefined,
        status: status === "all" ? undefined : status,
      }),
    enabled: !!token,
  });

  const templates = useQuery({
    queryKey: ["hr-msg-templates"],
    queryFn: () => listMessageTemplates(token),
    enabled: !!token && newOpen,
  });

  const create = useMutation({
    mutationFn: () =>
      createMessageBatch(token, {
        name: form.name.trim() || undefined,
        channel: form.channel,
        templateId: form.templateId || undefined,
      }),
    onSuccess: (b) => {
      setNewOpen(false);
      setForm({ name: "", channel: "sms", templateId: "" });
      qc.invalidateQueries({ queryKey: ["hr-msg-batches"] });
      navigate(`/${lineId}/human-resources/messages/${b.id}`);
    },
    onError: (e) => toast.error(surfaceErr(e, "Could not create the batch")),
  });

  const rows = batches.data?.batches ?? [];

  const stats = useMemo(() => {
    const s = { total: 0, sent: 0, failed: 0, waiting: 0 };
    for (const b of rows) {
      s.total++;
      s.sent += b.sentCount;
      s.failed += b.failedCount;
      s.waiting += Math.max(0, b.total - b.sentCount - b.failedCount);
    }
    return s;
  }, [rows]);

  return (
    <div className="w-full h-full bg-gray-50">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
                <Send className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Message Queue
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Each batch is one message and the people it goes to. Open a
                  batch to see who received it.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setNewOpen(true)}
              className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              New batch
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* ── Stats ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Batches on this page" value={stats.total} Icon={Inbox} tone="blue" />
          <StatCard label="Messages delivered" value={stats.sent} Icon={CheckCircle2} tone="emerald" />
          <StatCard label="Deliveries failed" value={stats.failed} Icon={XCircle} tone="red" />
          <StatCard label="Still to send" value={stats.waiting} Icon={Clock} tone="gray" />
        </div>

        {/* ── Toolbar ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg border shadow-sm p-3 flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search by batch name, subject or message text…"
              className="pl-9 h-10"
            />
          </div>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(0);
            }}
          >
            <SelectTrigger className="h-10 w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All batches</SelectItem>
              <SelectItem value="draft">Drafts only</SelectItem>
              <SelectItem value="sent">Sent only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── Batches ────────────────────────────────────────────────── */}
        {batches.isLoading ? (
          <div className="bg-white rounded-lg border shadow-sm p-16 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : rows.length === 0 ? (
          <div className="bg-white rounded-lg border shadow-sm flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="bg-gray-50 rounded-full p-4 mb-4">
              <Inbox className="h-12 w-12 text-gray-300" strokeWidth={1.5} />
            </div>
            <p className="text-gray-500 font-medium">
              {search || status !== "all"
                ? "No batches match this filter"
                : "No message batches yet"}
            </p>
            <p className="text-sm text-gray-400 mt-1 max-w-sm">
              {search || status !== "all"
                ? "Try a different search, or clear the filter."
                : "Create a batch, write the message once, then choose who receives it."}
            </p>
            {!search && status === "all" && (
              <Button
                onClick={() => setNewOpen(true)}
                variant="outline"
                className="mt-4 gap-2"
              >
                <Plus className="h-4 w-4" />
                New batch
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden divide-y">
            {rows.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => navigate(`/${lineId}/human-resources/messages/${b.id}`)}
                className="group w-full text-left px-4 sm:px-5 py-4 hover:bg-gray-50 transition-colors duration-150 flex items-start gap-4"
              >
                <div
                  className={`p-2 rounded-lg border flex-shrink-0 ${
                    b.channel === "email"
                      ? "bg-indigo-50 border-indigo-100 text-indigo-600"
                      : "bg-blue-50 border-blue-100 text-blue-600"
                  }`}
                >
                  {b.channel === "email" ? (
                    <Mail className="h-5 w-5" />
                  ) : (
                    <MessageSquare className="h-5 w-5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {b.name || b.subject || "Untitled batch"}
                    </p>
                    <StatusPill batch={b} />
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                    {b.body?.trim() || "No message written yet."}
                  </p>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {b.status === "draft"
                      ? `Created ${fmtDate(b.createdAt)}`
                      : b.status === "sending"
                        ? `Last sent ${fmtDate(b.sentAt)}`
                        : `Sent ${fmtDate(b.sentAt)}`}
                    {b.createdByName ? ` · ${b.createdByName}` : ""}
                    {` · ${AUDIENCE_LABEL[b.audience] ?? b.audience}`}
                  </p>
                  {b.status !== "draft" && b.total > 0 && (
                    <div className="mt-2 max-w-xs">
                      <DeliveryBar batch={b} />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 self-center">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-gray-900 tabular-nums flex items-center gap-1.5 justify-end">
                      <Users className="h-3.5 w-3.5 text-gray-400" />
                      {b.total}
                    </p>
                    <p className="text-xs text-gray-400">
                      {b.total === 1 ? "recipient" : "recipients"}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}

        {(batches.data?.pages ?? 0) > 1 && (
          <div className="flex justify-center items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-500 tabular-nums">
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
      </div>

      {/* ── New batch ────────────────────────────────────────────────── */}
      <Modal
        title="New message batch"
        onOpen={newOpen}
        setOnOpen={() => setNewOpen(false)}
        className="sm:max-w-lg"
        footer={true}
        loading={create.isPending}
        yesTitle="Create batch"
        onFunction={() => create.mutate()}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Batch name
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. October payroll reminder"
              className="h-10 mt-1.5"
            />
            <p className="text-xs text-gray-500 mt-1">
              Only for finding it later. Optional.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              How it will be sent
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {(
                [
                  { v: "sms", label: "Text message", sub: "SMS", Icon: MessageSquare },
                  { v: "email", label: "Email", sub: "Gmail only", Icon: Mail },
                ] as const
              ).map((c) => (
                <button
                  key={c.v}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, channel: c.v }))}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-colors ${
                    form.channel === c.v
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <c.Icon
                    className={`h-5 w-5 ${
                      form.channel === c.v ? "text-blue-600" : "text-gray-400"
                    }`}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-gray-900">
                      {c.label}
                    </span>
                    <span className="block text-xs text-gray-500">{c.sub}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Start from a template
            </label>
            <Select
              value={form.templateId || "none"}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, templateId: v === "none" ? "" : v }))
              }
            >
              <SelectTrigger className="h-10 mt-1.5">
                <SelectValue placeholder="Blank message" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Blank message</SelectItem>
                {(templates.data?.templates ?? []).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} · {t.channel === "email" ? "Email" : "SMS"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              You can still edit the message afterwards.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MessageQueue;
