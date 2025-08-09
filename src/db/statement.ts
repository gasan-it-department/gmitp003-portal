import type { Region, AddPositionProps } from "@/interface/data";
import axios from "./axios";
import axiosIns from "axios";
export const getEmployees = async (
  token: string,
  page: number,
  office: string,
  sgFrom: string,
  sgTo: string,
  year: string,
  dateApp: string,
  dateLast: string,
  query: string
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
    }
  );
  if (response.status === 200) {
    return response.data;
  } else {
    throw new Error(response.data);
  }
};

export const getAllRegion = async (
  source: number,
  token: string,
  lastCursor: string | null = null
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
    console.log({ response });

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
    `https://psgc.gitlab.io/api/regions/${code}/provinces/`
  );

  if (response.status !== 200) {
    throw new Error("Fetched failed");
  }
  return response.data;
};

export const getAllProvincesMunicipalities = async (code: string) => {
  const response = await axiosIns.get(
    `https://psgc.gitlab.io/api/provinces/${code}/municipalities/`
  );

  if (response.status !== 200) {
    throw new Error("Fetched failed");
  }
  return response.data;
};

export const getAllMunicipalitiesBarangay = async (code: string) => {
  const response = await axiosIns.get(
    `https://psgc.gitlab.io/api/municipalities/${code}/barangays/`
  );

  if (response.status !== 200) {
    throw new Error("Fetched failed");
  }
  return response.data;
};

export const getAllOfficePersonnel = async (
  id: string,
  token: string,
  cursor: string | null
) => {
  const response = await axios.get("/personnel", {
    params: {
      id,
      cursor,
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
  lastCursor: string | null
) => {
  const response = await axios.get("/position", {
    params: {
      id,
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
};

export const handleAddPosition = async (data: AddPositionProps) => {
  const response = await axios.post("/position");
  if (response.status !== 201) {
    throw new Error(`${response.data}`);
  }
  return response.data;
};

export const getInvitationLink = async (
  invitationId: string,
  token: string
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
    throw new Error(`${response.data}`);
  }
  return response.data;
};

export const getAccounts = async (
  token: string | undefined,
  lastCursor: string | null,
  limit: number,
  query?: string
) => {
  const response = await axios.get("/accounts", {
    params: {
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
    throw new Error(`${response.data}`);
  }
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
  userId: string | undefined
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
  token: string | undefined,
  id: string,
  userId: string
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
  token: string,
  lastCursor: string | null,
  limit: string,
  id: string
) => {
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
  lastCursor: string | null,
  limit: string,
  query: string
) => {
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
  inventoryBoxId: string
) => {
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
  name: string
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
      }
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
  limit: string
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
  limit: string
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
  id: string
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
