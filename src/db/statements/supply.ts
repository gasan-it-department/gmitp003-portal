import axios from "../axios";

export const supplyDispenseTransaction = async (
  token: string,
  id: string | undefined,
  lastCursor: string | null,
  limit: string,
  query: string
) => {
  const response = await axios.get("/supply/dispense/transactions", {
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
  if (response.status !== 200) throw new Error(response.data.message);
  return response.data;
};

export const removeStock = async (
  token: string,
  id: string,
  userId: string
) => {
  const response = await axios.delete("/storage/medicine/remove", {
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

  if (response.status !== 200) throw new Error(response.data.message);
  return response.data;
};
export const removeStockInlist = async (
  id: string,
  userId: string,
  lineId: string,
  listId: string,
  containerId: string,
  token: string
) => {
  const response = await axios.delete("/supply/delete-item", {
    params: {
      id,
      userId,
      lineId,
      listId,
      inventoryId: containerId,
    },
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (response.status !== 200) throw new Error(response.data.message);
  return response.data;
};

export const supplyDispenseTransactionInfo = async (
  token: string,
  id: string
) => {
  const response = await axios.get("/supply/dispense/transaction/info", {
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
  if (response.status !== 200) throw new Error(response.data.message);
  return response.data;
};

export const supplyUserDispenseRecord = async (
  token: string,
  id: string | undefined,
  lastCursor: string | null,
  limit: string,
  query: string
) => {
  const response = await axios.get("/supply/user/dispense/record", {
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
  if (response.status !== 200) throw new Error(response.data.message);
  return response.data;
};

export const supplyUnitDispenseRecord = async (
  token: string,
  id: string | undefined,
  lastCursor: string | null,
  limit: string,
  query: string
) => {
  const response = await axios.get("/supply/unit/dispense/record", {
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
  if (response.status !== 200) throw new Error(response.data.message);
  return response.data;
};

export const supplyData = async (token: string, id: string) => {
  const response = await axios.get("/supply/record", {
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

// export const
