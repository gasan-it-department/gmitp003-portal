import axios from "../axios";

/**
 * Super-admin: mint a real line session for the target line so the admin can
 * manage that line's HR (the whole existing HR module, scoped to the line).
 */
export const openLineHrSession = async (token: string, lineId: string) => {
  const response = await axios.post(
    `/admin/line/${lineId}/hr-session`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    },
  );
  return response.data as {
    token: string;
    /** The User behind the minted account — the session is keyed on this, and
     *  it's what the HR screens stamp on their audit rows (a User FK). */
    userId: string;
    accountId: string;
    lineId: string;
    lineName: string;
  };
};

export const getAllLines = async (
  token: string,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const resposne = await axios.get("/line/list", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: {
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

export const searchLineUser = async (
  token: string,
  id: string,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/users/search", {
    params: {
      lastCursor,
      limit,
      query,
      id,
    },
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
  if (response.status !== 200) {
    throw new Error("Fetched failed");
  }
  return response.data;
};

export const updateLineStatus = async (
  token: string,
  id: string,
  status: number,
  userId: string,
) => {
  const response = await axios.patch(
    "/line/update/status",
    {
      id,
      status,
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

  if (response.status !== 200) {
    throw new Error(response.data);
  }
  return response.data;
};

export const deleteLine = async (token: string, id: string, userId: string) => {
  const response = await axios.delete("/line/delete", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
    params: {
      id,
      userId,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }
  return response.data;
};

export const checkLineInvitation = async (lineInvitationId: string) => {
  const response = await axios.get("/line/invitation", {
    params: {
      lineInvitationId: lineInvitationId,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }
  return response.data;
};

export const lineData = async (
  token: string | undefined,
  id: string | undefined,
) => {
  if (!token || !id) {
    throw new Error("INVALID REQUIRED ID");
  }
  const response = await axios.get("/line/data", {
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
    throw new Error(response.data.message);
  }

  return response.data;
};
