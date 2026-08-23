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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
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
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700">
        <FileEdit className="h-2.5 w-2.5" />
        Draft
      </span>
    );
  // Part-way through: waves are still going out.
  if (batch.status === "sending") {
    const done = batch.sentCount + batch.failedCount;
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 tabular-nums">
        <Clock className="h-2.5 w-2.5" />
        {done} of {batch.total} sent
      </span>
    );
  }
  if (batch.failedCount === 0)
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700">
        <CheckCircle2 className="h-2.5 w-2.5" />
        All sent
      </span>
    );
  if (batch.sentCount === 0)
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-700">
        <XCircle className="h-2.5 w-2.5" />
        All failed
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700">
      <XCircle className="h-2.5 w-2.5" />
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
    <div className="bg-white rounded-lg border px-2.5 py-2 flex items-center gap-2">
      <div className={`p-1.5 rounded-md ${tones[tone]}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-gray-900 leading-none tabular-nums">
          {value}
        </p>
        <p className="text-[10px] text-gray-500 mt-0.5 truncate">{label}</p>
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
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b flex-shrink-0">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-blue-600 rounded-md flex-shrink-0">
              <Send className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-semibold text-gray-900 truncate">
                Message Queue
              </h1>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                One batch is one message and the people it goes to
              </p>
            </div>
          </div>
          <Button
            onClick={() => setNewOpen(true)}
            size="sm"
            className="h-7 text-[10px] gap-1.5 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-3 w-3" />
            New Batch
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b px-3 py-2 flex items-center gap-1.5 flex-wrap flex-shrink-0">
        <InputGroup className="bg-white flex-1 max-w-xs">
          <InputGroupAddon>
            <Search className="h-3 w-3 text-gray-400" />
          </InputGroupAddon>
          <InputGroupInput
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search name, subject or message..."
            className="h-7 text-[11px]"
          />
        </InputGroup>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[130px] h-7 text-[10px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-[11px]">
              All batches
            </SelectItem>
            <SelectItem value="draft" className="text-[11px]">
              Drafts only
            </SelectItem>
            <SelectItem value="sent" className="text-[11px]">
              Sent only
            </SelectItem>
          </SelectContent>
        </Select>
        <span className="text-[10px] text-gray-500 ml-auto">
          {batches.data?.total ?? rows.length} batch
          {(batches.data?.total ?? rows.length) !== 1 ? "es" : ""}
        </span>
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-3 space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <StatCard label="Batches on this page" value={stats.total} Icon={Inbox} tone="blue" />
          <StatCard label="Messages delivered" value={stats.sent} Icon={CheckCircle2} tone="emerald" />
          <StatCard label="Deliveries failed" value={stats.failed} Icon={XCircle} tone="red" />
          <StatCard label="Still to send" value={stats.waiting} Icon={Clock} tone="gray" />
        </div>

        {/* Batches */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="text-[10px] font-semibold text-gray-700 w-10">
                  No
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[200px]">
                  Batch
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[150px]">
                  Delivery
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 text-center w-24">
                  Recipients
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[150px]">
                  When
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 text-center w-24">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center gap-1.5 text-gray-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span className="text-[10px]">Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <Inbox className="h-5 w-5 text-gray-300" />
                      </div>
                      <p className="text-xs font-medium text-gray-700">
                        {search || status !== "all"
                          ? "No batches match this filter"
                          : "No message batches yet"}
                      </p>
                      <p className="text-[10px] text-gray-500 max-w-[260px]">
                        {search || status !== "all"
                          ? "Try a different search, or clear the filter."
                          : "Create a batch, write the message once, then choose who receives it."}
                      </p>
                      {!search && status === "all" && (
                        <Button
                          onClick={() => setNewOpen(true)}
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10px] gap-1.5 mt-1"
                        >
                          <Plus className="h-3 w-3" />
                          New Batch
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((b, i) => (
                  <TableRow
                    key={b.id}
                    className="hover:bg-gray-50 cursor-pointer group"
                    onClick={() =>
                      navigate(`/${lineId}/human-resources/messages/${b.id}`)
                    }
                  >
                    <TableCell className="text-[10px] text-gray-400 tabular-nums">
                      {page * 20 + i + 1}
                    </TableCell>
                    <TableCell className="min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {b.channel === "email" ? (
                          <Mail className="h-3 w-3 text-indigo-600 flex-shrink-0" />
                        ) : (
                          <MessageSquare className="h-3 w-3 text-blue-600 flex-shrink-0" />
                        )}
                        <p className="text-[11px] font-medium text-gray-900 truncate">
                          {b.name || b.subject || "Untitled batch"}
                        </p>
                        <ChevronRight className="h-3 w-3 text-gray-300 group-hover:text-blue-500 flex-shrink-0" />
                      </div>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">
                        {b.body?.trim() || "No message written yet."}
                      </p>
                    </TableCell>
                    <TableCell>
                      {b.status !== "draft" && b.total > 0 ? (
                        <div className="space-y-1">
                          <DeliveryBar batch={b} />
                          <p className="text-[10px] text-gray-500 tabular-nums">
                            {b.sentCount} sent
                            {b.failedCount ? ` · ${b.failedCount} failed` : ""}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-300">
                          Not sent yet
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-700 tabular-nums">
                        <Users className="h-2.5 w-2.5 text-gray-400" />
                        {b.total}
                      </span>
                    </TableCell>
                    <TableCell className="text-[10px] text-gray-600 whitespace-nowrap">
                      {b.status === "draft"
                        ? fmtDate(b.createdAt)
                        : fmtDate(b.sentAt)}
                      <span className="block text-[10px] text-gray-400 truncate">
                        {[b.createdByName, AUDIENCE_LABEL[b.audience] ?? b.audience]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusPill batch={b} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>


        {(batches.data?.pages ?? 0) > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-500 tabular-nums">
              Page {page + 1} of {batches.data?.pages}
            </p>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px]"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px]"
                disabled={page + 1 >= (batches.data?.pages ?? 1)}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
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
              className="h-7 mt-1 text-[11px]"
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
              <SelectTrigger className="h-7 mt-1 text-[11px]">
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
