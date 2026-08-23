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

import AttendanceQrScanner from "@/layout/human_resources/AttendanceQrScanner";
import {
  ArrowLeft,
  Building2,
  Download,
  Loader2,
  Lock,
  LockOpen,
  QrCode,
  RefreshCw,
  ScanLine,
  Search,
  Trash2,
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
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b flex-shrink-0">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 flex-shrink-0"
              onClick={() => navigate(`/${lineId}/human-resources/attendance`)}
              title="All attendance sheets"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-gray-600" />
            </Button>
            <div className="p-1.5 bg-blue-600 rounded-md flex-shrink-0">
              <QrCode className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <h1 className="text-xs font-semibold text-gray-900 truncate">
                  {event.data?.title ?? "Attendance sheet"}
                </h1>
                {event.data ? (
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${
                      event.data.status === "open"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-gray-100 text-gray-600 border-gray-200"
                    }`}
                  >
                    {event.data.status === "open" ? "Open" : "Closed"}
                  </Badge>
                ) : null}
              </div>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5 truncate">
                {[
                  fmtDate(event.data?.startAt),
                  event.data?.location,
                  event.data?.description,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px] gap-1.5"
              disabled={records.isFetching}
              onClick={() => records.refetch()}
              title="Reload the attendance list"
            >
              <RefreshCw
                className={`h-3 w-3 ${records.isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px] gap-1.5"
              disabled={toggleStatus.isPending}
              onClick={() => toggleStatus.mutate()}
            >
              {event.data?.status === "open" ? (
                <>
                  <Lock className="h-3 w-3" />
                  Close
                </>
              ) : (
                <>
                  <LockOpen className="h-3 w-3" />
                  Reopen
                </>
              )}
            </Button>
            {event.data?.status === "open" && (
              <Button
                size="sm"
                className="h-7 text-[10px] gap-1.5 bg-blue-600 hover:bg-blue-700"
                onClick={() => setScanning(true)}
              >
                <ScanLine className="h-3 w-3" />
                Scan QR
              </Button>
            )}
            <Button
              size="sm"
              className="h-7 text-[10px] gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              disabled={download.isPending}
              onClick={() => download.mutate()}
            >
              {download.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              Export
            </Button>
          </div>
        </div>
      </div>

      {event.isLoading ? (
        <div className="flex-1 flex items-center justify-center gap-1.5 text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-[10px]">Loading...</span>
        </div>
      ) : event.isError ? (
        <div className="flex-1 flex items-center justify-center p-3">
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
            {surfaceErr(event.error, "Could not load this attendance sheet.")}
          </div>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="bg-white border-b px-3 py-2 flex items-center gap-1.5 flex-wrap flex-shrink-0">
            <InputGroup className="bg-white flex-1 min-w-[180px] max-w-xs">
              <InputGroupAddon>
                <Search className="h-3 w-3 text-gray-400" />
              </InputGroupAddon>
              <InputGroupInput
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="Search name or recorded value..."
                className="h-7 text-[11px]"
              />
            </InputGroup>

            {multiEntry && (
              <Select
                value={entryFilter}
                onValueChange={(v) => {
                  setEntryFilter(v);
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-[140px] h-7 text-[10px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <ScanLine className="h-3 w-3 text-gray-400 shrink-0" />
                    <SelectValue placeholder="All entries" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL} className="text-[11px]">
                    All entries
                  </SelectItem>
                  {sheetEntries.map((e) => (
                    <SelectItem key={e} value={e} className="text-[11px]">
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
              <SelectTrigger className="w-[170px] h-7 text-[10px]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Building2 className="h-3 w-3 text-gray-400 shrink-0" />
                  <SelectValue placeholder="All offices" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL} className="text-[11px]">
                  All offices / units
                </SelectItem>
                {offices.map((o) => (
                  <SelectItem key={o.id} value={o.id} className="text-[11px]">
                    {o.name} ({o.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(0);
              }}
              className="h-7 w-[125px] text-[10px]"
              title="Recorded from"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(0);
              }}
              className="h-7 w-[125px] text-[10px]"
              title="Recorded until"
            />
            {hasFilters ? (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[10px] gap-1 text-gray-600"
                onClick={clearFilters}
              >
                <X className="h-3 w-3" />
                Clear
              </Button>
            ) : null}

            <span className="text-[10px] text-gray-500 ml-auto whitespace-nowrap">
              <span className="font-semibold text-gray-700 tabular-nums">
                {records.data?.total ?? 0}
              </span>{" "}
              {hasFilters ? "match" : "recorded"}
              {hasFilters && event.data?.attendees != null
                ? ` of ${event.data.attendees}`
                : ""}
            </span>
          </div>

          {/* Records */}
          <div className="flex-1 min-h-0 overflow-auto p-3 space-y-3">
            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr className="border-b text-left">
                      <th className="px-3 py-2 text-[10px] font-semibold text-gray-700 w-12">
                        No
                      </th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-gray-700 whitespace-nowrap">
                        Employee
                      </th>
                      {columns.map((c) => (
                        <th
                          key={c.key}
                          className="px-3 py-2 text-[10px] font-semibold text-gray-700 whitespace-nowrap"
                        >
                          {c.label}
                        </th>
                      ))}
                      {multiEntry && (
                        <th className="px-3 py-2 text-[10px] font-semibold text-gray-700 whitespace-nowrap">
                          Entry
                        </th>
                      )}
                      <th className="px-3 py-2 text-[10px] font-semibold text-gray-700 whitespace-nowrap">
                        Recorded
                      </th>
                      <th className="px-3 py-2 w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {records.isLoading ? (
                      <tr>
                        <td
                          colSpan={columns.length + (multiEntry ? 5 : 4)}
                          className="text-center py-8"
                        >
                          <div className="flex items-center justify-center gap-1.5 text-gray-400">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span className="text-[10px]">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={columns.length + (multiEntry ? 5 : 4)}
                          className="text-center py-10"
                        >
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <QrCode className="h-5 w-5 text-gray-300" />
                            </div>
                            <p className="text-xs font-medium text-gray-700">
                              {hasFilters
                                ? "No records matched"
                                : "Nobody scanned in yet"}
                            </p>
                            <p className="text-[10px] text-gray-500 max-w-[280px]">
                              {hasFilters
                                ? "Try widening the date range or clearing the office filter."
                                : "Press Scan QR to open the camera, or scan from the mobile app, then press Refresh."}
                            </p>
                            {hasFilters ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[10px] mt-1"
                                onClick={clearFilters}
                              >
                                Clear filters
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      rows.map((r, i) => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-3 py-1.5 text-[10px] text-gray-400 tabular-nums">
                            {page * 25 + i + 1}
                          </td>
                          {/* Always the ATTENDEE, never the operator. A sheet
                              that captures no name column used to leave
                              "scanned by <operator>" as the only name here. */}
                          <td className="px-3 py-1.5 text-[11px] font-medium text-gray-900 whitespace-nowrap">
                            {r.attendee}
                          </td>
                          {columns.map((c) => (
                            <td
                              key={c.key}
                              className="px-3 py-1.5 text-[11px] text-gray-700 whitespace-nowrap"
                            >
                              {r.values[c.key] || (
                                <span className="text-gray-300">&mdash;</span>
                              )}
                            </td>
                          ))}
                          {multiEntry && (
                            <td className="px-3 py-1.5 whitespace-nowrap">
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200"
                              >
                                {r.entry}
                              </Badge>
                            </td>
                          )}
                          <td className="px-3 py-1.5 text-[10px] text-gray-500 whitespace-nowrap">
                            {fmtDate(r.timestamp)}
                            {r.scannedBy ? (
                              <span className="block text-[10px] text-gray-400">
                                Scanned by {r.scannedBy}
                              </span>
                            ) : null}
                          </td>
                          <td className="px-3 py-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-rose-600 hover:bg-rose-50"
                              onClick={() =>
                                setConfirmRemove({
                                  id: r.id,
                                  name:
                                    r.attendee ??
                                    r.values[columns[0]?.key] ??
                                    "this attendee",
                                })
                              }
                              title="Remove this record"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>


            {(records.data?.pages ?? 0) > 1 ? (
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-gray-500">
                  Page {page + 1} of {records.data?.pages}
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
                    disabled={page + 1 >= (records.data?.pages ?? 1)}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
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
