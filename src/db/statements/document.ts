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
