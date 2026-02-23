import axios from "../axios";

export const searchUnits = async (
  token: string,
  id: string,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/unit/search", {
    params: {
      query,
      lastCursor,
      limit,
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
    throw new Error(`${response.data.message}`);
  }
  return response.data;
};

export const unitInfo = async (token: string, id: string) => {
  const response = await axios.get("/unit-info", {
    params: { id },
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }

  return response.data;
};

export const deleteUnit = async (
  token: string,
  id: string,
  userId: string,
  lineId: string,
) => {
  const response = await axios.delete("/unit/delete", {
    params: { id, userId, lineId },
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }

  return response.data;
};
