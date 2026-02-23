import axios from "../axios";

export const positionData = async (token: string, id: string) => {
  const response = await axios.get("/position/data", {
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

export const positionUserHistory = async (token: string, id: string) => {
  const response = await axios.get("/position/user/records", {
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

export const positionSalarayGradeHistory = async (
  token: string,
  id: string,
) => {
  const response = await axios.get("/position/user/records", {
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

export const checkPositionInvitation = async (inviteId: string) => {
  const response = await axios.get("/position/check-invitation", {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: {
      id: inviteId,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }

  return response.data;
};

export const positionRecords = async (token: string, id: string) => {
  const response = await axios.get("/position/records", {
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

export const positionApplication = async (
  token: string,
  id: string,
  lastCursor: string,
  limit: string,
) => {
  const response = await axios.get("/position/applications", {
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
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }

  return response.data;
};

export const unitPositionHistory = async (
  token: string,
  id: string,
  lastCursor: string | null,
  limit: string,
) => {
  const response = await axios.get("/position/history", {
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
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }
  return response.data;
};

export const removePosition = async (
  token: string,
  id: string,
  lineId: string,
  userId: string,
) => {
  const response = await axios.delete("/position/remove", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: {
      id,
      lineId,
      userId,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }
  return response.data;
};
