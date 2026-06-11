import axios from "../axios";

export interface ExpirationItem {
  id: string;
  actualStock: number;
  quantity: number;
  quality: string;
  perQuantity: number;
  expiration: string | null;
  manufacturingDate: string | null;
  daysToExpire: number | null;
  addressRoom?: string | null;
  addressSec?: string | null;
  addressRow?: string | null;
  addressCol?: string | null;
  container?: string | null;
  medicine?: { id: string; name: string; serialNumber: string } | null;
  MedicineStorage?: { id: string; name: string; refNumber: string } | null;
}

export interface ExpirationSummary {
  totalBatches: number;
  totalUnits: number;
  byQuality: { quality: string; batches: number; units: number }[];
}

export const expirationList = async (
  token: string,
  lineId: string,
  mode: "soon" | "expired",
  lastCursor: string | null,
  limit: string,
  query: string,
): Promise<{
  list: ExpirationItem[];
  lastCursor: string | null;
  hasMore: boolean;
  mode: "soon" | "expired";
  summary?: ExpirationSummary;
}> => {
  const response = await axios.get("/medicine/expiration", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: { lineId, mode, lastCursor, limit, query },
  });
  return response.data;
};

export const exportExpirationList = async (
  token: string,
  lineId: string,
  mode: "soon" | "expired",
  query: string,
): Promise<{ blob: Blob; filename: string }> => {
  const response = await axios.get("/medicine/expiration/export", {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Requested-With": "XMLHttpRequest",
    },
    responseType: "blob",
    params: { lineId, mode, query },
  });
  const blob = new Blob([response.data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const cd = response.headers["content-disposition"];
  let filename = `medicines_${mode}.xlsx`;
  if (cd) {
    const m = cd.match(/filename="(.+)"/);
    if (m?.[1]) filename = m[1];
  }
  return { blob, filename };
};

export const scanLowStock = async (
  token: string,
  lineId: string,
): Promise<{
  message: "OK";
  totalStocks: number;
  belowThreshold: number;
  scanned: number;
  notified: number;
}> => {
  const response = await axios.post(
    "/medicine/scan-low-stock",
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      params: { lineId },
    },
  );
  return response.data;
};

export const storageData = async (token: string, id: string) => {
  const response = await axios.get("/storage/data", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "Cache-Control": "no-cache, no-store, must-revalidate",
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

export const removeStorage = async (
  token: string,
  id: string,
  userId: string,
  lineId: string,
) => {
  const response = await axios.delete("/storage/remove", {
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
      lineId,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }

  return response.data;
};
