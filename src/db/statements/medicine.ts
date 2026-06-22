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
  lineId?: string,
) => {
  const response = await axios.delete("/medicine/remove", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: { id, userId, lineId },
  });
  return response.data;
};

export const transferMedicineStock = async (
  token: string,
  body: {
    stockId: string;
    departId: string;
    quantity: number;
    userId: string;
  },
) => {
  const response = await axios.patch("/medicine/transfer", body, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  return response.data;
};

export const updateMedicineThreshold = async (
  token: string,
  body: {
    medicineId: string;
    storageId: string;
    threshold: number;
    lineId: string;
    userId: string;
  },
) => {
  const response = await axios.patch("/medicine/threshold", body, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  return response.data;
};

export const updateMedicine = async (
  token: string,
  body: {
    id: string;
    name: string;
    desc?: string | null;
    userId?: string;
    lineId?: string;
  },
) => {
  const response = await axios.patch("/medicine/update", body, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  return response.data;
};

export const medicineOverview = async (token: string, lineId: string) => {
  const response = await axios.get("/medicine/overview", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
    params: {
      lineId,
    },
  });

  if (response.status !== 200) throw new Error(response.data);

  return response.data;
};
