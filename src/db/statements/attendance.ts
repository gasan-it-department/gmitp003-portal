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
  createdById?: string | null;
  createdAt: string;
  attendees?: number;
  columns?: AttendanceColumn[];
  createdBy?: { firstName: string; lastName: string } | null;
}

export interface AttendanceRecordRow {
  id: string;
  userId: string;
  timestamp: string;
  remarks?: string | null;
  profilePicture?: string | null;
  office?: string | null;
  scannedBy?: string | null;
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

// ─── Records ───────────────────────────────────────────────────────
export interface AttendanceRecordFilters {
  page?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  departmentId?: string;
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
