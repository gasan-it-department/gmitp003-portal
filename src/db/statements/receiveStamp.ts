import axios from "../axios";

/**
 * The receiving stamp: the office's own artwork, plus where the date, the
 * name and the signature belong on it.
 *
 * It belongs to the Document Room, not to a person — one rubber stamp sits
 * on the counter and whoever is on duty inks it. Only the name on the BY
 * line and the signature are the individual's; see `myName` below.
 *
 * Placements are basis points of the artwork (0-10000, origin top-left) —
 * the same unit the signature placements use, so what is dragged on screen
 * and what is printed divide by the same number.
 */
export interface ReceiveStampConfig {
  id: string;
  /** The office this stamp belongs to. */
  roomId: string | null;
  /** Who first set it up, and who last changed it. */
  userId: string | null;
  updatedById: string | null;
  lineId: string | null;
  mime: string;
  /** The office's own stamp size, in millimetres. */
  widthMm: number;
  heightMm: number;
  imageW: number;
  imageH: number;
  hasImage?: boolean;
  sigX: number;
  sigY: number;
  sigW: number;
  sigH: number;
  nickname: string;
  nameX: number;
  nameY: number;
  nameSizePt: number;
  dateX: number;
  dateY: number;
  dateSizePt: number;
  timestamp: string;
  updatedAt: string;
}

export interface ReceiveStampState {
  stamp: ReceiveStampConfig | null;
  /** The caller's ACTIVE signature — the one the stamp will carry. */
  signature: { id: string; title: string; hasImage: boolean } | null;
  /** Which office this is, and what the caller is in it. */
  room: { id: string; myType: number };
  rooms: Array<{ id: string; code: string; address: string | null; myType: number }>;
  /**
   * The name on MY line of the shared stamp. Everything else is the
   * office's; this is the half that is mine to set.
   */
  myName: string;
  /** Who else has put their name on this office's stamp. */
  colleagues: Array<{ userId: string; nickname: string; name: string }>;
  /** The caller's own size, or the default they will start from. */
  stampSize: { widthMm: number; heightMm: number };
  defaultSize: { widthMm: number; heightMm: number };
  lineId: string | null;
}

/** Where somebody stamped a document they received. */
export interface ReceiveStampMark {
  id: string;
  page: number;
  xBp: number;
  yBp: number;
  stampedAt: string;
  userId: string;
  /** The office whose stamp this is. */
  roomId: string | null;
  user?: { firstName: string | null; lastName: string | null } | null;
  room?: { code: string } | null;
}

const jsonHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  Accept: "application/json",
  "X-Requested-With": "XMLHttpRequest",
});

export const myReceiveStamp = async (token: string, roomId?: string) => {
  const res = await axios.get("/document/receive-stamp", {
    headers: jsonHeaders(token),
    params: roomId ? { roomId } : undefined,
  });
  return res.data as ReceiveStampState;
};

/** The raw artwork, for the editor canvas. */
export const receiveStampImage = async (token: string, roomId?: string) => {
  const res = await axios.get("/document/receive-stamp/image", {
    headers: { Authorization: `Bearer ${token}`, Accept: "image/png" },
    params: roomId ? { roomId } : undefined,
    responseType: "blob",
  });
  return res.data as Blob;
};

/**
 * Upload the artwork, with the size it represents.
 *
 * The size rides along so "say how big your stamp is, then pick the file"
 * is one action — the server checks the artwork's shape against what was
 * declared, and a mismatch names both numbers.
 */
export const uploadReceiveStampImage = async (
  token: string,
  file: File,
  size?: { widthMm: number; heightMm: number },
  roomId?: string,
) => {
  const form = new FormData();
  if (roomId) form.append("roomId", roomId);
  if (size) {
    form.append("widthMm", String(size.widthMm));
    form.append("heightMm", String(size.heightMm));
  }
  form.append("file", file);
  const res = await axios.post("/document/receive-stamp/image", form, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data as { message: string; stamp: ReceiveStampConfig };
};

/**
 * Save the layout and my name.
 *
 * The placements and the size land on the office's shared stamp; `nickname`
 * lands on my row alone, so a colleague saving theirs a minute later does
 * not rename me.
 */
export const saveReceiveStamp = async (
  token: string,
  body: Partial<Omit<ReceiveStampConfig, "id" | "userId">> & {
    nickname?: string;
    roomId?: string;
  },
) => {
  const res = await axios.patch("/document/receive-stamp", body, {
    headers: jsonHeaders(token),
  });
  return res.data as {
    message: string;
    stamp: ReceiveStampConfig;
    myName: string;
  };
};

/** The finished stamp, composed the same way it will print. */
export const receiveStampPreview = async (
  token: string,
  width = 900,
  roomId?: string,
) => {
  const res = await axios.get("/document/receive-stamp/preview", {
    headers: { Authorization: `Bearer ${token}`, Accept: "image/png" },
    params: roomId ? { width, roomId } : { width },
    responseType: "blob",
  });
  return res.data as Blob;
};

/** Throw away the whole office's stamp. Owner only. */
export const deleteReceiveStamp = async (token: string, roomId?: string) => {
  const res = await axios.delete("/document/receive-stamp", {
    headers: jsonHeaders(token),
    params: roomId ? { roomId } : undefined,
  });
  return res.data as { message: string };
};

// ── Stamping a document you received ──────────────────────────────────

/** Put your stamp on a page, at a point you chose. */
export const applyReceiveStamp = async (
  token: string,
  body: {
    documentId: string;
    page: number;
    xBp: number;
    yBp: number;
    roomId?: string;
  },
) => {
  const res = await axios.post("/document/receive-stamp/apply", body, {
    headers: jsonHeaders(token),
  });
  return res.data as {
    message: string;
    mark: ReceiveStampMark;
    pages: number;
  };
};

/** Every stamp on this document, and which one is mine. */
export const receiveStampMarks = async (token: string, documentId: string) => {
  const res = await axios.get("/document/receive-stamp/marks", {
    headers: jsonHeaders(token),
    params: { documentId },
  });
  return res.data as { marks: ReceiveStampMark[]; mine: ReceiveStampMark | null };
};

export const removeReceiveStampMark = async (
  token: string,
  documentId: string,
) => {
  const res = await axios.delete("/document/receive-stamp/mark", {
    headers: jsonHeaders(token),
    params: { documentId },
  });
  return res.data as { message: string };
};

/**
 * The office's copy: the document as it arrived, with the stamps composed
 * onto it. Generated on demand — the stored file is never rewritten, so any
 * seal over its bytes survives.
 */
export const stampedDocument = async (token: string, documentId: string) => {
  const res = await axios.get("/document/receive-stamp/stamped", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/pdf" },
    params: { documentId },
    responseType: "blob",
  });
  return res.data as Blob;
};
