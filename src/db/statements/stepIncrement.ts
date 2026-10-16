import axios from "../axios";

/*
  Step increments: one step for every three years of satisfactory service.

  Nothing here grants anything. `propose` raises a proposal and `decide`
  records HR's answer to it — the two are separate calls on purpose,
  because a step increment issues a Notice of Step Increment and is a
  decision a person has to make.
*/

const head = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  Accept: "application/json",
  "X-Requested-With": "XMLHttpRequest",
});

export interface StepCandidate {
  userId: string;
  name: string;
  currentStep: number;
  grade: number | null;
  originalAppointmentDate: string | null;
  presentPositionDate: string | null;
  stepEffectiveDate: string | null;
  reckonedFrom: string | null;
  dueOn: string | null;
  lwopDays: number;
  blockers: string[];
  notes: string[];
}

export interface StepDueResponse {
  asOf: string;
  rules: { yearsPerStep: number; maxLwopDays: number; note: string };
  due: StepCandidate[];
  others: StepCandidate[];
}

export interface StepIncrementRecord {
  id: string;
  userId: string;
  fromStep: number;
  toStep: number;
  basis: string;
  effectiveDate: string;
  serviceFrom: string;
  serviceTo: string;
  lwopDays: number;
  status: string;
  certifiedSatisfactory: boolean;
  nosiNumber: string | null;
  note: string | null;
  proposedAt: string;
  decidedAt: string | null;
  user?: { firstName: string | null; lastName: string | null };
  decidedBy?: { firstName: string | null; lastName: string | null } | null;
}

/** Everyone in the line, due or not, with the reasons either way. */
export const stepIncrementsDue = async (
  token: string,
  lineId: string,
  asOf?: string,
): Promise<StepDueResponse> => {
  const response = await axios.get("/hr/step-increments/due", {
    headers: head(token),
    params: { lineId, ...(asOf ? { asOf } : {}) },
  });
  if (response.status !== 200) throw new Error(response.data?.message);
  return response.data;
};

/** The record — proposals and decisions — for one person or the whole line. */
export const stepIncrementList = async (
  token: string,
  lineId: string,
  userId?: string,
  status?: string,
): Promise<{ list: StepIncrementRecord[] }> => {
  const response = await axios.get("/hr/step-increments", {
    headers: head(token),
    params: { lineId, ...(userId ? { userId } : {}), ...(status ? { status } : {}) },
  });
  if (response.status !== 200) throw new Error(response.data?.message);
  return response.data;
};

/** Raise proposals. Omit `userIds` to propose for everyone who is due. */
export const proposeStepIncrements = async (
  token: string,
  lineId: string,
  userIds?: string[],
  asOf?: string,
): Promise<{ proposed: number; skipped: Array<{ userId: string; why: string }> }> => {
  const response = await axios.post(
    "/hr/step-increments/propose",
    { lineId, ...(userIds?.length ? { userIds } : {}), ...(asOf ? { asOf } : {}) },
    { headers: head(token) },
  );
  if (response.status !== 200) throw new Error(response.data?.message);
  return response.data;
};

export const decideStepIncrement = async (
  token: string,
  body: {
    lineId: string;
    id: string;
    action: "approve" | "reject";
    certifiedSatisfactory?: boolean;
    nosiNumber?: string;
    note?: string;
  },
) => {
  const response = await axios.post("/hr/step-increments/decide", body, {
    headers: head(token),
  });
  if (response.status !== 200) throw new Error(response.data?.message);
  return response.data;
};

/**
 * Record the dates the arithmetic needs, and the step the person already
 * holds. A key left out is left alone; an empty string clears it.
 */
export const setServiceRecord = async (
  token: string,
  body: {
    lineId: string;
    userId: string;
    originalAppointmentDate?: string;
    presentPositionDate?: string;
    stepEffectiveDate?: string;
    step?: number | string;
  },
) => {
  const response = await axios.post("/hr/step-increments/service-record", body, {
    headers: head(token),
  });
  if (response.status !== 200) throw new Error(response.data?.message);
  return response.data;
};
