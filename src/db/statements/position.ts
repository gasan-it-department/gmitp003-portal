import axios from "../axios";

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
    throw new Error(response.data);
  }
  return response.data;
};

export const positionUserHistory = async (token: string, id: string) => {
  const response = await axios.get("/position/user/records", {
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

export const positionSalarayGradeHistory = async (
  token: string,
  id: string,
) => {
  const response = await axios.get("/position/user/records", {
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

export const checkPositionInvitation = async (inviteId: string) => {
  const response = await axios.get("/position/check-invitation", {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",

      "X-Requested-With": "XMLHttpRequest",
    },
    params: {
      id: inviteId,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }

  return response.data;
};

export const updateUnitPosition = async (
  token: string,
  payload: {
    unitPositionId: string;
    title?: string;
    designation?: string | null;
    itemNumber?: string | null;
    salaryGradeId?: string | null;
    plantilla?: boolean;
    fixToUnit?: boolean;
    slots?: number;
    occupied?: number;
    lineId: string;
    userId?: string;
  },
) => {
  const response = await axios.patch("/position/unit/update", payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  if (response.status !== 200) throw new Error("Failed to update position");
  return response.data;
};

export const positionRecords = async (token: string, id: string) => {
  const response = await axios.get("/position/records", {
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

export const positionApplication = async (
  token: string,
  id: string,
  lastCursor: string,
  limit: string,
) => {
  const response = await axios.get("/position/applications", {
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

export const unitPositionHistory = async (
  token: string,
  id: string,
  lastCursor: string | null,
  limit: string,
) => {
  const response = await axios.get("/position/history", {
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

export const removePosition = async (
  token: string,
  id: string,
  lineId: string,
  userId: string,
) => {
  const response = await axios.delete("/position/remove", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: {
      id,
      lineId,
      userId,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }
  return response.data;
};

/**
 * List Fill Position invitations for a unitPosition (or a single slot).
 *  - status = "active" (default) → pending + not expired
 *  - status = "all"               → full history (cancelled, expired, accepted)
 */
export interface PositionInvitationRow {
  id: string;
  email: string;
  message: string | null;
  timestamp: string;
  expiresAt: string | null;
  concluded: boolean;
  concludedAt: string | null;
  concludedReason: string | null;
  positionSlotId: string | null;
  slot: {
    id: string;
    occupied: boolean;
    salaryGrade: { grade: number } | null;
  } | null;
  submittedApplicationId: string | null;
  /** Server-side derived. */
  status: "pending" | "expired" | "cancelled" | "accepted" | string;
  isExpired: boolean;
}

export const listPositionInvitations = async (
  token: string,
  params: {
    unitPositionId?: string;
    slotId?: string;
    status?: "active" | "all";
  },
) => {
  const response = await axios.get<{ list: PositionInvitationRow[] }>(
    "/position/invitations",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      params,
    },
  );
  if (response.status !== 200) throw new Error("Failed to load invitations");
  return response.data.list;
};

export const inviteFromApplication = async (
  token: string,
  payload: {
    applicationId: string;
    slotId: string;
    unitPositionId: string;
    userId: string;
    lineId: string;
    message?: string | null;
    // Provisional hiring (optional): employment type + contract end date.
    empType?: string | null;
    term?: string | null;
  },
) => {
  const response = await axios.post<{
    message: string;
    invitation: {
      id: string;
      email: string;
      expiresAt: string | null;
      slotId: string | null;
      applicantName: string;
    };
  }>("/position/invitation/from-application", payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  if (response.status !== 200) {
    throw new Error("Failed to send invitation from application");
  }
  return response.data;
};

export const cancelPositionInvitation = async (
  token: string,
  payload: { id: string; userId: string; lineId: string },
) => {
  const response = await axios.post<{ ok: boolean; id: string }>(
    "/position/invitation/cancel",
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    },
  );
  if (response.status !== 200) throw new Error("Failed to cancel invitation");
  return response.data;
};

/**
 * Vacate an occupied position slot. POST (the old version was a GET that
 * sent an undefined `status` param and never hit a registered route).
 *
 *   slotId  — the slot to free up
 *   userId  — the HR user performing the action (audit trail)
 *   lineId  — scope guard
 *   action  — 0 "Remove User" (unassign) | 1 "Disable Access" (also suspend)
 */
export const vacantPosition = async (
  token: string,
  payload: {
    slotId: string;
    lineId: string;
    userId: string;
    action: number;
  },
) => {
  const response = await axios.post<{ message: string }>(
    "/position/vacant",
    payload,
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
    throw new Error("Failed to vacate slot");
  }
  return response.data;
};
