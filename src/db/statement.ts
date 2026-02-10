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

export const getPublicRegions = async()=>{
  
}

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
  yearRange: string,
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
      yearRange,
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
