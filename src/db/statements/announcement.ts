import axios from "../axios";

export const announcements = async (
  token: string,
  listId: string,
  lastCursor: string | null,
  limit: string,
  query?: string,
) => {
  const response = await axios.get("/announcement/list", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: {
      id: listId,
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

export const announcementData = async (
  token: string,
  id: string,
  userId: string,
) => {
  const response = await axios.get("/announcement/data", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: {
      id,
      userId,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data.message);
  }
  return response.data;
};

export const announcementStatusUpdate = async (
  token: string,
  id: string,
  userId: string,
  status: number,
  lineId: string,
) => {
  const response = await axios.patch(
    "/announcement/status/update",
    {
      id,
      userId,
      status,
      lineId,
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
  return response.status;
};

export const viewAnnouncement = async (
  token: string,
  id: string,
  userId: string,
) => {
  const response = await axios.patch(
    "/announcement/view-announcement",
    {
      id,
      userId,
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

export const toogleReaction = async (
  token: string,
  id: string,
  userId: string,
  status?: boolean,
) => {
  const response = await axios.patch(
    "/announcement/toogle-react",
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
    throw new Error(response.data);
  }
  return response.data;
};

export const removeAnnouncement = async (
  token: string,
  id: string,
  lineId: string,
  userId: string,
) => {
  const response = await axios.delete("/announcement/delete", {
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
