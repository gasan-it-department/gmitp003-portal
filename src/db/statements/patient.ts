import axios from "../axios";
import type { NewPatientProps, UpdatePatientProps } from "@/interface/data";

export const patientList = async (
  token: string,
  id: string,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/patient/list", {
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

export const patientData = async (token: string, id: string) => {
  const response = await axios.get("/patient/data", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: { id },
  });
  if (response.status !== 200) throw new Error(response.data.message);
  return response.data;
};

export const addPatient = async (
  token: string,
  data: NewPatientProps & { lineId: string },
) => {
  const response = await axios.post(
    "/patient/new",
    data,
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
  if (response.status !== 200) throw new Error(response.data.message);
  return response.data.data;
};

export const updatePatient = async (
  token: string,
  data: UpdatePatientProps,
) => {
  const response = await axios.patch(
    "/patient/update",
    data,
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
  if (response.status !== 200) throw new Error(response.data.message);
  return response.data.data;
};

export const patientRecordList = async (
  token: string,
  patientId: string,
  lastCursor: string | null,
  limit: string,
) => {
  const response = await axios.get("/patient/record/list", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: { patientId, lastCursor, limit },
  });
  if (response.status !== 200) throw new Error(response.data.message);
  return response.data;
};

export const patientRecordData = async (token: string, id: string) => {
  const response = await axios.get("/patient/record/data", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: { id },
  });
  if (response.status !== 200) throw new Error(response.data.message);
  return response.data;
};

export const addPatientRecord = async (
  token: string,
  data: { patientId: string; diagnose?: string },
) => {
  const response = await axios.post("/patient/record/new", data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  if (response.status !== 200) throw new Error(response.data.message);
  return response.data.data;
};

export const deletePatient = async (token: string, id: string) => {
  try {
    const response = await axios.delete("/patient/delete", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      params: { id },
    });
    if (response.status !== 200) throw new Error(response.data.message);
    return response.data;
  } catch (err: any) {
    // Surface the backend's actual error message (e.g. pending-prescription guard)
    const apiMessage = err?.response?.data?.message;
    if (apiMessage) throw new Error(apiMessage);
    throw err;
  }
};
