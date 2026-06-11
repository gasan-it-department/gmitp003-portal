import axios from "../axios";

const jsonHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  Accept: "application/json",
  "X-Requested-With": "XMLHttpRequest",
});

export interface ComplaintUserMini {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  Position?: { name?: string | null } | null;
}

export interface ComplaintItem {
  id: string;
  userId: string;
  againstUserId?: string | null;
  lineId: string;
  title: string;
  category: string;
  description: string;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "normal" | "high";
  assignedToUserId?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  user?: ComplaintUserMini;
  againstUser?: ComplaintUserMini | null;
  assignedTo?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  _count?: { replies: number; evidence: number };
}

export interface ComplaintEvidence {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  caption?: string | null;
  createdAt: string;
  uploadedById?: string | null;
}

export interface LineUserMini {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  Position?: { name?: string | null } | null;
}

export interface ComplaintReplyItem {
  id: string;
  complaintId: string;
  userId: string;
  content: string;
  internal: boolean;
  createdAt: string;
  user?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    Position?: { name?: string | null } | null;
  };
}

export interface ComplaintDetail extends ComplaintItem {
  replies: ComplaintReplyItem[];
  evidence: ComplaintEvidence[];
}

// Multipart create — accepts text fields + zero-to-many evidence files.
// Files: PNG / JPG / WebP / GIF / PDF, max 10MB each.
export const createComplaint = async (
  token: string,
  body: {
    userId: string;
    lineId: string;
    title: string;
    description: string;
    category?: string;
    priority?: string;
    againstUserId?: string;
    files?: File[];
  },
) => {
  const fd = new FormData();
  fd.append("userId", body.userId);
  fd.append("lineId", body.lineId);
  fd.append("title", body.title);
  fd.append("description", body.description);
  if (body.category) fd.append("category", body.category);
  if (body.priority) fd.append("priority", body.priority);
  if (body.againstUserId) fd.append("againstUserId", body.againstUserId);
  (body.files ?? []).forEach((f) => fd.append("files", f));
  const res = await axios.post("/service/complaint/create", fd, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  return res.data as { message: string; complaint: ComplaintItem };
};

export const addEvidence = async (
  token: string,
  body: { complaintId: string; userId: string; files: File[] },
) => {
  const fd = new FormData();
  fd.append("complaintId", body.complaintId);
  fd.append("userId", body.userId);
  body.files.forEach((f) => fd.append("files", f));
  const res = await axios.post("/service/complaint/evidence/add", fd, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  return res.data;
};

export const removeEvidence = async (
  token: string,
  id: string,
  userId: string,
) => {
  const res = await axios.delete("/service/complaint/evidence/remove", {
    headers: jsonHeaders(token),
    params: { id, userId },
  });
  return res.data;
};

// Build the public URL for a single evidence file. The endpoint requires
// a Bearer token in the header so we use it via fetch/axios where the
// response body becomes a blob — image previews use this URL directly
// only when the API is on the same origin; otherwise see `fetchEvidence`.
export const evidenceFileUrl = (id: string) =>
  `/service/complaint/evidence/file?id=${encodeURIComponent(id)}`;

export const fetchEvidence = async (token: string, id: string) => {
  const res = await axios.get("/service/complaint/evidence/file", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/octet-stream",
    },
    params: { id },
    responseType: "blob",
  });
  return res.data as Blob;
};

export const listServiceLineUsers = async (
  token: string,
  lineId: string,
  query?: string,
) => {
  const res = await axios.get("/service/line-users", {
    headers: jsonHeaders(token),
    params: { lineId, query },
  });
  return res.data as { list: LineUserMini[] };
};

export const listComplaints = async (
  token: string,
  params: {
    userId?: string;
    lineId?: string;
    status?: string;
    category?: string;
    query?: string;
    lastCursor?: string | null;
    limit?: string;
  },
) => {
  const res = await axios.get("/service/complaint/list", {
    headers: jsonHeaders(token),
    params: {
      ...params,
      ...(params.lastCursor ? { lastCursor: params.lastCursor } : {}),
    },
  });
  return res.data as {
    list: ComplaintItem[];
    lastCursor: string | null;
    hasMore: boolean;
  };
};

export const complaintDetail = async (token: string, id: string) => {
  const res = await axios.get("/service/complaint/detail", {
    headers: jsonHeaders(token),
    params: { id },
  });
  return res.data as ComplaintDetail;
};

export const replyComplaint = async (
  token: string,
  body: {
    complaintId: string;
    userId: string;
    content: string;
    internal?: boolean;
  },
) => {
  const res = await axios.post("/service/complaint/reply", body, {
    headers: jsonHeaders(token),
  });
  return res.data;
};

export const updateComplaintStatus = async (
  token: string,
  body: {
    id: string;
    status?: string;
    priority?: string;
    assignedToUserId?: string | null;
  },
) => {
  const res = await axios.patch("/service/complaint/status", body, {
    headers: jsonHeaders(token),
  });
  return res.data;
};

export const removeComplaint = async (
  token: string,
  id: string,
  userId: string,
) => {
  const res = await axios.delete("/service/complaint/remove", {
    headers: jsonHeaders(token),
    params: { id, userId },
  });
  return res.data;
};
