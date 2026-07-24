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

/** Correct a batch's details. The server enforces Dispense & Stock Access
 *  (or storage ownership), recomputes totals, merges the batch if the edit
 *  makes it identical to another, and writes an audit log. */
export const editMedicineBatch = async (
  token: string,
  body: {
    stockId: string;
    quantity?: number;
    perUnit?: number;
    unitOfMeasure?: string;
    expiration?: string;
    manufacturingDate?: string;
    reason?: string;
  },
): Promise<{
  message: string;
  stockId: string;
  mergedInto: string | null;
  actualStock: number;
  changes: string[];
}> => {
  const response = await axios.patch("/medicine/stock/edit", body, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  if (response.status !== 200) throw new Error(response.data?.message);
  return response.data;
};

// ── Dispense history + bulk direct dispense ──────────────────────────────
export interface DispenseHistoryRow {
  id: string;
  kind: number; // 0 = direct, 1 = prescription
  patientName: string | null;
  dispenserName: string | null;
  dispenserUsername: string | null;
  external: boolean;
  externalSource: string | null;
  refNumber: string | null;
  totalUnits: number;
  itemCount: number;
  preview: string;
  timestamp: string;
}

export const dispenseHistory = async (
  token: string,
  lineId: string,
  lastCursor: string | null,
  limit: string,
  query: string,
  kind: string,
): Promise<{ list: DispenseHistoryRow[]; lastCursor: string | null; hasMore: boolean }> => {
  const response = await axios.get("/medicine/dispense-history", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: { lineId, lastCursor, limit, query, kind },
  });
  if (response.status !== 200) throw new Error(response.data?.message);
  return response.data;
};

export interface DispenseDetailItem {
  id: string;
  medicineName: string;
  serialNumber: string | null;
  barcode: string | null;
  quantity: number;
  unit: string | null;
  storageName: string | null;
  storageRef: string | null;
}
export interface DispenseDetail {
  id: string;
  kind: number;
  patientName: string | null;
  dispenserName: string | null;
  dispenserUsername: string | null;
  note: string | null;
  external: boolean;
  externalSource: string | null;
  prescriptionId: string | null;
  refNumber: string | null;
  totalUnits: number;
  timestamp: string;
  items: DispenseDetailItem[];
}

export const dispenseDetail = async (
  token: string,
  id: string,
): Promise<{ record: DispenseDetail }> => {
  const response = await axios.get("/medicine/dispense-history/detail", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: { id },
  });
  if (response.status !== 200) throw new Error(response.data?.message);
  return response.data;
};

/** Bulk direct dispense: one patient, many scanned items → one record. */
export const directDispenseMulti = async (
  token: string,
  body: {
    lineId: string;
    patientName?: string;
    note?: string;
    external?: boolean;
    externalSource?: string;
    items: Array<{ storageId: string; medicineId?: string; barcode?: string; quantity: number }>;
  },
): Promise<{ message: string; recordId: string; itemCount: number }> => {
  const response = await axios.post("/medicine/direct-dispense/multi", body, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  if (response.status !== 200) throw new Error(response.data?.message);
  return response.data;
};
