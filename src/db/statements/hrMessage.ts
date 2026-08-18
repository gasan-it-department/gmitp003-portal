import axios from "../axios";

const jsonHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  Accept: "application/json",
  "X-Requested-With": "XMLHttpRequest",
});

// ─── Types ─────────────────────────────────────────────────────────
export type MessageChannel = "sms" | "email";
export type Audience = "plantilla" | "non-plantilla" | "custom";
export type BatchStatus = "draft" | "sent";
export type RecipientStatus = "pending" | "sent" | "failed";

export interface MessagePlaceholder {
  key: string;
  label: string;
  group: string;
  token: string;
}

export interface MessageTemplateRow {
  id: string;
  name: string;
  channel: MessageChannel;
  subject: string | null;
  body: string;
  placeholders: string[];
  createdAt: string;
  updatedAt: string;
}

/** An employee in the directory, as offered to the recipient picker. */
export interface EmployeeRow {
  id: string;
  name: string;
  status: string;
  plantilla: boolean;
  position: string | null;
  office: string | null;
  to: string;
  sendable: boolean;
  reason: string | null;
  added: boolean;
}

export interface MessageBatchRow {
  id: string;
  name: string | null;
  channel: MessageChannel;
  subject: string | null;
  body: string;
  audience: Audience;
  status: BatchStatus;
  total: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  sentAt: string | null;
  createdByName?: string | null;
}

export interface BatchRecipientRow {
  id: string;
  userId: string;
  name: string;
  toAddress: string;
  renderedBody: string;
  status: RecipientStatus;
  error: string | null;
  attempts: number;
  sentAt: string | null;
}

export interface BatchCounts {
  pending: number;
  sent: number;
  failed: number;
  total: number;
}

// ─── Composing aids ────────────────────────────────────────────────
export const messagePlaceholders = async (token: string) => {
  const res = await axios.get("/hr/message/placeholders", {
    headers: jsonHeaders(token),
  });
  return res.data as { placeholders: MessagePlaceholder[] };
};

export const previewMessageFor = async (
  token: string,
  body: { body: string; userId: string },
) => {
  const res = await axios.post("/hr/message/preview", body, {
    headers: jsonHeaders(token),
  });
  return res.data as { rendered: string; unresolved: string[] };
};

// ─── Templates ─────────────────────────────────────────────────────
export const listMessageTemplates = async (token: string) => {
  const res = await axios.get("/hr/message/templates", {
    headers: jsonHeaders(token),
  });
  return res.data as { templates: MessageTemplateRow[] };
};

export const saveMessageTemplate = async (
  token: string,
  body: {
    id?: string;
    name: string;
    channel: MessageChannel;
    subject?: string;
    body: string;
  },
) => {
  const res = await axios.post("/hr/message/template", body, {
    headers: jsonHeaders(token),
  });
  return res.data as MessageTemplateRow;
};

export const deleteMessageTemplate = async (token: string, id: string) => {
  const res = await axios.delete(`/hr/message/template/${id}`, {
    headers: jsonHeaders(token),
  });
  return res.data as { message: string };
};

// ─── Employee directory ────────────────────────────────────────────
export const searchMessageEmployees = async (
  token: string,
  params: {
    audience?: Audience;
    query?: string;
    channel?: MessageChannel;
    batchId?: string;
  },
) => {
  const res = await axios.get("/hr/message/employees", {
    headers: jsonHeaders(token),
    params,
  });
  return res.data as { employees: EmployeeRow[]; max: number };
};

// ─── Batches ───────────────────────────────────────────────────────
export const listMessageBatches = async (
  token: string,
  params: { page?: number; search?: string; status?: string },
) => {
  const res = await axios.get("/hr/message/batches", {
    headers: jsonHeaders(token),
    params,
  });
  return res.data as {
    batches: MessageBatchRow[];
    total: number;
    page: number;
    pages: number;
  };
};

export const createMessageBatch = async (
  token: string,
  body: { name?: string; channel: MessageChannel; templateId?: string },
) => {
  const res = await axios.post("/hr/message/batch", body, {
    headers: jsonHeaders(token),
  });
  return res.data as MessageBatchRow;
};

export const messageBatchDetail = async (
  token: string,
  id: string,
  params: { search?: string; status?: string } = {},
) => {
  const res = await axios.get(`/hr/message/batch/${id}`, {
    headers: jsonHeaders(token),
    params,
  });
  return res.data as {
    batch: MessageBatchRow;
    recipients: BatchRecipientRow[];
    counts: BatchCounts;
    max: number;
  };
};

export const updateMessageBatch = async (
  token: string,
  id: string,
  body: Partial<{
    name: string;
    channel: MessageChannel;
    subject: string;
    body: string;
    audience: Audience;
  }>,
) => {
  const res = await axios.patch(`/hr/message/batch/${id}`, body, {
    headers: jsonHeaders(token),
  });
  return res.data as MessageBatchRow;
};

export const deleteMessageBatch = async (token: string, id: string) => {
  const res = await axios.delete(`/hr/message/batch/${id}`, {
    headers: jsonHeaders(token),
  });
  return res.data as { message: string };
};

// ─── Recipients on a draft ─────────────────────────────────────────
export const addBatchRecipients = async (
  token: string,
  id: string,
  userIds: string[],
) => {
  const res = await axios.post(
    `/hr/message/batch/${id}/recipients`,
    { userIds },
    { headers: jsonHeaders(token) },
  );
  return res.data as { added: number; total: number };
};

export const removeBatchRecipient = async (
  token: string,
  id: string,
  recipientId: string,
) => {
  const res = await axios.delete(
    `/hr/message/batch/${id}/recipient/${recipientId}`,
    { headers: jsonHeaders(token) },
  );
  return res.data as { message: string; total: number };
};

// ─── Dispatch ──────────────────────────────────────────────────────
export const sendMessageBatch = async (token: string, id: string) => {
  const res = await axios.post(
    `/hr/message/batch/${id}/send`,
    {},
    { headers: jsonHeaders(token) },
  );
  return res.data as {
    batchId: string;
    pending: number;
    sent: number;
    failed: number;
  };
};

export const retryMessageBatch = async (
  token: string,
  id: string,
  recipientIds?: string[],
) => {
  const res = await axios.post(
    `/hr/message/batch/${id}/retry`,
    { recipientIds },
    { headers: jsonHeaders(token) },
  );
  return res.data as {
    retried: number;
    nowSent: number;
    pending: number;
    sent: number;
    failed: number;
  };
};
