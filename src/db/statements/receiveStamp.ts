import axios from "../axios";

/**
 * The receiving stamp: the office's own artwork, plus where the date, the
 * name and the signature belong on it.
 *
 * Placements are basis points of the artwork (0-10000, origin top-left) —
 * the same unit the signature placements use, so what is dragged on screen
 * and what is printed divide by the same number.
 */
export interface ReceiveStampConfig {
  id: string;
  userId: string;
  lineId: string | null;
  mime: string;
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
  stampSize: { widthMm: number; heightMm: number };
  lineId: string | null;
}

const jsonHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  Accept: "application/json",
  "X-Requested-With": "XMLHttpRequest",
});

export const myReceiveStamp = async (token: string) => {
  const res = await axios.get("/document/receive-stamp", {
    headers: jsonHeaders(token),
  });
  return res.data as ReceiveStampState;
};

/** The raw artwork, for the editor canvas. */
export const receiveStampImage = async (token: string) => {
  const res = await axios.get("/document/receive-stamp/image", {
    headers: { Authorization: `Bearer ${token}`, Accept: "image/png" },
    responseType: "blob",
  });
  return res.data as Blob;
};

export const uploadReceiveStampImage = async (token: string, file: File) => {
  const form = new FormData();
  form.append("file", file);
  const res = await axios.post("/document/receive-stamp/image", form, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data as { message: string; stamp: ReceiveStampConfig };
};

export const saveReceiveStamp = async (
  token: string,
  body: Partial<Omit<ReceiveStampConfig, "id" | "userId">>,
) => {
  const res = await axios.patch("/document/receive-stamp", body, {
    headers: jsonHeaders(token),
  });
  return res.data as { message: string; stamp: ReceiveStampConfig };
};

/** The finished stamp, composed the same way it will print. */
export const receiveStampPreview = async (token: string, width = 900) => {
  const res = await axios.get("/document/receive-stamp/preview", {
    headers: { Authorization: `Bearer ${token}`, Accept: "image/png" },
    params: { width },
    responseType: "blob",
  });
  return res.data as Blob;
};

export const deleteReceiveStamp = async (token: string) => {
  const res = await axios.delete("/document/receive-stamp", {
    headers: jsonHeaders(token),
  });
  return res.data as { message: string };
};
