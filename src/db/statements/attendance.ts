import axios from "../axios";

const jsonHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  Accept: "application/json",
  "X-Requested-With": "XMLHttpRequest",
});

// ─── Types ─────────────────────────────────────────────────────────
export interface AttendanceFieldDef {
  key: string;
  label: string;
  group: "Identity" | "Contact" | "Employment" | "Personal" | "Address";
  pds?: boolean;
}

export interface AttendanceColumn {
  key: string;
  label: string;
}

export interface AttendanceEvent {
  id: string;
  lineId: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startAt: string;
  endAt?: string | null;
  status: "open" | "closed";
  fields: string[];
  entries: string[];
  createdById?: string | null;
  createdAt: string;
  attendees?: number;
  columns?: AttendanceColumn[];
  createdBy?: { firstName: string; lastName: string } | null;
}

export interface AttendanceRecordRow {
  id: string;
  userId: string;
  /** Who the row is FOR — always present, whatever columns the sheet captures. */
  attendee: string;
  entry: string;
  timestamp: string;
  remarks?: string | null;
  profilePicture?: string | null;
  office?: string | null;
  scannedBy?: string | null;
  scannedById?: string | null;
  values: Record<string, string>;
}

export interface AttendanceGrant {
  id: string;
  userId: string;
  name: string;
  office?: string | null;
  grantedBy?: string | null;
  timestamp: string;
}

// ─── Field catalogue ───────────────────────────────────────────────
export const attendanceFieldCatalogue = async (token: string) => {
  const res = await axios.get("/attendance/fields", {
    headers: jsonHeaders(token),
  });
  return res.data as { fields: AttendanceFieldDef[]; defaults: string[] };
};

// ─── Events ────────────────────────────────────────────────────────
export const createAttendanceEvent = async (
  token: string,
  body: {
    lineId: string;
    title: string;
    description?: string;
    location?: string;
    startAt?: string;
    endAt?: string;
    fields: string[];
    /** Scan entries HR set up, in order. Empty = a single default entry. */
    entries?: string[];
  },
) => {
  const res = await axios.post("/attendance/event", body, {
    headers: jsonHeaders(token),
  });
  return res.data as AttendanceEvent;
};

export const listAttendanceEvents = async (
  token: string,
  params: { lineId: string; page?: number; search?: string; status?: string },
) => {
  const res = await axios.get("/attendance/events", {
    headers: jsonHeaders(token),
    params,
  });
  return res.data as {
    events: AttendanceEvent[];
    total: number;
    page: number;
    pages: number;
  };
};

export const attendanceEventDetail = async (token: string, eventId: string) => {
  const res = await axios.get(`/attendance/event/${eventId}`, {
    headers: jsonHeaders(token),
  });
  return res.data as AttendanceEvent;
};

export const updateAttendanceEvent = async (
  token: string,
  eventId: string,
  body: Partial<{
    title: string;
    description: string;
    location: string;
    startAt: string;
    endAt: string | null;
    status: "open" | "closed";
    fields: string[];
    entries: string[];
  }>,
) => {
  const res = await axios.patch(`/attendance/event/${eventId}`, body, {
    headers: jsonHeaders(token),
  });
  return res.data as AttendanceEvent;
};

export const deleteAttendanceEvent = async (token: string, eventId: string) => {
  const res = await axios.delete(`/attendance/event/${eventId}`, {
    headers: jsonHeaders(token),
  });
  return res.data as { message: string };
};

// ─── Live scanning (web camera) ─────────────────────────────────────
// The same endpoint the mobile scanner posts to, gated by
// attendanceMobileAuth: super-admin, the line's HRMO, or an explicit grant.
// It accepts the raw scanned code, so one round trip both records the person
// and answers with everything the result toast needs.
export interface ScanConfirmation {
  record?: { id: string } | null;
  fullName?: string | null;
  /** Which scan entry the row landed on. */
  entry?: string;
  /** True when this scan fell inside the person's cool-down for this entry —
   *  nothing was written, and `record` is the row already there. */
  duplicate?: boolean;
  /** DISTINCT people on the whole sheet. */
  attendees?: number;
  /** DISTINCT people in this entry alone — what HR watches per session. */
  entryCount?: number;
  /** When this person may scan into this entry again (ISO). */
  nextAllowedAt?: string | null;
  /** The cool-down the server is enforcing, in ms. */
  cooldownMs?: number;
}

export const confirmAttendanceScan = async (
  token: string,
  eventId: string,
  code: string,
  entry?: string,
) => {
  const res = await axios.post(
    "/attendance/confirm",
    { eventId, code, entry, scannedAt: new Date().toISOString() },
    { headers: jsonHeaders(token) },
  );
  return res.data as ScanConfirmation;
};

// ─── Records ───────────────────────────────────────────────────────
export interface AttendanceRecordFilters {
  page?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  departmentId?: string;
  /** One of the sheet's scan entries, e.g. "AM Out". */
  entry?: string;
}

export interface AttendanceOffice {
  id: string;
  name: string;
  count: number;
}

export const attendanceRecords = async (
  token: string,
  eventId: string,
  params: AttendanceRecordFilters = {},
) => {
  const res = await axios.get(`/attendance/event/${eventId}/records`, {
    headers: jsonHeaders(token),
    params,
  });
  return res.data as {
    columns: AttendanceColumn[];
    /** The sheet's scan entries, in HR's order. */
    entries: string[];
    departments: AttendanceOffice[];
    records: AttendanceRecordRow[];
    total: number;
    page: number;
    pages: number;
  };
};

export const deleteAttendanceRecord = async (
  token: string,
  recordId: string,
) => {
  const res = await axios.delete(`/attendance/record/${recordId}`, {
    headers: jsonHeaders(token),
  });
  return res.data as { message: string };
};

/** Streams the sheet as .xlsx and triggers the browser download. */
export const exportAttendance = async (
  token: string,
  eventId: string,
  fallbackName = "Attendance",
  /** Same filters as the table — the export mirrors what's on screen. */
  filters: Omit<AttendanceRecordFilters, "page"> = {},
) => {
  const res = await axios.get(`/attendance/event/${eventId}/export`, {
    headers: jsonHeaders(token),
    params: filters,
    responseType: "blob",
  });

  const disposition = res.headers["content-disposition"];
  let filename = `${fallbackName}.xlsx`;
  if (disposition) {
    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (match && match[1]) filename = match[1].replace(/['"]/g, "");
  }

  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  return filename;
};

// ─── Scanner access ────────────────────────────────────────────────
export const listAttendanceAccess = async (token: string, lineId: string) => {
  const res = await axios.get("/attendance/mobile-access", {
    headers: jsonHeaders(token),
    params: { lineId },
  });
  return res.data as { users: AttendanceGrant[] };
};

export const grantAttendanceAccess = async (
  token: string,
  body: { lineId: string; userId: string },
) => {
  const res = await axios.post("/attendance/mobile-access", body, {
    headers: jsonHeaders(token),
  });
  return res.data;
};

export const revokeAttendanceAccess = async (
  token: string,
  accessId: string,
) => {
  const res = await axios.delete(`/attendance/mobile-access/${accessId}`, {
    headers: jsonHeaders(token),
  });
  return res.data as { message: string };
};
