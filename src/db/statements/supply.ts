import axios from "../axios";

export const inventoryTimebaseReportExport = async (
  token: string,
  id: string,
  year?: string | number,
  quarter?: string | number,
) => {
  const response = await axios.get(
    "/supply/inventory/timebase/report/export",
    {
      responseType: "blob",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
      params: {
        id,
        year: year === "" || year === undefined ? undefined : year,
        quarter:
          quarter === "" || quarter === undefined ? undefined : quarter,
      },
    },
  );
  if (response.status !== 200) throw new Error("Failed to export report");

  // Pull suggested filename from Content-Disposition if present
  const cd: string = response.headers["content-disposition"] ?? "";
  const match = /filename="?([^"]+)"?/.exec(cd);
  const filename =
    match?.[1] ??
    `SUPPLIES_${year ?? new Date().getFullYear()}${quarter ? `_Q${quarter}` : ""}.xlsx`;

  return { blob: response.data as Blob, filename };
};

export const inventoryTimebaseReport = async (
  token: string,
  id: string,
  lastCursor: string | null,
  limit: string,
  year?: string | number,
  quarter?: string | number,
) => {
  const response = await axios.get("/supply/inventory/timebase/report", {
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
      year: year === "" || year === undefined ? undefined : year,
      quarter:
        quarter === "" || quarter === undefined ? undefined : quarter,
    },
  });
  if (response.status !== 200) throw new Error(response.data.message);
  return response.data;
};

export const supplyDispenseTransaction = async (
  token: string,
  id: string | undefined,
  lastCursor: string | null,
  limit: string,
  query: string,
  dateFrom?: string,
  dateTo?: string,
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
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    },
  });
  if (response.status !== 200) throw new Error(response.data.message);
  return response.data;
};

export const removeStock = async (
  token: string,
  id: string,
  userId: string,
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
  token: string,
) => {
  if (!id) {
    throw new Error("INVALID ID");
  }
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
  id: string,
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
  query: string,
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
  query: string,
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
export const inventroyReport = async (
  token: string,
  id: string | undefined,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/supply/inventory/report", {
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
