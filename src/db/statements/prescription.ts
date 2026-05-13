import axios from "../axios";

interface CreatePrescriptionData {
  lineId: string;
  userId: string;
  firstname: string;
  lastname: string;
  birthday?: string;
  phoneNumber?: string;
  email?: string;
  barangayId?: string;
  municipalId?: string;
  provinceId?: string;
  street?: string;
  desc?: string;
  patientId?: string;
  prescribeMed: { medId: string; comment: string; quantity: string }[];
}

const headers = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  Accept: "application/json",
  "X-Requested-With": "XMLHttpRequest",
  "Cache-Control": "no-cache, no-store, must-revalidate",
});

export const createPrescription = async (
  token: string,
  data: CreatePrescriptionData,
) => {
  const response = await axios.post("/prescription/new", data, {
    headers: headers(token),
  });
  if (response.status !== 200) throw new Error(response.data?.message ?? "Failed to create prescription");
  return response.data as { message: string; refNumber: string; response: { id: string; refNumber: string; firstname: string; lastname: string; timestamp: string } };
};

export const prescribeTransaction = async (
  token: string,
  lineId: string,
  lastCursor: string | null,
  limit: string,
  query?: string,
) => {
  const response = await axios.get("/prescription/transaction", {
    headers: headers(token),
    params: { id: lineId, lastCursor, limit, query },
  });
  if (response.status !== 200) throw new Error(response.data?.message ?? "Failed to fetch transactions");
  return response.data;
};

export const getPrescriptionData = async (token: string, id: string) => {
  const response = await axios.get("/prescription/data", {
    headers: headers(token),
    params: { id },
  });
  if (response.status !== 200) throw new Error(response.data?.message ?? "Failed to fetch prescription");
  return response.data;
};
