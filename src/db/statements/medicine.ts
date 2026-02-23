import axios from "../axios";

export const medicineTransactions = async (
  token: string,
  id: string,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/medicine/transactions", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
    params: {
      lastCursor,
      limit,
      query,
      id,
    },
  });

  if (response.status !== 200) throw new Error(response.data);

  return response.data;
};

export const removeMedicine = async (
  token: string,
  id: string,
  userId: string,
) => {
  const response = await axios.delete("/medicine/remove", {
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

  if (response.status !== 200) throw new Error(response.data);

  return response.data;
};
