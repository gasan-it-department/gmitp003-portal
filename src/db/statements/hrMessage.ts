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

export interface RecipientRow {
  id: string;
  name: string;
  status: string;
  plantilla: boolean;
  position: string | null;
  office: string | null;
  to: string;
  sendable: boolean;
  reason: string | null;
}

export interface MessageBatchRow {
  id: string;
  channel: MessageChannel;
  subject: string | null;
  body: string;
  audience: Audience;
  total: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  createdByName?: string | null;
}

export interface BatchRecipientRow {
  id: string;
  userId: string;
  name: string;
  toAddress: string;
  renderedBody: string;
  status: "pending" | "sent" | "failed";
  error: string | null;
  attempts: number;
  sentAt: string | null;
}

// ─── Placeholders ──────────────────────────────────────────────────
export const messagePlaceholders = async (token: string) => {
  const res = await axios.get("/hr/message/placeholders", {
    headers: jsonHeaders(token),
  });
  return res.data as { placeholders: MessagePlaceholder[] };
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

// ─── Recipients ────────────────────────────────────────────────────
export const searchMessageRecipients = async (
  token: string,
  params: { audience?: Audience; query?: string; channel?: MessageChannel },
) => {
  const res = await axios.get("/hr/message/recipients", {
    headers: jsonHeaders(token),
    params,
  });
  return res.data as { recipients: RecipientRow[]; max: number };
};

// ─── Send / retry ──────────────────────────────────────────────────
export const sendMessageBatch = async (
  token: string,
  body: {
    templateId?: string;
    channel: MessageChannel;
    subject?: string;
    body: string;
    audience?: Audience;
    userIds: string[];
  },
) => {
  const res = await axios.post("/hr/message/send", body, {
    headers: jsonHeaders(token),
  });
  return res.data as {
    batchId: string;
    total: number;
    sent: number;
    failed: number;
  };
};

export const retryMessageBatch = async (
  token: string,
  body: { batchId: string; recipientIds?: string[] },
) => {
  const res = await axios.post("/hr/message/retry", body, {
    headers: jsonHeaders(token),
  });
  return res.data as {
    retried: number;
    nowSent: number;
    sent: number;
    failed: number;
  };
};

// ─── History ───────────────────────────────────────────────────────
export const listMessageBatches = async (token: string, page = 0) => {
  const res = await axios.get("/hr/message/batches", {
    headers: jsonHeaders(token),
    params: { page },
  });
  return res.data as {
    batches: MessageBatchRow[];
    total: number;
    page: number;
    pages: number;
  };
};

export const messageBatchDetail = async (token: string, id: string) => {
  const res = await axios.get(`/hr/message/batch/${id}`, {
    headers: jsonHeaders(token),
  });
  return res.data as {
    batch: MessageBatchRow;
    recipients: BatchRecipientRow[];
  };
};

// ─── Live preview ──────────────────────────────────────────────────
export const previewMessageFor = async (
  token: string,
  body: { body: string; userId: string },
) => {
  const res = await axios.post("/hr/message/preview", body, {
    headers: jsonHeaders(token),
  });
  return res.data as { rendered: string; unresolved: string[] };
};
