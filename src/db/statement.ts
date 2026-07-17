import type { Region } from "@/interface/data";
import axios from "./axios";
import axiosIns from "axios";

export const getUserInfo = async (token: string, id: string) => {
  const response = await axios.get("/user/data", {
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
    throw new Error(response.data.message);
  }
  return response.data;
};

export const userNotifications = async (
  token: string,
  id: string,
  lastCursor: string | null,
  limit: string,
) => {
  const response = await axios.get("/notification/list", {
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
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data.message);
  }
  return response.data;
};

export const getEmployees = async (
  token: string,
  page: number,
  office: string,
  sgFrom: string,
  sgTo: string,
  year: string,
  dateApp: string,
  dateLast: string,
  query: string,
) => {
  const response = await axios.post(
    "/employees",
    {
      page,
      office,
      sgFrom,
      sgTo,
      year,
      dateApp,
      dateLast,
      query,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    },
  );
  if (response.status === 200) {
    return response.data;
  } else {
    throw new Error(response.data);
  }
};

export const getPublicRegions = async () => {};

export const getRegions = async () => {
  const response = await axios.get("/all-regions");

  if (response.status !== 200) {
    throw new Error(response.data.message);
  }
  return response.data;
};

export const getProvince = async (
  token: string | undefined,
  id: string | undefined,
) => {
  const response = await axios.get("/provinces", {
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
    throw new Error(response.data.message);
  }
  return response.data;
};

export const getMunicipalities = async (
  token: string | undefined,
  id: string | undefined,
) => {
  const response = await axios.get("/municipalities", {
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
    throw new Error(response.data.message);
  }
  return response.data;
};

export const getBarangays = async (
  token: string | undefined,
  id: string | undefined,
) => {
  const response = await axios.get("/barangays", {
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
    throw new Error(response.data.message);
  }
  return response.data;
};

export const getAllRegion = async (
  source: number,
  token: string,
  lastCursor: string | null = null,
): Promise<{
  list: Region[];
  hasMore: boolean;
  lastCursor: string | null;
}> => {
  if (source) {
    const response = await axios.get("/region", {
      params: {
        lastCursor,
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
  }

  const response = await axiosIns.get("https://psgc.gitlab.io/api/regions/");

  if (response.status !== 200) {
    throw new Error("Fetched failed");
  }
  return response.data;
};

export const getAllRegionProvinces = async (code: string) => {
  const response = await axiosIns.get(
    `https://psgc.gitlab.io/api/regions/${code}/provinces/`,
  );

  if (response.status !== 200) {
    throw new Error("Fetched failed");
  }
  return response.data;
};

export const getAllProvincesMunicipalities = async (code: string) => {
  const response = await axiosIns.get(
    `https://psgc.gitlab.io/api/provinces/${code}/municipalities/`,
  );

  if (response.status !== 200) {
    throw new Error("Fetched failed");
  }
  return response.data;
};

export const getAllMunicipalitiesBarangay = async (code: string) => {
  const response = await axiosIns.get(
    `https://psgc.gitlab.io/api/municipalities/${code}/barangays/`,
  );

  if (response.status !== 200) {
    throw new Error("Fetched failed");
  }
  return response.data;
};

// ── PSGC code → place-name resolution (for DISPLAYING stored addresses) ─────
// Address selects store PSGC codes (e.g. "174003000"), not names. Resolve a
// single code to its place name via the same public PSGC API the selects use.
// Non-code values (already a name / free text) are returned unchanged.
const psgcNameCache = new Map<string, string>();
const isPsgcCode = (v?: string | null) =>
  !!v && /^\d{6,}$/.test(String(v).trim());

export const psgcName = async (
  code: string | null | undefined,
  kinds: string[],
): Promise<string> => {
  const v = (code ?? "").toString().trim();
  if (!isPsgcCode(v)) return v;
  if (psgcNameCache.has(v)) return psgcNameCache.get(v)!;
  for (const kind of kinds) {
    try {
      const res = await fetch(`https://psgc.gitlab.io/api/${kind}/${v}/`);
      if (res.ok) {
        const json = await res.json();
        if (json?.name) {
          psgcNameCache.set(v, json.name);
          return json.name;
        }
      }
    } catch {
      /* try the next kind */
    }
  }
  return v; // unresolved → fall back to the raw code
};

export interface ResolvedPlaceNames {
  province: string;
  city: string;
  barangay: string;
}

// Resolve a province / city-municipality / barangay code-triple to names.
export const resolveAddressNames = async (a: {
  province?: string | null;
  city?: string | null;
  barangay?: string | null;
}): Promise<ResolvedPlaceNames> => {
  const [province, city, barangay] = await Promise.all([
    psgcName(a.province, ["provinces"]),
    psgcName(a.city, ["municipalities", "cities"]),
    psgcName(a.barangay, ["barangays"]),
  ]);
  return { province, city, barangay };
};

// ── Provisional (temporary/contract) staff ─────────────────────────────────
// Designations = non-plantilla UnitPositions on the line; personnel = Users
// whose status is a provisional category. Both cursor-paginated.
const provHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  Accept: "application/json",
  "X-Requested-With": "XMLHttpRequest",
});

export const provisionalPositionsList = async (
  token: string,
  lineId: string,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/provisional/positions", {
    headers: provHeaders(token),
    params: { id: lineId, lastCursor, limit, query },
  });
  if (response.status !== 200) throw new Error("Failed to load positions");
  return response.data;
};

export const updateProvisionalPosition = async (
  token: string,
  payload: {
    positionId: string;
    title?: string;
    empType?: string;
    termMonths?: number;
    slots?: number;
    description?: string | null;
    salaryGradeId?: string | null;
    lineId: string;
    userId?: string;
  },
) => {
  const response = await axios.patch("/provisional/position", payload, {
    headers: provHeaders(token),
  });
  if (response.status !== 200) throw new Error("Failed to update position");
  return response.data;
};

export const updateProvisionalPersonnel = async (
  token: string,
  payload: {
    userId: string;
    status?: string;
    salaryGradeId?: string | null;
    actorId: string;
    lineId: string;
  },
) => {
  const response = await axios.patch("/provisional/personnel", payload, {
    headers: provHeaders(token),
  });
  if (response.status !== 200) throw new Error("Failed to update personnel");
  return response.data;
};

export const createProvisionalPosition = async (
  token: string,
  payload: {
    title: string;
    empType: string;
    termMonths: number;
    slots: number;
    description?: string | null;
    lineId: string;
    salaryGradeId?: string | null;
    userId?: string;
  },
) => {
  const response = await axios.post("/provisional/position", payload, {
    headers: provHeaders(token),
  });
  if (response.status !== 200) throw new Error("Failed to create position");
  return response.data;
};

export const provisionalInvite = async (
  token: string,
  payload: {
    applicationIds: string[];
    provisionalPositionId: string;
    unitId: string;
    userId: string;
    lineId: string;
    message?: string | null;
  },
) => {
  const response = await axios.post("/provisional/invite", payload, {
    headers: provHeaders(token),
  });
  if (response.status !== 200) throw new Error("Failed to send invite");
  return response.data;
};

export const provisionalPersonnel = async (
  token: string,
  lineId: string,
  lastCursor: string | null,
  limit: string,
  query: string,
  status?: string,
  term?: string,
  tags?: string[],
) => {
  const response = await axios.get("/provisional/personnel", {
    headers: provHeaders(token),
    params: {
      id: lineId,
      lastCursor,
      limit,
      query,
      status: status ?? "",
      term: term ?? "",
      tags: tags ?? [],
    },
  });
  if (response.status !== 200) throw new Error("Failed to load personnel");
  return response.data;
};

export const provisionalTransfer = async (
  token: string,
  payload: {
    userIds: string[];
    unitId: string;
    actorId: string;
    lineId: string;
  },
) => {
  const response = await axios.post("/provisional/transfer", payload, {
    headers: provHeaders(token),
  });
  if (response.status !== 200) throw new Error("Failed to transfer");
  return response.data;
};

export const provisionalRemove = async (
  token: string,
  payload: {
    userIds: string[];
    actorId: string;
    lineId: string;
    message?: string | null;
  },
) => {
  const response = await axios.post("/provisional/remove", payload, {
    headers: provHeaders(token),
  });
  if (response.status !== 200) throw new Error("Failed to remove");
  return response.data;
};

export const provisionalRenew = async (
  token: string,
  payload: {
    userIds: string[];
    months: number;
    actorId: string;
    lineId: string;
  },
) => {
  const response = await axios.post("/provisional/renew", payload, {
    headers: provHeaders(token),
  });
  if (response.status !== 200) throw new Error("Failed to renew");
  return response.data;
};

// Downloads the (filtered) provisional personnel list as an .xlsx and triggers
// a browser download. Passes the same status/term/search filters as the list.
export const downloadProvisionalPersonnelExcel = async (
  token: string,
  lineId: string,
  query: string,
  status?: string,
  term?: string,
  tags?: string[],
) => {
  const response = await axios.get("/provisional/personnel/excel", {
    headers: provHeaders(token),
    params: {
      id: lineId,
      query,
      status: status ?? "",
      term: term ?? "",
      tags: tags ?? [],
    },
    responseType: "blob",
  });
  const blob = response.data as Blob;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const cd = response.headers["content-disposition"] as string | undefined;
  const m = cd ? /filename="?([^"]+)"?/.exec(cd) : null;
  a.download = m ? m[1] : "provisional-personnel.xlsx";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Admin panel — full-database backup as a downloaded JSON file.
export const downloadBackup = async (token: string | undefined) => {
  const response = await axios.get("/admin/backup/export", {
    headers: provHeaders(token as string),
    responseType: "blob",
  });
  const blob = response.data as Blob;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const cd = response.headers["content-disposition"] as string | undefined;
  const m = cd ? /filename="?([^"]+)"?/.exec(cd) : null;
  a.download = m ? m[1] : "gmitp-backup.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Admin panel — restore a backup JSON (skips rows whose PK already exists).
export const importBackup = async (
  token: string | undefined,
  data: unknown,
) => {
  const response = await axios.post("/admin/backup/import", data, {
    headers: provHeaders(token as string),
  });
  if (response.status !== 200) throw new Error("Import failed");
  return response.data;
};

// Admin panel — audit logs. `type` selects the log model (hr, medicine, ...).
export const getAdminLogs = async (
  token: string | undefined,
  type: string,
  lastCursor: string | null,
  limit: number,
  query?: string,
) => {
  const response = await axios.get("/admin/logs", {
    headers: provHeaders(token as string),
    params: { type, lastCursor, limit, query: query ?? "" },
  });
  if (response.status !== 200) throw new Error("Failed to load logs");
  return response.data;
};

export const getAllOfficePersonnel = async (
  token: string,
  id: string,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/personnel", {
    params: {
      id,
      lastCursor,
      limit,
      query,
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

export const getAllPostions = async (
  id: string,
  token: string,
  lastCursor: string | null,
  limit: string,
) => {
  const response = await axios.get("/position/list", {
    params: {
      id,
      lastCursor,
      limit,
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

export const handleAddPosition = async () => {
  const response = await axios.post("/position");
  if (response.status !== 201) {
    throw new Error(`${response.data}`);
  }
  return response.data;
};

export const getInvitationLink = async (
  invitationId: string,
  token: string,
) => {
  const response = await axios.get(`/invitation`, {
    params: {
      id: invitationId,
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
    throw new Error(response.data);
  }
  return response.data;
};

export const getAccounts = async (
  token: string | undefined,
  lastCursor: string | null,
  limit: number,
  query?: string,
  filter?: string,
) => {
  const response = await axios.get("/accounts", {
    params: {
      lastCursor,
      limit,
      query,
      filter: filter ?? "",
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
    throw new Error(`${response.data}`);
  }
  return response.data;
};

export const setAccountStatus = async (
  token: string | undefined,
  accountId: string,
  active: boolean,
) => {
  const response = await axios.patch(
    "/account/status",
    { accountId, active },
    { headers: provHeaders(token as string) },
  );
  if (response.status !== 200) throw new Error("Failed to update status");
  return response.data;
};

export const deleteAccount = async (
  token: string | undefined,
  accountId: string,
) => {
  const response = await axios.delete("/account/delete", {
    headers: provHeaders(token as string),
    data: { accountId },
  });
  if (response.status !== 200) throw new Error("Failed to delete account");
  return response.data;
};

export const dashboardReport = async (token: string | undefined) => {
  const response = await axios.get("/overall", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });

  if (response.status !== 200) {
    throw new Error(`${response.data}`);
  }
  return response.data;
};

export const getContainer = async (
  token: string,
  lastCursor: string | null,
  limit: string,
  query: string,
  departId: string | undefined,
  userId: string | undefined,
) => {
  const response = await axios.get("/inventories", {
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
      departId,
      userId,
    },
  });
  if (response.status !== 200) {
    throw new Error(`${response.data}`);
  }
  return response.data;
};

export const getContainerData = async (
  token: string,
  id: string,
  userId: string,
) => {
  const response = await axios.get("/view-container", {
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
  if (response.status !== 200) {
    throw new Error(`${response.data}`);
  }
  return response.data;
};

export const getDataSets = async (
  token: string | undefined,
  lastCursor: string | null,
  limit: string,
  id: string,
) => {
  if (!token) {
    throw new Error("Required ID not found!");
  }
  const response = await axios.get("/data-set-list", {
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
      id,
    },
  });
  if (response.status !== 200) {
    throw new Error(`${response.data}`);
  }
  return response.data;
};

export const getDataSetData = async (token: string, id: string) => {
  const response = await axios.get("/data-set-info", {
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
    throw new Error(`${response.data}`);
  }
  return response.data;
};

export const getDataSetDataSupplies = async (
  token: string,
  id: string,
  lastCursor: unknown,
  limit: string,
  query: string,
) => {
  console.log({ id, lastCursor });

  const response = await axios.get("/data-set-supplies", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
    params: {
      id,
      lastCursor,
      limit,
      query,
    },
  });
  if (response.status !== 200) {
    throw new Error(`${response.data}`);
  }
  return response.data;
};

export const delteSupply = async (
  token: string,
  id: string | null,
  userId: string,
  inventoryBoxId: string,
) => {
  console.log({ id, userId, inventoryBoxId });

  if (!id || !userId || !inventoryBoxId) {
    throw new Error("Invalid required data!");
  }
  const response = await axios.delete("/delete-supply", {
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
      inventoryBoxId,
    },
  });
  if (response.status !== 200) {
    throw new Error(`${response.data.message}`);
  }
  return response.data;
};

export const handleExportDataSetSupplies = async (
  id: string,
  token: string,
  name: string,
) => {
  try {
    const response = await axios.post(
      "/data-set-supplies-excel", // ✅ Full URL!
      { id },
      {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
        withCredentials: true,
      },
    );

    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${name}.xlsx`);
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Export error:", error);
  }
};

export const inventoryAccessList = async (
  token: string,
  inventoryBoxId: string,
  lastCursor: string | null,
  limit: string,
) => {
  const response = await axios.get("/container-access", {
    params: {
      id: inventoryBoxId,
      lastCursor,
      limit,
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

export const searchUser = async (
  token: string,
  query: string,
  lastCursor: string | null,
  limit: string,
) => {
  const response = await axios.get("/search-user", {
    params: {
      query,
      lastCursor,
      limit,
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

export const getList = async (
  token: string,
  query: string,
  lastCursor: string | null,
  limit: string,
  id: string,
) => {
  const response = await axios.get("/list", {
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

export const getOrderItems = async (
  token: string,
  query: string,
  lastCursor: string | null,
  limit: string,
  id: string,
) => {
  const response = await axios.get("/supply-order-items", {
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
    throw new Error(response.data.message);
  }
  return response.data;
};

export const getSupplyOrders = async (
  token: string,
  query: string,
  lastCursor: string | null,
  limit: string,
  id: string,
) => {
  console.log({ token, query, lastCursor, limit, id });

  const response = await axios.get("/orders", {
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
    throw new Error(response.data.message);
  }

  return response.data;
};

// export const dataSetSelection = async () => {
//   const response = await axios;
// };

export const supplyQualities = async (
  token: string,
  lastCursor: string | null,
  limit: string,
) => {
  const response = await axios.get("/supply-quality", {
    params: {
      lastCursor,
      limit,
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
    throw new Error(response.data.message);
  }
  return response.data;
};

export const deleteOrderItem = async (
  token: string,
  id: string,
  userId: string,
  inventoryBoxId: string,
  orderId: string,
) => {
  const response = await axios.delete("/delete-order-item", {
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
      inventoryBoxId,
      orderId,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data.message);
  }
  return response.data;
};

export const updateOrderItem = async (
  token: string,
  id: string,
  userId: string,
  inventoryBoxId: string,
  value: string,
  desc: string | undefined,
) => {
  const response = await axios.patch(
    "/update-order-item",
    {
      value,
      id,
      userId,
      inventoryBoxId,
      desc,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    },
  );
  if (response.status !== 200) {
    throw new Error(response.data.message);
  }
  return response.data;
};

export const getorderData = async (token: string, id: string) => {
  const response = await axios.get("/order", {
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
    throw new Error(response.data.message);
  }
  return response.data;
};

export const deleteOrder = async (
  token: string,
  id: string,
  userId: string,
  inventoryBoxId: string,
) => {
  const response = await axios.delete("/delete-order", {
    params: {
      id,
      inventoryBoxId,
      userId,
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
    throw new Error(response.data.message);
  }
  return response.data;
};

export const saveOrder = async (
  token: string,
  id: string,
  userId: string,
  inventoryBoxId: string,
  status: number,
) => {
  const response = await axios.patch(
    "/save-order",
    {
      id,
      userId,
      inventoryBoxId,
      status,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    },
  );

  if (response.status !== 200) {
    throw new Error(response.data.message);
  }
  return response.data;
};

export const deleteDataSet = async (
  token: string,
  id: string,
  userId: string,
  inventoryBoxId: string,
  password: string,
) => {
  if (password.trim() !== "CONFIRM") {
    throw new Error("INCORRECT");
  }
  const response = await axios.delete("/delete-data-set", {
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
      inventoryBoxId,
    },
  });
  if (response.status !== 200) {
    throw new Error(response.data.message);
  }
  return response.data;
};

export const getListData = async (token: string, id: string) => {
  const response = await axios.get("/list-data", {
    params: {
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
    throw new Error(response.data.message);
  }
  return response.data;
};

export const accessUserList = async (
  token: string,
  query: string,
  lastCursor: unknown,
  limit: string,
  id: string,
) => {
  const response = await axios.get("/access-list", {
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
    throw new Error(response.data.message);
  }
  return response.data;
};

export const suppliesOverview = async (
  token: string,
  lastCursor: unknown,
  limit: string,
  query: string | undefined,
  inventoryBoxId: string | undefined,
  id: string,
) => {
  const response = await axios.get("/supply-overview", {
    params: {
      lastCursor,
      limit,
      query,
      inventoryBoxId,
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
    throw new Error(response.data.message);
  }
  return response.data;
};

export const supplyList = async (
  token: string,
  id: string,
  lastCursor: string | null,
  limit: string,
  query: string,
  trend: string,
) => {
  const response = await axios.get("/supply-list", {
    params: {
      lastCursor,
      limit,
      query,
      id,
      trend,
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
    throw new Error(response.data.message);
  }
  return response.data;
};

export const timeBaseSupply = async (
  token: string,
  id: string,
  lastCursor: string | null,
  limit: string,
  query: string,
  period: string,
) => {
  const response = await axios.get("/supply-time-base", {
    params: {
      lastCursor,
      limit,
      query,
      id,
      period,
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
    throw new Error(response.data.message);
  }
  return response.data;
};

export const getSuppliers = async (
  token: string,
  id: string,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/suppliers", {
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

export const getUsers = async (
  token: string,
  id: string,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/users", {
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

export const employeeList = async (
  token: string,
  id: string,
  lastCursor: string | null,
  limit: string,
  query: string,
  departId: string,
) => {
  const response = await axios.get("/employee-list", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
    params: {
      id,
      lastCursor,
      limit,
      query,
      departId,
    },
  });

  if (response.status !== 200) {
    throw new Error("Fetched failed");
  }
  return response.data;
};

export const inviteLinks = async (
  token: string,
  id: string,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/invite-link", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
    params: {
      id,
      lastCursor,
      limit,
      query,
    },
  });

  if (response.status !== 200) {
    throw new Error("Fetched failed");
  }
  return response.data;
};

export const createInviteLink = async (
  date: Date,
  time: string | undefined,
  token: string | undefined,
) => {
  if (!token) {
    throw new Error("");
  }
  const response = await axios.post(
    "/create-invite",
    { date, time },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    },
  );

  if (response.status !== 200) {
    throw new Error("Fetched failed");
  }
  return response.data;
};

export const deleteInviteLink = async (
  token: string | undefined,
  id: string,
  userId: string,
  lineId: string | undefined,
) => {
  console.log({ id, userId, lineId });

  if (!lineId || !token) {
    throw new Error("Invalid Required ID or Token");
  }
  const response = await axios.delete("/delete-link", {
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
    throw new Error("Fetched failed");
  }
  return response.data;
};

export const suspendInviteLink = async (
  token: string,
  id: string,
  suspend: boolean,
  userId: string,
  lineId: string,
) => {
  const response = await axios.patch(
    "/invitation/suspend",
    { id, suspend, userId, lineId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    },
  );
  return response.data;
};

export const getPurchaseRequest = async (
  token: string,
  id: string,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/purchase-request", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
    params: {
      id,
      lastCursor,
      limit,
      query,
    },
  });
  if (response.status !== 200) {
    throw new Error(response.data);
  }
  return response.data;
};

export const getPurchaseInfo = async (token: string, id: string) => {
  const response = await axios.get("purchase-request-info", {
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

export const getPurchaseRequestItemList = async (
  token: string,
  id: string,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/purchase-request-list", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
    params: {
      id,
      lastCursor,
      limit,
      query,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }
  return response.data;
};

export const storageList = async (
  token: string,
  id: string,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/medicine/storage", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
    params: {
      id,
      lastCursor,
      limit,
      query,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }
  return response.data;
};

export const medicineNotifications = async (
  token: string,
  id: string,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/medicine-notifications", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
    params: {
      id,
      lastCursor,
      limit,
      query,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }
  return response.data;
};

export const updateUnit = async (
  token: string,
  body: {
    id: string;
    name?: string;
    description?: string | null;
    userId: string;
    lineId: string;
  },
) => {
  const response = await axios.patch("/unit/update", body, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  return response.data;
};

export const deleteUnit = async (
  token: string,
  id: string,
  userId: string,
  lineId: string,
) => {
  const response = await axios.delete("/unit/delete", {
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

export const getLinetUnits = async (
  token: string,
  id: string,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/line-units", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
    params: {
      id,
      lastCursor,
      limit,
      query,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }
  return response.data;
};

export const getStorageMedicine = async (
  token: string,
  id: string,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/line-units", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
    params: {
      id,
      lastCursor,
      limit,
      query,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }
  return response.data;
};

export const getUnitInfo = async (token: string, id: string) => {
  const response = await axios.get("/unit-info", {
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

// export const viewStorage = async () => {
//   const response = await axios.get("/");
// };

export const medicineList = async (
  token: string,
  id: string,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/medicine/storage-list", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
    params: {
      id,
      lastCursor,
      limit,
      query,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }
  return response.data;
};

export const medicineLogs = async (
  token: string,
  id: string,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/medicine/logs", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
    params: {
      id,
      lastCursor,
      limit,
      query,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }
  return response.data;
};

export const getStorageMeds = async (
  token: string,
  id: string,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/medicine/items", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
    params: {
      id,
      lastCursor,
      limit,
      query,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }
  return response.data;
};

export const precriptionInfo = async (
  token: string,
  id: string,
  userId: string,
  lineId: string,
) => {
  const response = await axios.get("/medicine/prescription-info", {
    params: {
      id,
      userId,
      lineId,
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
    throw new Error(response.data.message);
  }
  return response.data;
};

export const storageMedList = async (
  token: string,
  id: string | undefined,
  lastCursor: string | null,
  limit: string,
  query: string,
  lineId: string,
) => {
  const response = await axios.get("/medicine/storage-item", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
    params: {
      id,
      lastCursor,
      limit,
      query,
      lineId,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data.message);
  }
  return response.data;
};

export const barangays = async (
  token: string,
  id: string | undefined,
  lastCursor: string | null,
  limit: string,
  query: string,
  lineId: string,
) => {
  const response = await axios.get("/medicine/storage-item", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
    params: {
      id,
      lastCursor,
      limit,
      query,
      lineId,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data.message);
  }
  return response.data;
};

export const getMedInbox = async (
  token: string,
  id: string | undefined,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/medicine/notifications", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "Cache-Control": "no-cache, no-store, must-revalidate",
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

export const newInboxCount = async (
  token: string | undefined,
  lineId: string | undefined,
) => {
  if (!lineId) throw new Error("Invalid line ID");
  const response = await axios.get("/medicine/new/notif", {
    params: {
      id: lineId,
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
    throw new Error(response.data.message);
  }
  return response.data;
};

export const prescriptionList = async (
  token: string,
  id: string | undefined,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/medicine/prescriptions", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "Cache-Control": "no-cache, no-store, must-revalidate",
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

export const viewMedicineNotification = async (
  token: string | undefined,
  id: string,
) => {
  const response = await axios.patch(
    "/medicine/notification/view",
    { id },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    },
  );

  if (response.status !== 200) {
    throw new Error(response.data.message);
  }
  return response.data;
};

export const prescriptionData = async (
  token: string | undefined,
  id: string | undefined,
) => {
  const response = await axios.get("/prescription/data", {
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
    throw new Error(response.data.message);
  }
  return response.data;
};

export const prescriptionPrescribeMed = async (
  token: string,
  id: string | undefined,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/prescription/prescribe/med", {
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

export const prescriptionProgress = async (
  token: string,
  id: string | undefined,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/prescription/progress", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "Cache-Control": "no-cache, no-store, must-revalidate",
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

export const salaryGradeList = async (
  token: string,
  id: string | undefined,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/salary-grade/list", {
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

export const lineApplications = async (
  token: string,
  id: string | undefined,
  lastCursor: string | null,
  limit: string,
  query: string,
  tags: string[],
  dateFrom: string | undefined,
  dateTo: string | undefined,
  positionId: string | undefined,
  /** When true, the backend drops applications already onboarded or with
   *  a live invitation. Used by the Position → Select Applicant picker. */
  eligibleOnly?: boolean,
) => {
  const response = await axios.get("/application/list", {
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
      tags,
      dateFrom,
      dateTo,
      positionId,
      ...(eligibleOnly ? { eligibleOnly: "1" } : {}),
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data.message);
  }
  return response.data;
};

export const postSelectionList = async (
  token: string,
  id: string | undefined,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/position/selection-list", {
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

export const positionData = async (token: string, id: string) => {
  const response = await axios.get("/position/data", {
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
    throw new Error(response.data.message);
  }
  return response.data;
};

export const postJob = async (
  token: string,
  status: number,
  hideSG: boolean,
  showApplicationCount: boolean,
  location: string | undefined,
  positionId: string,
  lineId: string,
  userId: string,
) => {
  const response = await axios.post(
    "/application/post",
    {
      status,
      hideSG,
      showApplicationCount,
      location,
      id: positionId,
      lineId,
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
    throw new Error(response.data.message);
  }
  return response.data;
};

export const linePositions = async (
  token: string,
  id: string | undefined,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/position/line", {
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

export const postJobRequirementList = async (
  token: string,
  id: string | undefined,
  lastCursor: string | null,
  limit: string,
) => {
  const response = await axios.get("/application/post-job/requirement", {
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
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data.message);
  }
  return response.data;
};

export const removeRequirements = async (token: string, id: string) => {
  const response = await axios.delete("/application/post-job/delete", {
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
    throw new Error(response.data.message);
  }
  return response.data;
};

export const removeRequirementsAssets = async (token: string, id: string) => {
  const response = await axios.delete(
    "/application/post-job/requirements/delete",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      params: {
        id,
      },
    },
  );

  if (response.status !== 200) {
    throw new Error(response.data.message);
  }
  return response.data;
};

export const removePostJobRequirements = async (token: string, id: string) => {
  const response = await axios.delete(
    "/application/post-job/requirements/delete",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      params: {
        id,
      },
    },
  );

  if (response.status !== 200) {
    throw new Error(response.data.message);
  }
  return response.data;
};

export const jobPost = async (
  id: string | undefined,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/application/job-post", {
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

export const publicJobPost = async (id: string) => {
  const response = await axios.get("/job-post-data", {
    params: {
      id,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data.message);
  }
  return response.data;
};

export const getPSGSProvince = async (region: string) => {
  try {
    const response = await fetch(
      `https://psgc.gitlab.io/api/regions/${region}/provinces/`,
    );
    const data = await response.json();
    return data;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : String(err));
  }
};

export const getPSGCMunicipalities = async (provinceId: string) => {
  try {
    const response = await fetch(
      `https://psgc.gitlab.io/api/provinces/${provinceId}/municipalities/`,
    );
    const data = await response.json();
    return data;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : String(err));
  }
};

export const getPSGCbarangays = async (municipalId: string) => {
  try {
    const response = await fetch(
      `https://psgc.gitlab.io/api/municipalities/${municipalId}/barangays/`,
    );
    const data = await response.json();
    return data;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : String(err));
  }
};

/**
 * Download a filled CS Form 212 (.xlsx). Pass `applicationId` for an
 * application, or `userId` for an onboarded employee. Triggers a browser
 * download with the filename from the response.
 */
export const downloadPdsExcel = async (params: {
  applicationId?: string;
  userId?: string;
}) => {
  const qs = params.applicationId
    ? `id=${encodeURIComponent(params.applicationId)}`
    : `userId=${encodeURIComponent(params.userId ?? "")}`;
  const response = await axios.get(`/application/pds/export?${qs}`, {
    responseType: "blob",
  });
  const blob = response.data as Blob;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const cd = response.headers["content-disposition"] as string | undefined;
  const m = cd ? /filename="?([^"]+)"?/.exec(cd) : null;
  a.download = m ? m[1] : "PDS.xlsx";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const getApplicationData = async (token: string, id: string) => {
  const response = await axios.get("/application/data", {
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

// PUBLIC applicant action — replace the profile photo, or add/replace a
// document, on the submitted application. target: "profile" | "document".
export const reuploadApplicationFile = async (args: {
  applicationId: string;
  file: File;
  target: "profile" | "document";
  attachmentId?: string;
}) => {
  const fd = new FormData();
  fd.append("applicationId", args.applicationId);
  fd.append("target", args.target);
  if (args.attachmentId) fd.append("attachmentId", args.attachmentId);
  fd.append("file", args.file);
  const response = await axios.post("/application/public/reupload", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data as { message: string; file_url?: string; id?: string };
};

// PUBLIC applicant action — safe PARTIAL update of any section. Only the keys
// passed are written; unedited fields are never touched. `fields` uses the
// stored field names (e.g. cvilStatus, tinNo, elementary, experience).
export const updatePublicApplication = async (
  applicationId: string,
  fields: Record<string, unknown>,
) => {
  const response = await axios.patch(
    "/application/public/update",
    { applicationId, ...fields },
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    },
  );
  return response.data as { message: string; updated: number };
};

// PUBLIC applicant action — edit the core contact/identity fields.
export const editApplicationContact = async (args: {
  applicationId: string;
  firstname: string;
  middleName?: string;
  lastname: string;
  suffix?: string;
  email: string;
  mobileNo: string;
  teleNo?: string;
}) => {
  const response = await axios.patch(
    "/application/public/edit-contact",
    args,
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    },
  );
  return response.data as { message: string };
};

// PUBLIC applicant action — withdraw (cancel) the submitted application.
// The applicationId UUID is the credential (same model as viewing).
export const withdrawApplication = async (
  applicationId: string,
  reason?: string,
) => {
  const response = await axios.post(
    "/application/public/withdraw",
    { applicationId, reason },
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    },
  );
  return response.data as { message: string; status?: number };
};

export const publicApplicationData = async (
  token: string,
  applicatioId: string,
) => {
  const response = await axios.get("/application/public/data", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: {
      id: applicatioId,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }
  return response.data;
};

export const contactApplications = async (
  token: string,
  messaeg: string,
  subject: string,
  email: string,
  contactNumber: string,
) => {
  const response = await axios.post(
    "/application/contact-applicant",
    {
      messaeg,
      subject,
      email,
      contactNumber,
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

export const applicationConversation = async (
  token: string,
  id: string | undefined,
  lastCursor: string | null,
  limit: string,
) => {
  const response = await axios.get("/application/conversation", {
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
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }
  return response.data;
};

export const applicationPublicConversation = async (
  token: string,
  id: string | undefined,
  lastCursor: string | null,
  limit: string,
) => {
  const response = await axios.get("/application/public/conversation", {
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
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }
  return response.data;
};

export const sendPublicApplication = async (
  token: string,
  applicationId: string,
  message: string,
) => {
  const response = await axios.post(
    "/application/public/application",
    {
      applicationId,
      message,
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
  return response.data;
};

export const updateApplicantStatus = async (
  token: string,
  status: number,
  applicantId: string,
  userId: string,
  lineId: string,
) => {
  const response = await axios.patch(
    "/application/update/status",
    {
      status,
      applicantId,
      userId,
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
    throw new Error(response.data);
  }
  return response.data;
};

export const sendOTPviaEmail = async (id: string, to: number) => {
  const url = to === 1 ? "/otp/send-via/phone-number" : "/otp/send-via/email";
  const response = await axios.get(url, {
    params: {
      applicationId: id,
    },
  });
  if (response.status !== 200) throw new Error(response.data.message);
  return response.data;
};

export const prescribeTransaction = async (
  token: string,
  id: string | undefined,
  lastCursor: string | null,
  limit: string,
) => {
  const response = await axios.get("/prescription/transaction", {
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
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data.message);
  }
  return response.data;
};

export const prescribedData = async (token: string, id: string) => {
  const response = await axios.get("/prescription/data", {
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
    throw new Error(response.data.message);
  }
  return response.data;
};

export const getLineModuleData = async (
  token: string,
  id: string,
  indexes: number[],
) => {
  const response = await axios.get("/module/list", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: {
      id,
      indexes,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data.message);
  }
  return response.data;
};

export const getModuleUsers = async (
  token: string,
  id: string | undefined,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const resposne = await axios.get("/module/users", {
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

  if (resposne.status !== 200) {
    throw new Error(resposne.data.message);
  }
  return resposne.data;
};

export const userAssignedModule = async (token: string, id: string) => {
  const response = await axios.get("/module/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: {
      userId: id,
    },
  });

  if (response.status !== 200) throw new Error(response.data.message);
  return response.data;
};

export const getSupplyCat = async (
  token: string,
  id: string | undefined,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/supply/category", {
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

export const supplyStats = async (token: string, listId: string) => {
  const response = await axios.get("/supply/overview/status", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: {
      listId,
    },
  });

  if (response.status !== 200) throw new Error(response.data.message);
  return response.data;
};

export const supplyTimeBaseReport = async (
  token: string,
  id: string,
  lastCursor: string | null,
  limit: string,
  quarter: string,
) => {
  const response = await axios.get("/supply/timebase", {
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
      quarter,
    },
  });

  if (response.status !== 200) throw new Error(response.data.message);
  return response.data;
};

export const getSupplyExcelTemplate = async () => {};

export const viewUserProfile = async (
  token: string,
  userProfileId: string,
  userId: string,
) => {
  const response = await axios.get("/user/view-profile", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: {
      userProfileId,
      userId,
    },
  });

  if (response.status !== 200) throw new Error(response.data.message);
  return response.data;
};

// Verification QR for an employee (shown on their profile + used on the ID).
export const getUserVerifyInfo = async (token: string, userId: string) => {
  const response = await axios.get("/user/verify-info", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: { userId },
  });
  if (response.status !== 200) throw new Error("Failed to load verify QR");
  return response.data as {
    code: string;
    verifyUrl: string;
    qr: string;
    extras?: {
      birthday: string;
      age: string;
      sex: string;
      phone: string;
      civilStatus: string;
      bloodType: string;
      address: string;
    };
  };
};

// PUBLIC — confirm an ID's QR code maps to a real, active employee. No auth.
export const verifyIdCode = async (code: string) => {
  const response = await axios.get("/id/verify", {
    headers: { Accept: "application/json" },
    params: { code },
  });
  return response.data as {
    found: boolean;
    valid: boolean;
    fullName?: string;
    position?: string | null;
    department?: string | null;
    line?: string | null;
    status?: string;
    photoUrl?: string | null;
  };
};

// Bulk ID issuing — all active employees of a line for the batch picker.
export const idIssueList = async (token: string, lineId: string) => {
  const response = await axios.get("/id/issue-list", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: { lineId },
  });
  return response.data as {
    list: {
      userId: string;
      fullName: string;
      position: string;
      photoUrl: string | null;
      departmentId: string;
      office: string;
    }[];
    units: { id: string; name: string }[];
  };
};

export interface IdExportPaper {
  size: string;
  orientation: "portrait" | "landscape";
  marginMm: number;
  gapMm: number;
  flip: "long" | "short";
  cutMarks: boolean;
}

// Generate the imposed front/rear ID PDFs (returned as base64).
export const idExportBatch = async (
  token: string,
  body: {
    lineId: string;
    userIds: string[];
    template: unknown;
    paper: IdExportPaper;
    nameOverrides?: Record<string, string>;
    nameScales?: Record<string, number>;
  },
) => {
  const response = await axios.post("/id/export-batch", body, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  return response.data as {
    front: string;
    rear: string | null;
    meta: {
      cols: number;
      rows: number;
      perPage: number;
      count: number;
      pages: number;
    };
  };
};

export const userRecord = async (
  token: string,
  userId: string,
  lineId?: string,
) => {
  const response = await axios.get("/user/record", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: { userId, lineId },
  });

  if (response.status !== 200) throw new Error(response.data.message);
  return response.data;
};

export const archivedPersonnel = async (
  token: string,
  id: string,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/archived-personnel", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: { id, lastCursor, limit, query },
  });

  if (response.status !== 200) throw new Error(response.data.message);
  return response.data;
};

export const restorePersonnel = async (
  token: string,
  payload: { userId: string; lineId: string; actorId?: string },
) => {
  const response = await axios.post("/archived-personnel/restore", payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (response.status !== 200) throw new Error("Failed to restore");
  return response.data;
};

// A container's datasets (with supply counts) — used by the direct "Add item"
// form to search/create supplies. Datasets are per-container, not per-list.
export const getContainerDatasets = async (
  token: string,
  containerId: string,
) => {
  const response = await axios.get("/supply/container-datasets", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: { id: containerId },
  });
  if (response.status !== 200) throw new Error(response.data?.message);
  return response.data as {
    list: { id: string; title: string; count: number }[];
  };
};

export const suspendAccount = async (
  token: string,
  userId: string,
  lineId: string,
  accountId: string,
) => {
  const response = await axios.patch(
    "/user/suspend",
    {
      userId,
      lineId,
      accountId,
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

  if (response.status !== 200) throw new Error(response.data.message);
  return response.data;
};

export const inventoryLogs = async (
  token: string,
  id: string | undefined,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/inventory/logs", {
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
