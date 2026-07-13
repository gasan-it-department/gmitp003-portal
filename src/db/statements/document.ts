import axios from "../axios";

export const newRoom = async (token: string, userId: string) => {
  const response = await axios.post(
    "/document/add-room",
    {
      userId,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    },
  );

  if (response.status !== 201) {
    throw new Error(response.data);
  }
  return response.data;
};

export const signatoryList = async (
  token: string,
  id: string | undefined,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const resposne = await axios.get("/document/signatories", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: {
      id,
      lastCursor,
      limit,
      query,
    },
  });

  if (resposne.status !== 200) {
    throw new Error(resposne.data.message);
  }
  return resposne.data;
};

export const signatoryRegistry = async (token: string, userId: string) => {
  const response = await axios.get("/document/signatory-registry", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: {
      userId,
    },
  });
  if (response.status !== 200) {
    throw new Error(response.data);
  }
  return response.data;
};

export const checkDocumentRoom = async (token: string, userId: string) => {
  const response = await axios.get("/document/check-room", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: {
      userId,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }
  return response.data;
};

export const roomDocumentRequest = async (
  token: string,
  id: string | undefined,
  lastCursor: string | null,
  limit: string,
  query: string,
  status: string,
) => {
  const response = await axios.get("/document/room-request", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: {
      id,
      lastCursor,
      limit,
      query,
      status,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }
  return response.data;
};

export const upadateRequestStatus = async (
  token: string,
  id: string,
  lineId: string,
  userId: string,
  status: number,
) => {
  const response = await axios.patch(
    "/document/update/status",
    {
      id,
      lineId,
      userId,
      status,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    },
  );

  if (response.status !== 200) {
    throw new Error(response.data);
  }
  return response.data;
};

export const deleteDocumentRoomRequest = async (
  token: string,
  id: string,
  userId: string,
  lineId: string,
) => {
  const response = await axios.delete("/document/request/delete", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: {
      id,
      userId,
      lineId,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }

  return response.data;
};

export const documentRoomRequestDetails = async (token: string, id: string) => {
  const response = await axios.get("/document/details", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: {
      id,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }

  return response.data;
};

export const documents = async (
  token: string,
  id: string | undefined,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/document/archives", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: {
      id,
      lastCursor,
      limit,
      query,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }
  return response.data;
};

export const rooms = async (
  token: string,
  id: string | undefined,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/document/rooms", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: {
      id,
      lastCursor,
      limit,
      query,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }
  return response.data;
};

export const room = async (token: string, id: string) => {
  const response = await axios.get("/document/room", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: {
      id,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }

  return response.data;
};

export const removeRoom = async (
  token: string,
  id: string,
  userId: string,
  lineId: string,
) => {
  const response = await axios.delete("/document/room/remove", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: {
      id,
      userId,
      lineId,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data.message);
  }

  return response.data;
};

export const updateRoomStatus = async (
  token: string,
  id: string,
  userId: string,
  status: number,
) => {
  const response = await axios.patch(
    "/document/room/update-status",
    {
      id,
      userId,
      status,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    },
  );

  if (response.status !== 200) {
    throw new Error(response.data.message);
  }

  return response.data;
};

export const userSignatures = async (
  token: string,
  id: string | undefined,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/document/user/signature", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: {
      id,
      lastCursor,
      limit,
      query,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }
  return response.data;
};

export const archiveDetail = async (token: string, id: string) => {
  const response = await axios.get("/document/archive/datail", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: {
      id,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }

  return response.data;
};

export const removeArchiveDocument = async (
  token: string,
  id: string,
  userId: string,
  lineId: string,
) => {
  const response = await axios.delete("/document/archive/remove", {
    params: { id, userId, lineId },
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }

  return response.data;
};

export const searchArchiveDocument = async (
  token: string,
  id: string | undefined,
  lastCursor: string | null,
  limit: string,
  query: string,
  lineId: string,
  onDeepSearch: boolean,
  threshold?: number,
) => {
  const url = onDeepSearch
    ? "/document/archive/search/ai"
    : "/document/archive/search";

  // The AI endpoint paginates via `offset`; the keyword endpoint via `lastCursor`.
  // We use the same `lastCursor` token from React Query in both cases — the AI
  // route treats it as a numeric offset, the keyword route as a row ID cursor.
  const params: Record<string, any> = {
    id,
    lastCursor,
    limit,
    query,
    lineId,
  };
  if (onDeepSearch) {
    params.offset = lastCursor ?? 0;
    if (typeof threshold === "number") params.threshold = threshold;
  }

  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params,
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }

  return response.data;
};

export const documentRoute = async (token: string, id: string) => {
  console.log({ id });

  const response = await axios.get("/document/route/info", {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      Authorization: `Bearer ${token}`,
    },
    params: {
      id,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }
  return response.data;
};

export interface UserSignatureItem {
  id: string;
  title: string;
  active: boolean;
  default: boolean;
  forRenew?: string | null;
  timestamp: string;
  roomAuthorizedUserId?: string | null;
  /** When true, downloaded signed PDFs stamp a verification QR beside
   *  any box that used THIS signature. Per-signature, opt-in. */
  qrEnabled: boolean;
  /** base64 data URL ready for `<img src>` */
  preview: string | null;
  size: number;
}

export const usersSignature = async (
  token: string,
  id: string | undefined,
  lastCursor: string | null,
  limit: string,
  query: string,
): Promise<{
  list: UserSignatureItem[];
  lastCursor: string | null;
  hasMore: boolean;
}> => {
  const response = await axios.get("/document/user/signatures", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: { id, lastCursor, limit, query },
  });
  return response.data;
};

export const uploadUserSignature = async (
  token: string,
  userId: string,
  file: File,
  title: string,
  active: boolean,
) => {
  const form = new FormData();
  form.append("userId", userId);
  form.append("title", title);
  form.append("active", String(active));
  form.append("file", file);

  const response = await axios.post(
    "/document/user/signatures/upload",
    form,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
        "X-Requested-With": "XMLHttpRequest",
      },
    },
  );
  return response.data;
};

export const activateUserSignature = async (
  token: string,
  id: string,
  userId: string,
) => {
  const response = await axios.patch(
    "/document/user/signatures/activate",
    { id, userId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    },
  );
  return response.data;
};

export const deleteUserSignature = async (
  token: string,
  id: string,
  userId: string,
) => {
  const response = await axios.delete(
    "/document/user/signatures/remove",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      params: { id, userId },
    },
  );
  return response.data;
};

// ── Dissemination ─────────────────────────────────────────────────────

export interface TargetRoomCandidate {
  id: string;
  code: string;
  address?: string | null;
  status: number;
  _count?: { authorizedUser: number };
}

export interface SignatoryCandidate {
  id: string;
  type: number;
  user?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    Position?: { name?: string | null } | null;
  } | null;
  receivingRoom?: {
    id: string;
    code: string;
    address?: string | null;
  } | null;
}

const jsonHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  Accept: "application/json",
  "X-Requested-With": "XMLHttpRequest",
});

export const disseminationOutbox = async (
  token: string,
  fromRoomId: string,
  lastCursor: string | null,
  limit: string,
  query: string,
  status: string,
) => {
  const res = await axios.get("/document/dissemination/outbox", {
    headers: jsonHeaders(token),
    params: {
      fromRoomId,
      limit,
      query,
      status,
      ...(lastCursor ? { lastCursor } : {}),
    },
  });
  return res.data as {
    list: any[];
    lastCursor: string | null;
    hasMore: boolean;
  };
};

export const disseminationInbox = async (
  token: string,
  toRoomId: string,
  lastCursor: string | null,
  limit: string,
) => {
  const res = await axios.get("/document/dissemination/inbox", {
    headers: jsonHeaders(token),
    params: {
      toRoomId,
      limit,
      ...(lastCursor ? { lastCursor } : {}),
    },
  });
  return res.data as {
    list: any[];
    lastCursor: string | null;
    hasMore: boolean;
  };
};

export const disseminationDetail = async (token: string, id: string) => {
  const res = await axios.get("/document/dissemination/detail", {
    headers: jsonHeaders(token),
    params: { id },
  });
  return res.data;
};

export const setDisseminationTargets = async (
  token: string,
  body: {
    queueRoomId: string;
    targetRoomIds: string[];
    userId: string;
    lineId: string;
  },
) => {
  const res = await axios.post(
    "/document/dissemination/targets/set",
    body,
    { headers: jsonHeaders(token) },
  );
  return res.data;
};

export const setDisseminationSignatories = async (
  token: string,
  body: {
    queueRoomId: string;
    signatories: { roomAuthorizedUserId: string }[];
    userId: string;
    lineId: string;
  },
) => {
  const res = await axios.post(
    "/document/dissemination/signatories/set",
    body,
    { headers: jsonHeaders(token) },
  );
  return res.data;
};

export const finalizeDissemination = async (
  token: string,
  body: { queueRoomId: string; userId: string; lineId: string },
) => {
  const res = await axios.patch(
    "/document/dissemination/finalize",
    body,
    { headers: jsonHeaders(token) },
  );
  return res.data;
};

export const removeDissemination = async (
  token: string,
  id: string,
  userId: string,
  lineId: string,
) => {
  const res = await axios.delete("/document/dissemination/remove", {
    headers: jsonHeaders(token),
    params: { id, userId, lineId },
  });
  return res.data;
};

export const targetRoomCandidates = async (
  token: string,
  lineId: string,
  excludeRoomId: string | undefined,
  query: string,
) => {
  const res = await axios.get("/document/dissemination/target-rooms", {
    headers: jsonHeaders(token),
    params: { lineId, excludeRoomId, query, limit: "100" },
  });
  return res.data as { list: TargetRoomCandidate[] };
};

export const signatoryCandidates = async (
  token: string,
  lineId: string,
  query: string,
) => {
  const res = await axios.get("/document/dissemination/signatories", {
    headers: jsonHeaders(token),
    params: { lineId, query, limit: "100" },
  });
  return res.data as { list: SignatoryCandidate[] };
};

// ── Placement editor ──────────────────────────────────────────────────

export interface PlacementSignatory {
  id: string;
  index: number;
  status: number;
}

export interface PlacementCoor {
  id: string;
  xAxis: number;
  yAxis: number;
  width: number;
  height: number;
  signatoryArrangementId: string | null;
}

export interface PlacementPage {
  id: string;
  page: number;
  signCoor: PlacementCoor[];
}

export interface PlacementDocument {
  id: string;
  title: string | null;
  size: number;
  timestamp: string;
  file: { fileName: string; fileType: string; fileSize: string } | null;
  pages: PlacementPage[];
}

export const disseminationDocuments = async (
  token: string,
  queueRoomId: string,
) => {
  const res = await axios.get("/document/dissemination/documents", {
    headers: jsonHeaders(token),
    params: { queueRoomId },
  });
  return res.data as {
    documents: PlacementDocument[];
    signatories: PlacementSignatory[];
  };
};

export const fetchDocumentFile = async (token: string, id: string) => {
  const res = await axios.get("/document/dissemination/file", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/octet-stream",
    },
    params: { id },
    responseType: "blob",
  });
  return res.data as Blob;
};

export const saveSignaturePlacements = async (
  token: string,
  body: {
    queueRoomId: string;
    documentId: string;
    userId: string;
    lineId: string;
    placements: Array<{
      page: number;
      slotIndex: number; // 1-based ordinal of the signatory slot
      xAxis: number;
      yAxis: number;
      width: number;
      height: number;
    }>;
  },
) => {
  const res = await axios.post(
    "/document/dissemination/placements/save",
    body,
    { headers: jsonHeaders(token) },
  );
  return res.data;
};

export const uploadDisseminationDocument = async (
  token: string,
  body: {
    queueRoomId: string;
    userId: string;
    lineId: string;
    file: File;
    title?: string;
  },
) => {
  const fd = new FormData();
  fd.append("queueRoomId", body.queueRoomId);
  fd.append("userId", body.userId);
  fd.append("lineId", body.lineId);
  if (body.title) fd.append("title", body.title);
  fd.append("file", body.file);
  const res = await axios.post(
    "/document/dissemination/documents/upload",
    fd,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  );
  return res.data;
};

export const removeDisseminationDocument = async (
  token: string,
  body: {
    id: string;
    queueRoomId: string;
    userId: string;
    lineId: string;
  },
) => {
  const res = await axios.delete(
    "/document/dissemination/documents/remove",
    {
      headers: jsonHeaders(token),
      params: body,
    },
  );
  return res.data;
};

export const repairRoomMembership = async (
  token: string,
  userId: string,
) => {
  const res = await axios.post(
    "/document/room/repair-membership",
    { userId },
    { headers: jsonHeaders(token) },
  );
  return res.data as {
    action: "noop" | "repaired";
    room: { id: string; code: string };
    inserted?: number;
  };
};

// ─── Document module overview ─────────────────────────────────────────
export interface DocumentOverview {
  archive: { total: number };
  dissemination: { draft: number; active: number; completed: number };
  myRoom: { id: string | null; inbox: number; outbox: number };
  signatures: { mine: number; pendingForMe: number };
}

export const documentOverview = async (
  token: string,
  lineId: string,
  userId?: string,
) => {
  const res = await axios.get("/document/overview", {
    headers: jsonHeaders(token),
    params: { lineId, userId },
  });
  return res.data as DocumentOverview;
};

export const resetRoomMembership = async (token: string, userId: string) => {
  const res = await axios.post(
    "/document/room/reset-membership",
    { userId },
    { headers: jsonHeaders(token) },
  );
  return res.data as {
    message: string;
    room: { id: string; code: string };
  };
};

// ─── View / sign endpoints ────────────────────────────────────────────
export interface SigningSignatoryArrangement {
  id: string;
  index: number;
  status: number; // 0 pending · 1 signed · 2 rejected
  signedAt: string | null;
  userId: string | null;
  user?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    Position?: { name?: string | null } | null;
  } | null;
}

export interface SigningDocument {
  id: string;
  title: string | null;
  size: number;
  timestamp: string;
  file: { fileName: string; fileType: string } | null;
  pages: Array<{
    id: string;
    page: number;
    signCoor: Array<{
      id: string;
      xAxis: number;
      yAxis: number;
      width: number;
      height: number;
      signatoryArrangementId: string | null;
    }>;
  }>;
}

export interface DisseminationView {
  queue: {
    id: string;
    title: string | null;
    status: number;
    step: number;
    timestamp: string;
    fromRoom: { id: string; code: string; address: string | null } | null;
    targetRooms: Array<{
      id: string;
      status: number;
      receivedAt: string | null;
      roomReceiver: { id: string; code: string } | null;
    }>;
    documents: SigningDocument[];
    signatotyArrangement: SigningSignatoryArrangement[];
    user: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      Position?: { name?: string | null } | null;
    } | null;
  };
  signaturesByUser: Record<
    string,
    { id: string; title: string | null; mime: string; dataUrl: string }
  >;
}

export const viewDissemination = async (token: string, id: string) => {
  const res = await axios.get("/document/dissemination/view", {
    headers: jsonHeaders(token),
    params: { id },
  });
  return res.data as DisseminationView;
};

export const signMine = async (
  token: string,
  body: {
    queueRoomId: string;
    userId: string;
    geo?: { lat: number; lng: number; accuracy?: number | null } | null;
  },
) => {
  const res = await axios.post("/document/dissemination/sign-mine", body, {
    headers: jsonHeaders(token),
  });
  return res.data as { message: string; signed: number; completed: boolean };
};

export const claimSignatorySlot = async (
  token: string,
  body: { arrangementId: string; userId: string },
) => {
  const res = await axios.post("/document/dissemination/claim-slot", body, {
    headers: jsonHeaders(token),
  });
  return res.data;
};

export const archiveDissemination = async (
  token: string,
  body: { queueRoomId: string; userId: string },
) => {
  const res = await axios.post("/document/dissemination/archive", body, {
    headers: jsonHeaders(token),
  });
  return res.data as { message: string; created: number; skipped: number };
};

export const fetchSignedDocument = async (token: string, documentId: string) => {
  const res = await axios.get("/document/dissemination/signed-document", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/pdf" },
    params: { documentId },
    responseType: "blob",
  });
  return res.data as Blob;
};

// ─── Self-Sign ─────────────────────────────────────────────────────────
export interface SelfSignListRow {
  id: string;
  title: string | null;
  size: number;
  timestamp: string;
  file: { fileName: string; fileType: string } | null;
  arrangement: { id: string; status: number; signedAt: string | null } | null;
  boxCount: number;
  archived: boolean;
}

export interface SelfSignDetail {
  document: {
    id: string;
    title: string | null;
    timestamp: string;
    file: { fileName: string; fileType: string } | null;
    pages: Array<{
      id: string;
      page: number;
      signCoor: Array<{
        id: string;
        xAxis: number;
        yAxis: number;
        width: number;
        height: number;
        signatoryArrangementId: string | null;
      }>;
    }>;
  };
  arrangement: { id: string; status: number; signedAt: string | null } | null;
  signatureDataUrl: string | null;
}

export const uploadSelfSignDoc = async (
  token: string,
  body: { userId: string; lineId: string; file: File; title?: string },
) => {
  const fd = new FormData();
  fd.append("userId", body.userId);
  fd.append("lineId", body.lineId);
  if (body.title) fd.append("title", body.title);
  fd.append("file", body.file);
  const res = await axios.post("/document/self-sign/upload", fd, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  return res.data as {
    message: string;
    document: { id: string; title: string | null; timestamp: string };
    arrangementId: string;
  };
};

export const saveSelfSignPlacements = async (
  token: string,
  body: {
    documentId: string;
    arrangementId: string;
    userId: string;
    placements: Array<{
      page: number;
      xAxis: number;
      yAxis: number;
      width: number;
      height: number;
    }>;
  },
) => {
  const res = await axios.post(
    "/document/self-sign/save-placements",
    body,
    { headers: jsonHeaders(token) },
  );
  return res.data;
};

export const signSelfSignAll = async (
  token: string,
  body: {
    arrangementId: string;
    userId: string;
    /** Explicit signature to stamp; omit to use the active one. */
    signatureId?: string | null;
    geo?: { lat: number; lng: number; accuracy?: number | null } | null;
  },
) => {
  const res = await axios.post("/document/self-sign/sign", body, {
    headers: jsonHeaders(token),
  });
  return res.data as {
    message: string;
    boxes: number;
    signedAt: string;
  };
};

/** Undo a self-sign: reverts the arrangement to unsigned (status 0). */
export const unsignSelfSign = async (
  token: string,
  body: { arrangementId: string; userId: string },
) => {
  const res = await axios.post("/document/self-sign/unsign", body, {
    headers: jsonHeaders(token),
  });
  return res.data as { message: string };
};

export const listSelfSignDocs = async (
  token: string,
  params: {
    userId: string;
    lineId: string;
    lastCursor?: string | null;
    limit?: string;
  },
) => {
  const res = await axios.get("/document/self-sign/list", {
    headers: jsonHeaders(token),
    params: {
      ...params,
      ...(params.lastCursor ? { lastCursor: params.lastCursor } : {}),
    },
  });
  return res.data as {
    list: SelfSignListRow[];
    lastCursor: string | null;
    hasMore: boolean;
  };
};

export const getSelfSignDetail = async (
  token: string,
  id: string,
  userId: string,
) => {
  const res = await axios.get("/document/self-sign/detail", {
    headers: jsonHeaders(token),
    params: { id, userId },
  });
  return res.data as SelfSignDetail;
};

export const archiveSelfSignDoc = async (
  token: string,
  body: { documentId: string; userId: string },
) => {
  const res = await axios.post("/document/self-sign/archive", body, {
    headers: jsonHeaders(token),
  });
  return res.data as {
    message: string;
    existed: boolean;
    archiveId: string;
  };
};

export const removeSelfSignDoc = async (
  token: string,
  id: string,
  userId: string,
) => {
  const res = await axios.delete("/document/self-sign/remove", {
    headers: jsonHeaders(token),
    params: { id, userId },
  });
  return res.data;
};

export const cancelDispatchedDissemination = async (
  token: string,
  body: { queueRoomId: string; userId: string; reason?: string },
) => {
  const res = await axios.patch("/document/dissemination/cancel", body, {
    headers: jsonHeaders(token),
  });
  return res.data as { message: string; recipientsNotified: number };
};

// Per-signature QR toggle — flips qrEnabled on a single Signature row.
export const setSignatureQr = async (
  token: string,
  body: { id: string; userId: string; qrEnabled: boolean },
) => {
  const res = await axios.patch("/document/user/signatures/qr", body, {
    headers: jsonHeaders(token),
  });
  return res.data as { message: string; id: string; qrEnabled: boolean };
};

// ── Document Receiving (barcode-stickered physical documents) ────────────

export interface DocumentReceiveRecord {
  id: string;
  lineId: string;
  barcode: string;
  title: string;
  senderUnitId: string | null;
  senderUnitName: string | null;
  senderName: string | null;
  receivedById: string | null;
  receivedByName: string | null;
  direction: "in" | "out";
  pages?: { id: string; page: number }[];
  createdAt: string;
  updatedAt: string;
}

export const documentReceiveList = async (
  token: string,
  lineId: string,
  cursor: string | null,
  limit: string,
  query: string,
) => {
  const res = await axios.get("/document/receive/list", {
    headers: jsonHeaders(token),
    params: { lineId, cursor: cursor ?? undefined, limit, query },
  });
  return res.data as {
    list: DocumentReceiveRecord[];
    hasMore: boolean;
    lastCursor: string | null;
  };
};

export const documentReceiveCreate = async (
  token: string,
  body: {
    lineId: string;
    barcode: string;
    title: string;
    senderUnitId?: string | null;
    senderUnitName?: string | null;
    senderName?: string | null;
    direction?: "in" | "out";
    userId?: string | null;
  },
) => {
  const res = await axios.post("/document/receive", body, {
    headers: jsonHeaders(token),
  });
  return res.data as { record: DocumentReceiveRecord; existing: boolean };
};
