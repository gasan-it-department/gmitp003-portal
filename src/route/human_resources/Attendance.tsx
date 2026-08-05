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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Modal from "@/components/custom/Modal";
import { toast } from "sonner";
import {
  QrCode,
  Plus,
  Search,
  Loader2,
  Trash2,
  Download,
  MapPin,
  CalendarDays,
  Users,
  Lock,
  LockOpen,
  ScanLine,
  UserPlus,
  X,
  ChevronRight,
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

/** `datetime-local` wants `YYYY-MM-DDTHH:mm` in LOCAL time. */
const toLocalInput = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(
    d.getHours(),
  )}:${p(d.getMinutes())}`;
};

const GROUP_ORDER: AttendanceFieldDef["group"][] = [
  "Identity",
  "Contact",
  "Employment",
  "Personal",
  "Address",
];

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
    startAt: toLocalInput(new Date()),
    endAt: "",
  });
  const [fields, setFields] = useState<string[]>([]);
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
        startAt: form.startAt ? new Date(form.startAt).toISOString() : undefined,
        endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined,
        fields,
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
    setForm({
      title: "",
      description: "",
      location: "",
      startAt: toLocalInput(new Date()),
      endAt: "",
    });
    setFields(catalogue.data?.defaults ?? []);
    setOpenCreate(true);
  };

  const list = events.data?.events ?? [];

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <QrCode className="h-5 w-5 text-blue-600" />
            Attendance
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Create a sheet, choose what it captures, then scan employee ID QR
            codes with the mobile app.
          </p>
        </div>
        <Button onClick={startCreate} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          New attendance sheet
        </Button>
      </div>

      <Tabs defaultValue="sheets">
        <TabsList>
          <TabsTrigger value="sheets" className="gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            Sheets
          </TabsTrigger>
          <TabsTrigger value="access" className="gap-1.5">
            <ScanLine className="h-3.5 w-3.5" />
            Scanner Access
          </TabsTrigger>
        </TabsList>

        {/* ── Sheets ───────────────────────────────────────────────────── */}
        <TabsContent value="sheets" className="space-y-3 mt-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="Search by title or venue…"
                className="pl-8 h-9"
              />
            </div>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sheets</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {events.isLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : list.length === 0 ? (
            <div className="rounded-lg border border-dashed py-14 text-center">
              <QrCode className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">
                No attendance sheets yet
              </p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Create one for a training, seminar, meeting or flag ceremony —
                then scan attendees in the mobile app.
              </p>
              <Button
                onClick={startCreate}
                size="sm"
                variant="outline"
                className="mt-3 gap-1.5"
              >
                <Plus className="h-4 w-4" />
                New attendance sheet
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {list.map((ev) => (
                <div
                  key={ev.id}
                  className="group rounded-lg border bg-white p-3 hover:border-blue-300 hover:shadow-sm transition"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/${lineId}/human-resources/attendance/${ev.id}`,
                        )
                      }
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">
                          {ev.title}
                        </p>
                        <Badge
                          variant="outline"
                          className={
                            ev.status === "open"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          }
                        >
                          {ev.status === "open" ? "Open" : "Closed"}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {fmtDate(ev.startAt)}
                        </span>
                        {ev.location ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {ev.location}
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1 font-medium text-gray-700">
                          <Users className="h-3 w-3" />
                          {ev.attendees ?? 0} recorded
                        </span>
                        <span className="text-gray-400">
                          {ev.fields.length} column
                          {ev.fields.length === 1 ? "" : "s"}
                        </span>
                      </div>
                    </button>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-1.5 text-emerald-700 hover:bg-emerald-50"
                        disabled={download.isPending}
                        onClick={() => download.mutate(ev)}
                        title="Export to Excel"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8"
                        disabled={toggleStatus.isPending}
                        onClick={() => toggleStatus.mutate(ev)}
                        title={
                          ev.status === "open" ? "Close sheet" : "Reopen sheet"
                        }
                      >
                        {ev.status === "open" ? (
                          <Lock className="h-3.5 w-3.5" />
                        ) : (
                          <LockOpen className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-rose-600 hover:bg-rose-50"
                        onClick={() => setConfirmDelete(ev)}
                        title="Delete sheet"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(events.data?.pages ?? 0) > 1 ? (
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-gray-500">
                Page {page + 1} of {events.data?.pages} · {events.data?.total}{" "}
                sheet{events.data?.total === 1 ? "" : "s"}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page + 1 >= (events.data?.pages ?? 1)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </TabsContent>

        {/* ── Scanner access ───────────────────────────────────────────── */}
        <TabsContent value="access" className="mt-3">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                Starts
              </label>
              <Input
                type="datetime-local"
                value={form.startAt}
                onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                className="mt-1"
              />
            </div>
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
    <div className="space-y-3">
      <div className="rounded-md border border-blue-100 bg-blue-50/60 p-3">
        <p className="text-xs text-blue-900">
          These users can record attendance from the mobile app. HR officers and
          super-admins always have access — this list is for everyone else you
          want to help at the door.
        </p>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm font-medium text-gray-700">
          Allowed scanners ({rows.length})
        </p>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => setPicker(true)}
        >
          <UserPlus className="h-4 w-4" />
          Add user
        </Button>
      </div>

      {grants.isLoading ? (
        <div className="flex items-center justify-center py-10 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed py-10 text-center">
          <ScanLine className="h-7 w-7 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No extra scanners yet</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Only HR officers can scan until you add someone here.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border divide-y">
          {rows.map((g) => (
            <div
              key={g.id}
              className="flex items-center justify-between gap-3 p-2.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {g.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {g.office ?? "No office"}
                  {g.grantedBy ? ` · granted by ${g.grantedBy}` : ""}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-rose-600 hover:bg-rose-50 h-8"
                disabled={revoke.isPending}
                onClick={() => revoke.mutate(g.id)}
              >
                Revoke
              </Button>
            </div>
          ))}
        </div>
      )}

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
