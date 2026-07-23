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
    storageId?: string;
    threshold: number;
    lineId: string;
    userId: string;
  },
) => {
  // ONE threshold per MEDICINE — the alert watches the medicine's TOTAL
  // stock across every batch and storage, not per-batch counts.
  const response = await axios.patch("/medicine/low-stock-threshold", body, {
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

/** Pharmacy Home search: a medicine's stock per storage, each storage
 *  flagged `accessible` (does the CALLER hold Dispense & Stock Access). */
export interface MedicineSearchStorage {
  id: string;
  name: string | null;
  refNumber: string | null;
  onHand: number;
  batches: number;
  nearestExpiration: string | null;
  accessible: boolean;
}
export interface MedicineSearchHit {
  id: string;
  name: string;
  serialNumber: string;
  barcode: string | null;
  totalOnHand: number;
  storages: MedicineSearchStorage[];
}
export const searchMedicineStock = async (
  token: string,
  lineId: string,
  query: string,
): Promise<{ list: MedicineSearchHit[] }> => {
  const response = await axios.get("/medicine/search-stock", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
    params: { id: lineId, query },
  });

  if (response.status !== 200) throw new Error(response.data);

  return response.data;
};

/** Direct dispense (no prescription): one op through the bulk endpoint.
 *  Server enforces Dispense & Stock Access + FEFO + audit logging. */
export const directDispense = async (
  token: string,
  op: {
    lineId: string;
    storageId: string;
    medicineId?: string;
    barcode?: string;
    quantity: number;
    note?: string;
    patientName?: string;
  },
): Promise<{
  results: Array<{ clientOpId: string; status: string; message?: string }>;
}> => {
  const response = await axios.post(
    "/medicine/direct-dispense/bulk",
    { ops: [{ clientOpId: crypto.randomUUID(), ...op }] },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    },
  );
  if (response.status !== 200) throw new Error(response.data?.message);
  return response.data;
};
