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
) => {
  const url = onDeepSearch
    ? "/document/archive/search/ai"
    : "/document/archive/search";
  const response = await axios.get(url, {
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
      lineId,
    },
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

export const usersSignature = async (
  token: string,
  id: string | undefined,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/document/user/signatures", {
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
    throw new Error(response.data.message);
  }

  return response.data;
};
