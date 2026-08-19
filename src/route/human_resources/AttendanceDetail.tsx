import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
//
import {
  attendanceEventDetail,
  attendanceRecords,
  deleteAttendanceRecord,
  exportAttendance,
  updateAttendanceEvent,
} from "@/db/statements/attendance";
//
import { Badge } from "@/components/ui/badge";
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

import AttendanceQrScanner from "@/layout/human_resources/AttendanceQrScanner";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Download,
  Loader2,
  Lock,
  LockOpen,
  MapPin,
  QrCode,
  RefreshCw,
  ScanLine,
  Search,
  Trash2,
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

const ALL = "__all__";

const AttendanceDetail = () => {
  const { lineId, eventId } = useParams();
  const auth = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [departmentId, setDepartmentId] = useState(ALL);
  const [entryFilter, setEntryFilter] = useState(ALL);
  const [page, setPage] = useState(0);
  const [confirmRemove, setConfirmRemove] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // What actually goes to the server — shared by the table and the export so
  // you always download exactly what you're looking at.
  const filters = {
    search: search || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    departmentId: departmentId === ALL ? undefined : departmentId,
    entry: entryFilter === ALL ? undefined : entryFilter,
  };
  const hasFilters =
    !!search ||
    !!dateFrom ||
    !!dateTo ||
    departmentId !== ALL ||
    entryFilter !== ALL;

  const event = useQuery({
    queryKey: ["attendance-event", eventId],
    queryFn: () =>
      attendanceEventDetail(auth.token as string, eventId as string),
    enabled: !!auth.token && !!eventId,
  });

  const records = useQuery({
    queryKey: ["attendance-records", eventId, page, filters],
    queryFn: () =>
      attendanceRecords(auth.token as string, eventId as string, {
        page,
        ...filters,
      }),
    enabled: !!auth.token && !!eventId,
  });

  const [scanning, setScanning] = useState(false);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["attendance-records", eventId] });
    qc.invalidateQueries({ queryKey: ["attendance-event", eventId] });
  };

  const toggleStatus = useMutation({
    mutationFn: () =>
      updateAttendanceEvent(auth.token as string, eventId as string, {
        status: event.data?.status === "open" ? "closed" : "open",
      }),
    onSuccess: (ev) => {
      toast.success(ev.status === "open" ? "Sheet reopened" : "Sheet closed");
      invalidate();
    },
    onError: (e) => toast.error(surfaceErr(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteAttendanceRecord(auth.token as string, id),
    onSuccess: () => {
      toast.success("Record removed");
      setConfirmRemove(null);
      invalidate();
    },
    onError: (e) => toast.error(surfaceErr(e)),
  });

  const download = useMutation({
    mutationFn: () =>
      exportAttendance(
        auth.token as string,
        eventId as string,
        event.data?.title ?? "Attendance",
        filters,
      ),
    onSuccess: (name) => toast.success(`Downloaded ${name}`),
    onError: (e) => toast.error(surfaceErr(e, "Export failed")),
  });

  const clearFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setDepartmentId(ALL);
    setPage(0);
  };

  const columns = records.data?.columns ?? event.data?.columns ?? [];
  const sheetEntries = records.data?.entries ?? event.data?.entries ?? [];
  const multiEntry = sheetEntries.length > 1;
  const offices = records.data?.departments ?? [];
  const rows = records.data?.records ?? [];

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 -ml-2 text-gray-600"
        onClick={() => navigate(`/${lineId}/human-resources/attendance`)}
      >
        <ArrowLeft className="h-4 w-4" />
        All attendance sheets
      </Button>

      {event.isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : event.isError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {surfaceErr(event.error, "Could not load this attendance sheet.")}
        </div>
      ) : (
        <>
          {/* ── Header ───────────────────────────────────────────────── */}
          <div className="rounded-lg border bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-blue-600 shrink-0" />
                  <h1 className="text-lg font-semibold text-gray-900 truncate">
                    {event.data?.title}
                  </h1>
                  <Badge
                    variant="outline"
                    className={
                      event.data?.status === "open"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-gray-100 text-gray-600 border-gray-200"
                    }
                  >
                    {event.data?.status === "open" ? "Open" : "Closed"}
                  </Badge>
                </div>
                {event.data?.description ? (
                  <p className="text-sm text-gray-600 mt-1.5">
                    {event.data.description}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    Created {fmtDate(event.data?.startAt)}
                  </span>
                  {event.data?.location ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.data.location}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={records.isFetching}
                  onClick={() => records.refetch()}
                  title="Reload the attendance list"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${
                      records.isFetching ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={toggleStatus.isPending}
                  onClick={() => toggleStatus.mutate()}
                >
                  {event.data?.status === "open" ? (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      Close sheet
                    </>
                  ) : (
                    <>
                      <LockOpen className="h-3.5 w-3.5" />
                      Reopen
                    </>
                  )}
                </Button>
                {event.data?.status === "open" && (
                  <Button
                    size="sm"
                    className="gap-1.5 bg-blue-600 hover:bg-blue-700"
                    onClick={() => setScanning(true)}
                  >
                    <ScanLine className="h-3.5 w-3.5" />
                    Scan QR
                  </Button>
                )}
                <Button
                  size="sm"
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                  disabled={download.isPending}
                  onClick={() => download.mutate()}
                >
                  {download.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  Export Excel
                </Button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md bg-blue-50 px-3 py-2">
              <Users className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-blue-900">
                <span className="font-semibold">{records.data?.total ?? 0}</span>{" "}
                attendee{(records.data?.total ?? 0) === 1 ? "" : "s"}
                {hasFilters ? " match this filter" : " recorded"}
              </p>
              {hasFilters && event.data?.attendees != null ? (
                <span className="text-xs text-blue-700">
                  of {event.data.attendees} on the sheet
                </span>
              ) : null}
            </div>
          </div>

          {/* ── Filters ──────────────────────────────────────────────── */}
          <div className="rounded-lg border bg-white p-3 space-y-2">
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                  placeholder="Search name or any recorded value…"
                  className="pl-8 h-9"
                />
              </div>

              {multiEntry && (
                <Select
                  value={entryFilter}
                  onValueChange={(v) => {
                    setEntryFilter(v);
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="w-[180px] h-9">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <ScanLine className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <SelectValue placeholder="All entries" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All entries</SelectItem>
                    {sheetEntries.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select
                value={departmentId}
                onValueChange={(v) => {
                  setDepartmentId(v);
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-[220px] h-9">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Building2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <SelectValue placeholder="All offices" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All offices / units</SelectItem>
                  {offices.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name} ({o.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-500">Recorded between</span>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(0);
                }}
                className="h-9 w-[160px]"
              />
              <span className="text-xs text-gray-400">and</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(0);
                }}
                className="h-9 w-[160px]"
              />
              {hasFilters ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 gap-1 text-gray-600"
                  onClick={clearFilters}
                >
                  <X className="h-3.5 w-3.5" />
                  Clear filters
                </Button>
              ) : null}
            </div>
          </div>

          {/* ── Records ──────────────────────────────────────────────── */}
          {records.isLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-lg border border-dashed py-14 text-center">
              <QrCode className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">
                {hasFilters ? "No records matched" : "Nobody scanned in yet"}
              </p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                {hasFilters
                  ? "Try widening the date range or clearing the office filter."
                  : "Open the mobile app, choose this sheet, and scan an employee's ID QR code — then press Refresh."}
              </p>
              {hasFilters ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-3 py-2 font-medium text-gray-600 w-12">
                      No.
                    </th>
                    {columns.map((c) => (
                      <th
                        key={c.key}
                        className="px-3 py-2 font-medium text-gray-600 whitespace-nowrap"
                      >
                        {c.label}
                      </th>
                    ))}
                    {multiEntry && (
                      <th className="px-3 py-2 font-medium text-gray-600 whitespace-nowrap">
                        Entry
                      </th>
                    )}
                    <th className="px-3 py-2 font-medium text-gray-600 whitespace-nowrap">
                      Recorded
                    </th>
                    <th className="px-3 py-2 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((r, i) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-400 tabular-nums">
                        {page * 25 + i + 1}
                      </td>
                      {columns.map((c) => (
                        <td
                          key={c.key}
                          className="px-3 py-2 text-gray-900 whitespace-nowrap"
                        >
                          {r.values[c.key] || (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      ))}
                      {multiEntry && (
                        <td className="px-3 py-2 whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className="text-[10px] px-2 bg-blue-50 text-blue-700 border-blue-200"
                          >
                            {r.entry}
                          </Badge>
                        </td>
                      )}
                      <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                        {fmtDate(r.timestamp)}
                        {r.scannedBy ? (
                          <span className="block text-[11px] text-gray-400">
                            by {r.scannedBy}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50"
                          onClick={() =>
                            setConfirmRemove({
                              id: r.id,
                              name: r.values[columns[0]?.key] ?? "this attendee",
                            })
                          }
                          title="Remove this record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(records.data?.pages ?? 0) > 1 ? (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Page {page + 1} of {records.data?.pages}
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
                  disabled={page + 1 >= (records.data?.pages ?? 1)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* Full-page scanner. Only offered on an OPEN sheet: a closed one
          refuses writes server-side, so a camera there only makes errors. */}
      {eventId ? (
        <AttendanceQrScanner
          open={scanning}
          onClose={() => setScanning(false)}
          eventId={eventId}
          eventTitle={event.data?.title ?? "this sheet"}
          entries={
            records.data?.entries ?? event.data?.entries ?? ["Attendance"]
          }
          onRecorded={invalidate}
        />
      ) : null}

      <Modal
        title="Remove this attendance record?"
        onOpen={!!confirmRemove}
        setOnOpen={() => setConfirmRemove(null)}
        className="sm:max-w-md"
        footer={true}
        loading={remove.isPending}
        yesTitle="Remove"
        onFunction={() => {
          if (confirmRemove) remove.mutate(confirmRemove.id);
        }}
      >
        <p className="text-sm text-gray-600">
          <span className="font-medium text-gray-900">
            {confirmRemove?.name}
          </span>{" "}
          will be taken off this sheet. They can be scanned again afterwards if
          the sheet is still open.
        </p>
      </Modal>
    </div>
  );
};

export default AttendanceDetail;
