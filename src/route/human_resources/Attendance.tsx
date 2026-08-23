import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
//
import {
  attendanceFieldCatalogue,
  createAttendanceEvent,
  deleteAttendanceEvent,
  exportAttendance,
  grantAttendanceAccess,
  listAttendanceAccess,
  listAttendanceEvents,
  revokeAttendanceAccess,
  updateAttendanceEvent,
  type AttendanceEvent,
  type AttendanceFieldDef,
} from "@/db/statements/attendance";
import { listLineUsers, type LineUser } from "@/db/statements/leave";
//
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Download,
  Loader2,
  Lock,
  LockOpen,
  MapPin,
  Plus,
  QrCode,
  ScanLine,
  Search,
  Trash2,
  UserPlus,
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

const fullName = (u?: LineUser | null) =>
  `${u?.firstName ?? ""} ${u?.lastName ?? ""}`.trim() || u?.username || "—";

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

const GROUP_ORDER: AttendanceFieldDef["group"][] = [
  "Identity",
  "Contact",
  "Employment",
  "Personal",
  "Address",
];

/** Common shapes, so HR does not type the usual ones by hand every time. */
const ENTRY_PRESETS: { label: string; hint: string; entries: string[] }[] = [
  {
    label: "Single scan",
    hint: "One tap per person — a headcount, a seminar, a payout",
    entries: ["Attendance"],
  },
  {
    label: "In and Out",
    hint: "Two taps — arrival and departure",
    entries: ["Time In", "Time Out"],
  },
  {
    label: "AM / PM, in and out",
    hint: "Four taps — a full working day",
    entries: ["AM In", "AM Out", "PM In", "PM Out"],
  },
];

const MAX_ENTRIES = 8;

/**
 * Scan entries: the segments a sheet collects. A person can be recorded once
 * per entry, so a four-entry sheet holds up to four rows for them.
 *
 * Presets cover the usual shapes; the list underneath is fully editable
 * because HR asked to set these up at will.
 */
const EntryPicker = ({
  entries,
  onChange,
}: {
  entries: string[];
  onChange: (next: string[]) => void;
}) => {
  const [draft, setDraft] = useState("");

  const add = () => {
    const label = draft.trim();
    if (!label) return;
    if (entries.length >= MAX_ENTRIES) {
      toast.error(`A sheet can have at most ${MAX_ENTRIES} entries.`);
      return;
    }
    if (entries.some((e) => e.toLowerCase() === label.toLowerCase())) {
      toast.error(`"${label}" is already on this sheet.`);
      return;
    }
    onChange([...entries, label]);
    setDraft("");
  };

  const move = (i: number, by: number) => {
    const j = i + by;
    if (j < 0 || j >= entries.length) return;
    const next = [...entries];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const activePreset = ENTRY_PRESETS.find(
    (p) => JSON.stringify(p.entries) === JSON.stringify(entries),
  );

  return (
    <div className="space-y-2.5">
      <div className="grid gap-2 sm:grid-cols-3">
        {ENTRY_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange(p.entries)}
            className={`text-left rounded-lg border p-2.5 transition-colors ${
              activePreset?.label === p.label
                ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <span className="block text-xs font-semibold text-gray-900">
              {p.label}
            </span>
            <span className="block text-[11px] text-gray-500 mt-0.5">
              {p.hint}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-lg border divide-y">
        {entries.length === 0 ? (
          <p className="px-3 py-3 text-xs text-gray-500">
            No entries yet — pick a preset above or add your own below.
          </p>
        ) : (
          entries.map((e, i) => (
            <div key={`${e}-${i}`} className="flex items-center gap-2 px-3 py-2">
              <span className="w-5 text-[11px] text-gray-400 tabular-nums">
                {i + 1}
              </span>
              <span className="flex-1 text-sm text-gray-900 truncate">{e}</span>
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                title="Move up"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === entries.length - 1}
                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                title="Move down"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onChange(entries.filter((_, k) => k !== i))}
                className="p-1 text-gray-400 hover:text-red-600"
                title="Remove"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(ev) => setDraft(ev.target.value)}
          onKeyDown={(ev) => {
            if (ev.key === "Enter") {
              ev.preventDefault();
              add();
            }
          }}
          placeholder="Add an entry, e.g. Break Out"
          className="h-7 text-[11px]"
        />
        <Button type="button" variant="outline" size="sm" className="h-7 text-[10px]" onClick={add}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-[11px] text-gray-500">
        Each person can be scanned once per entry. Leave it as a single entry
        for a plain headcount.
      </p>
    </div>
  );
};

// ── The column picker: what the sheet captures from each employee ─────────
const ColumnPicker = ({
  catalogue,
  selected,
  onChange,
}: {
  catalogue: AttendanceFieldDef[];
  selected: string[];
  onChange: (next: string[]) => void;
}) => {
  const grouped = useMemo(() => {
    const m = new Map<string, AttendanceFieldDef[]>();
    for (const f of catalogue) {
      const arr = m.get(f.group) ?? [];
      arr.push(f);
      m.set(f.group, arr);
    }
    return m;
  }, [catalogue]);

  const toggle = (key: string) =>
    onChange(
      selected.includes(key)
        ? selected.filter((k) => k !== key)
        : [...selected, key],
    );

  return (
    <div className="space-y-3">
      {/* Chosen columns, in capture order — clicking removes. */}
      <div className="rounded-md border bg-gray-50 p-2.5">
        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
          Columns on this sheet ({selected.length})
        </p>
        {selected.length === 0 ? (
          <p className="text-xs text-gray-400 py-1">
            Nothing selected yet — pick at least one below.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {selected.map((k, i) => {
              const def = catalogue.find((f) => f.key === k);
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => toggle(k)}
                  className="group inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs text-blue-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                  title="Remove this column"
                >
                  <span className="font-mono text-[10px] opacity-60">
                    {i + 1}
                  </span>
                  {def?.label ?? k}
                  <X className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="max-h-64 overflow-y-auto rounded-md border divide-y">
        {GROUP_ORDER.filter((g) => grouped.has(g)).map((group) => (
          <div key={group} className="p-2.5">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              {group}
            </p>
            <div className="grid grid-cols-2 gap-1">
              {(grouped.get(group) ?? []).map((f) => {
                const on = selected.includes(f.key);
                return (
                  <label
                    key={f.key}
                    className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs ${
                      on ? "bg-blue-50 text-blue-800" : "hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(f.key)}
                      className="h-3.5 w-3.5 accent-blue-600"
                    />
                    <span className="truncate">{f.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-gray-500">
        Values are frozen when a person is scanned, so editing a profile later
        never changes a sheet you already exported.
      </p>
    </div>
  );
};

const Attendance = () => {
  const { lineId } = useParams();
  const auth = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(0);

  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
  });
  const [fields, setFields] = useState<string[]>([]);
  const [entries, setEntries] = useState<string[]>(["Attendance"]);
  const [confirmDelete, setConfirmDelete] = useState<AttendanceEvent | null>(
    null,
  );

  // ── queries ─────────────────────────────────────────────────────────────
  const catalogue = useQuery({
    queryKey: ["attendance-fields"],
    queryFn: () => attendanceFieldCatalogue(auth.token as string),
    enabled: !!auth.token,
    staleTime: 60 * 60 * 1000,
  });

  const events = useQuery({
    queryKey: ["attendance-events", lineId, page, search, status],
    queryFn: () =>
      listAttendanceEvents(auth.token as string, {
        lineId: lineId as string,
        page,
        search,
        status,
      }),
    enabled: !!auth.token && !!lineId,
  });

  // ── mutations ───────────────────────────────────────────────────────────
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["attendance-events", lineId] });

  const create = useMutation({
    mutationFn: () =>
      createAttendanceEvent(auth.token as string, {
        lineId: lineId as string,
        title: form.title,
        description: form.description || undefined,
        location: form.location || undefined,
        fields,
        entries,
      }),
    onSuccess: (ev) => {
      toast.success("Attendance sheet created");
      setOpenCreate(false);
      invalidate();
      navigate(`/${lineId}/human-resources/attendance/${ev.id}`);
    },
    onError: (e) => toast.error(surfaceErr(e, "Could not create the sheet")),
  });

  const toggleStatus = useMutation({
    mutationFn: (ev: AttendanceEvent) =>
      updateAttendanceEvent(auth.token as string, ev.id, {
        status: ev.status === "open" ? "closed" : "open",
      }),
    onSuccess: (ev) => {
      toast.success(ev.status === "open" ? "Sheet reopened" : "Sheet closed");
      invalidate();
    },
    onError: (e) => toast.error(surfaceErr(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteAttendanceEvent(auth.token as string, id),
    onSuccess: () => {
      toast.success("Attendance sheet deleted");
      setConfirmDelete(null);
      invalidate();
    },
    onError: (e) => toast.error(surfaceErr(e)),
  });

  const download = useMutation({
    mutationFn: (ev: AttendanceEvent) =>
      exportAttendance(auth.token as string, ev.id, ev.title),
    onSuccess: (name) => toast.success(`Downloaded ${name}`),
    onError: (e) => toast.error(surfaceErr(e, "Export failed")),
  });

  const startCreate = () => {
    setEntries(["Attendance"]);
    setForm({
      title: "",
      description: "",
      location: "",
    });
    setFields(catalogue.data?.defaults ?? []);
    setOpenCreate(true);
  };

  const list = events.data?.events ?? [];

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b flex-shrink-0">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-blue-600 rounded-md flex-shrink-0">
              <QrCode className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-semibold text-gray-900 truncate">
                Attendance
              </h1>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                Create a sheet, choose what it captures, then scan employee IDs
              </p>
            </div>
          </div>
          <Button
            onClick={startCreate}
            size="sm"
            className="h-7 text-[10px] gap-1.5 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-3 w-3" />
            New Sheet
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="sheets"
        className="flex-1 min-h-0 flex flex-col gap-0"
      >
        <div className="bg-white border-b px-3 py-1.5 flex-shrink-0">
          <TabsList className="h-7 p-0.5">
            <TabsTrigger
              value="sheets"
              className="h-6 px-2 text-[10px] gap-1.5 data-[state=active]:text-blue-700"
            >
              <CalendarDays className="h-3 w-3" />
              Sheets
            </TabsTrigger>
            <TabsTrigger
              value="access"
              className="h-6 px-2 text-[10px] gap-1.5 data-[state=active]:text-blue-700"
            >
              <ScanLine className="h-3 w-3" />
              Scanner Access
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Sheets ───────────────────────────────────────────────────── */}
        <TabsContent
          value="sheets"
          className="flex-1 min-h-0 m-0 flex flex-col focus-visible:outline-none"
        >
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
                placeholder="Search by title or venue..."
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
              <SelectTrigger className="w-[120px] h-7 text-[10px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[11px]">
                  All sheets
                </SelectItem>
                <SelectItem value="open" className="text-[11px]">
                  Open
                </SelectItem>
                <SelectItem value="closed" className="text-[11px]">
                  Closed
                </SelectItem>
              </SelectContent>
            </Select>
            <span className="text-[10px] text-gray-500 ml-auto">
              {events.data?.total ?? list.length} sheet
              {(events.data?.total ?? list.length) !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-auto p-3 space-y-3">

          <div className="border rounded-lg bg-white overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="text-[10px] font-semibold text-gray-700 w-10">
                    No
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[180px]">
                    Sheet
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[140px]">
                    Date
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[120px]">
                    Venue
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold text-gray-700 text-center w-20">
                    Recorded
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold text-gray-700 text-center w-20">
                    Status
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold text-gray-700 text-right w-28">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-1.5 text-gray-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span className="text-[10px]">Loading...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : list.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <QrCode className="h-5 w-5 text-gray-300" />
                        </div>
                        <p className="text-xs font-medium text-gray-700">
                          No attendance sheets yet
                        </p>
                        <p className="text-[10px] text-gray-500 max-w-[260px]">
                          Create one for a training, seminar, meeting or flag
                          ceremony, then scan attendees in.
                        </p>
                        <Button
                          onClick={startCreate}
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10px] gap-1.5 mt-1"
                        >
                          <Plus className="h-3 w-3" />
                          New Sheet
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  list.map((ev, i) => (
                    <TableRow
                      key={ev.id}
                      className="hover:bg-gray-50 cursor-pointer group"
                      onClick={() =>
                        navigate(
                          `/${lineId}/human-resources/attendance/${ev.id}`,
                        )
                      }
                    >
                      <TableCell className="text-[10px] text-gray-400 tabular-nums">
                        {page * 20 + i + 1}
                      </TableCell>
                      <TableCell className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-[11px] font-medium text-gray-900 truncate">
                            {ev.title}
                          </p>
                          <ChevronRight className="h-3 w-3 text-gray-300 group-hover:text-blue-500 flex-shrink-0" />
                        </div>
                        <p className="text-[10px] text-gray-400">
                          {ev.fields.length} column
                          {ev.fields.length === 1 ? "" : "s"}
                          {(ev.entries?.length ?? 0) > 1
                            ? ` · ${ev.entries.length} entries`
                            : ""}
                        </p>
                      </TableCell>
                      <TableCell className="text-[10px] text-gray-600 whitespace-nowrap">
                        {fmtDate(ev.startAt)}
                      </TableCell>
                      <TableCell className="text-[10px] text-gray-600">
                        {ev.location ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5 text-gray-400" />
                            <span className="truncate">{ev.location}</span>
                          </span>
                        ) : (
                          <span className="text-gray-300">&mdash;</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-700 tabular-nums">
                          <Users className="h-2.5 w-2.5 text-gray-400" />
                          {ev.attendees ?? 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${
                            ev.status === "open"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {ev.status === "open" ? "Open" : "Closed"}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-0.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-emerald-700 hover:bg-emerald-50"
                            disabled={download.isPending}
                            onClick={() => download.mutate(ev)}
                            title="Export to Excel"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            disabled={toggleStatus.isPending}
                            onClick={() => toggleStatus.mutate(ev)}
                            title={
                              ev.status === "open"
                                ? "Close sheet"
                                : "Reopen sheet"
                            }
                          >
                            {ev.status === "open" ? (
                              <Lock className="h-3 w-3" />
                            ) : (
                              <LockOpen className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-rose-600 hover:bg-rose-50"
                            onClick={() => setConfirmDelete(ev)}
                            title="Delete sheet"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {(events.data?.pages ?? 0) > 1 ? (
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-gray-500">
                Page {page + 1} of {events.data?.pages}
              </p>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px]"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px]"
                  disabled={page + 1 >= (events.data?.pages ?? 1)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
          </div>
        </TabsContent>

        {/* Scanner access */}
        <TabsContent
          value="access"
          className="flex-1 min-h-0 m-0 overflow-auto p-3 focus-visible:outline-none"
        >
          <ScannerAccess lineId={lineId as string} token={auth.token as string} />
        </TabsContent>
      </Tabs>

      {/* ── Create modal ─────────────────────────────────────────────────── */}
      <Modal
        title="New attendance sheet"
        onOpen={openCreate}
        setOnOpen={() => setOpenCreate(false)}
        className="sm:max-w-2xl"
        footer={true}
        loading={create.isPending}
        yesTitle="Create sheet"
        onFunction={() => {
          if (!form.title.trim()) {
            toast.error("Give the sheet a title");
            return;
          }
          if (!fields.length) {
            toast.error("Pick at least one column");
            return;
          }
          create.mutate();
        }}
      >
        <div className="space-y-3 overflow-y-auto">
          <div>
            <label className="text-xs font-medium text-gray-600">
              Title <span className="text-rose-500">*</span>
            </label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Gender Sensitivity Seminar 2026"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Venue</label>
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. Municipal Gymnasium"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">
              Description
            </label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Optional notes about this activity"
              className="mt-1 min-h-[60px]"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">
              How many times is each person scanned?
            </label>
            <div className="mt-1.5">
              <EntryPicker entries={entries} onChange={setEntries} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">
              What should this sheet record?
            </label>
            <div className="mt-1.5">
              {catalogue.isLoading ? (
                <div className="flex items-center gap-2 text-xs text-gray-400 py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading available fields…
                </div>
              ) : (
                <ColumnPicker
                  catalogue={catalogue.data?.fields ?? []}
                  selected={fields}
                  onChange={setFields}
                />
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Delete confirm ───────────────────────────────────────────────── */}
      <Modal
        title="Delete attendance sheet?"
        onOpen={!!confirmDelete}
        setOnOpen={() => setConfirmDelete(null)}
        className="sm:max-w-md"
        footer={true}
        loading={remove.isPending}
        yesTitle="Delete"
        onFunction={() => {
          if (confirmDelete) remove.mutate(confirmDelete.id);
        }}
      >
        <p className="text-sm text-gray-600">
          <span className="font-medium text-gray-900">
            {confirmDelete?.title}
          </span>{" "}
          and its {confirmDelete?.attendees ?? 0} attendance record
          {confirmDelete?.attendees === 1 ? "" : "s"} will be permanently
          removed. Export it first if you still need the list.
        </p>
      </Modal>
    </div>
  );
};

// ── Who may run the scanner ────────────────────────────────────────────────
const ScannerAccess = ({
  lineId,
  token,
}: {
  lineId: string;
  token: string;
}) => {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [picker, setPicker] = useState(false);

  const grants = useQuery({
    queryKey: ["attendance-access", lineId],
    queryFn: () => listAttendanceAccess(token, lineId),
    enabled: !!token && !!lineId,
  });

  const users = useQuery({
    queryKey: ["attendance-line-users", lineId, query],
    queryFn: () => listLineUsers(token, lineId, query),
    enabled: !!token && !!lineId && picker,
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["attendance-access", lineId] });

  const grant = useMutation({
    mutationFn: (userId: string) =>
      grantAttendanceAccess(token, { lineId, userId }),
    onSuccess: () => {
      toast.success("Scanner access granted");
      setPicker(false);
      invalidate();
    },
    onError: (e) => toast.error(surfaceErr(e)),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => revokeAttendanceAccess(token, id),
    onSuccess: () => {
      toast.success("Access revoked");
      invalidate();
    },
    onError: (e) => toast.error(surfaceErr(e)),
  });

  const rows = grants.data?.users ?? [];

  return (
    <div className="space-y-2">
      <div className="rounded-md border border-blue-100 bg-blue-50/60 px-2.5 py-2">
        <p className="text-[10px] text-blue-900 leading-snug">
          These users can record attendance from the mobile app. HR officers and
          super-admins always have access &mdash; this list is for everyone else
          you want to help at the door.
        </p>
      </div>

      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <ScanLine className="h-3 w-3 text-blue-500" />
            <h3 className="text-xs font-semibold text-gray-800">
              Allowed scanners
            </h3>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {rows.length}
            </Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[10px] gap-1.5"
            onClick={() => setPicker(true)}
          >
            <UserPlus className="h-3 w-3" />
            Add User
          </Button>
        </div>

        <Table>
          <TableHeader className="bg-white">
            <TableRow>
              <TableHead className="text-[10px] font-semibold text-gray-700 w-10">
                No
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[160px]">
                Name
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[140px]">
                Office
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[140px]">
                Granted by
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-gray-700 text-right w-20">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grants.isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex items-center justify-center gap-1.5 text-gray-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span className="text-[10px]">Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <ScanLine className="h-5 w-5 text-gray-300" />
                    </div>
                    <p className="text-xs font-medium text-gray-700">
                      No extra scanners yet
                    </p>
                    <p className="text-[10px] text-gray-500 max-w-[260px]">
                      Only HR officers can scan until you add someone here.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] gap-1.5 mt-1"
                      onClick={() => setPicker(true)}
                    >
                      <UserPlus className="h-3 w-3" />
                      Add User
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((g, i) => (
                <TableRow key={g.id} className="hover:bg-gray-50">
                  <TableCell className="text-[10px] text-gray-400 tabular-nums">
                    {i + 1}
                  </TableCell>
                  <TableCell className="text-[11px] font-medium text-gray-900 truncate">
                    {g.name}
                  </TableCell>
                  <TableCell className="text-[10px] text-gray-600 truncate">
                    {g.office ?? "No office"}
                  </TableCell>
                  <TableCell className="text-[10px] text-gray-500 truncate">
                    {g.grantedBy ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px] px-2 text-rose-600 hover:bg-rose-50"
                      disabled={revoke.isPending}
                      onClick={() => revoke.mutate(g.id)}
                    >
                      Revoke
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Modal
        title="Allow a user to scan attendance"
        onOpen={picker}
        setOnOpen={() => setPicker(false)}
        className="sm:max-w-lg"
        footer={1}
      >
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search employees…"
              className="pl-8"
            />
          </div>
          <div className="max-h-72 overflow-y-auto rounded-md border divide-y">
            {users.isLoading ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (users.data?.list ?? []).length === 0 ? (
              <p className="py-8 text-center text-xs text-gray-500">
                No employees matched.
              </p>
            ) : (
              (users.data?.list ?? []).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  disabled={grant.isPending}
                  onClick={() => grant.mutate(u.id)}
                  className="flex w-full items-center justify-between gap-3 p-2.5 text-left hover:bg-blue-50 disabled:opacity-50"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900 truncate">
                      {fullName(u)}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {u.Position?.name ?? "No position"}
                    </p>
                  </div>
                  <Plus className="h-4 w-4 text-blue-500 shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Attendance;
