import axios from "../axios";

export const getAllLines = async (
  token: string,
  lastCursor: string | null,
  limit: string,
  query: string
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
  query: string
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
