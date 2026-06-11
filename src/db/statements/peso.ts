import axios from "../axios";

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  Accept: "application/json",
  "X-Requested-With": "XMLHttpRequest",
});

export interface PesoJobPayload {
  id?: string;
  userId: string;
  lineId: string;
  jobTitle?: string;
  employerName?: string;
  location?: string;
  employmentType?: string;
  salaryText?: string;
  desc?: string;
  deadline?: string | null;
  slot?: number;
  showApplicationCount?: boolean;
  applyMode?: string;
  applyUrl?: string;
  contactInfo?: string;
  status?: number;
}

/** Create a PESO external job post (draft). Returns the new job id. */
export const createPesoJob = async (token: string, payload: PesoJobPayload) => {
  const response = await axios.post("/peso/job/create", payload, {
    headers: authHeaders(token),
  });
  if (response.status !== 200) throw new Error(response.data?.message);
  return response.data as { message: string; id: string };
};

/** Patch a PESO post (fields and/or status). */
export const updatePesoJob = async (
  token: string,
  payload: PesoJobPayload & { id: string },
) => {
  const response = await axios.patch("/peso/job/update", payload, {
    headers: authHeaders(token),
  });
  if (response.status !== 200) throw new Error(response.data?.message);
  return response.data;
};

/** Paginated list of a line's PESO posts (management view). */
export const pesoJobList = async (
  token: string,
  lineId: string,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/peso/job/list", {
    headers: authHeaders(token),
    params: { id: lineId, lastCursor, limit, query },
  });
  if (response.status !== 200) throw new Error(response.data?.message);
  return response.data;
};

/** Single PESO post (edit form). */
export const pesoJobData = async (token: string, id: string) => {
  const response = await axios.get("/peso/job/data", {
    headers: authHeaders(token),
    params: { id },
  });
  if (response.status !== 200) throw new Error(response.data?.message);
  return response.data;
};
