import axios from "../axios";

const jsonHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  Accept: "application/json",
  "X-Requested-With": "XMLHttpRequest",
});

// ─── Types ─────────────────────────────────────────────────────────
export interface LeaveCatalogueItem {
  key: string;
  label: string;
  withPay: boolean;
  defaultCredits: number;
}

export interface LeaveItem {
  id: string;
  userId: string;
  lineId: string | null;
  category: string;
  withPay: boolean;
  days: number;
  startDate: string;
  endDate: string;
  reason?: string | null;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  status: "pending" | "approved" | "denied" | "cancelled";
  approverId?: string | null;
  decidedAt?: string | null;
  decisionRemark?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    Position?: { name?: string | null } | null;
  };
  approver?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}

export interface LeaveCreditRow {
  category: string;
  label: string;
  withPay: boolean;
  accrued: number;
  used: number;
  balance: number;
}

export interface LedgerRow {
  id: string;
  category: string;
  year: number;
  delta: number;
  kind: string;
  note?: string | null;
  at: string;
  by?: { id: string; firstName?: string | null; lastName?: string | null } | null;
  leave?: { id: string; category: string } | null;
}

// ─── Leave ─────────────────────────────────────────────────────────
export const leaveCatalogue = async (token: string) => {
  const res = await axios.get("/leave/catalogue", { headers: jsonHeaders(token) });
  return res.data as { list: LeaveCatalogueItem[] };
};

export const applyLeave = async (
  token: string,
  body: {
    userId: string;
    lineId: string;
    category: string;
    startDate: string;
    endDate: string;
    reason?: string;
    attachmentUrl?: string;
    attachmentType?: string;
    withPay?: boolean;
  },
) => {
  const res = await axios.post("/leave/apply", body, { headers: jsonHeaders(token) });
  return res.data as { message: string; leave: LeaveItem };
};

export const listLeaves = async (
  token: string,
  params: {
    userId?: string;
    lineId?: string;
    status?: string;
    category?: string;
    lastCursor?: string | null;
    limit?: string;
  },
) => {
  const res = await axios.get("/leave/list", {
    headers: jsonHeaders(token),
    params: {
      ...params,
      ...(params.lastCursor ? { lastCursor: params.lastCursor } : {}),
    },
  });
  return res.data as {
    list: LeaveItem[];
    lastCursor: string | null;
    hasMore: boolean;
  };
};

export const decideLeave = async (
  token: string,
  body: {
    leaveId: string;
    approverId: string;
    decision: "approved" | "denied";
    remark?: string;
  },
) => {
  const res = await axios.patch("/leave/decide", body, {
    headers: jsonHeaders(token),
  });
  return res.data;
};

export const cancelLeave = async (
  token: string,
  body: { leaveId: string; userId: string },
) => {
  const res = await axios.patch("/leave/cancel", body, {
    headers: jsonHeaders(token),
  });
  return res.data;
};

export const listLeaveCredits = async (
  token: string,
  userId: string,
  year?: number,
) => {
  const res = await axios.get("/leave/credits", {
    headers: jsonHeaders(token),
    params: { userId, year },
  });
  return res.data as { year: number; list: LeaveCreditRow[] };
};

export const adjustLeaveCredit = async (
  token: string,
  body: {
    userId: string;
    category: string;
    delta: number;
    note?: string;
    byUserId: string;
    year?: number;
  },
) => {
  const res = await axios.patch("/leave/credits/adjust", body, {
    headers: jsonHeaders(token),
  });
  return res.data;
};

export const listLeaveLedger = async (
  token: string,
  userId: string,
  year?: number,
) => {
  const res = await axios.get("/leave/credits/ledger", {
    headers: jsonHeaders(token),
    params: { userId, year },
  });
  return res.data as { year: number; list: LedgerRow[] };
};

// ─── Payroll ───────────────────────────────────────────────────────
export interface PayrollPeriodRow {
  id: string;
  lineId: string;
  label: string;
  periodStart: string;
  periodEnd: string;
  status: "draft" | "computed" | "released";
  computedAt?: string | null;
  releasedAt?: string | null;
  createdAt: string;
  _count?: { payslips: number };
  createdBy?: { id: string; firstName?: string | null; lastName?: string | null } | null;
}

export interface PayslipRow {
  id: string;
  userId: string;
  periodId: string;
  basicMonthly: number;
  workingDays: number;
  daysAbsent: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  grossPay: number;
  sssEE: number;
  philhealthEE: number;
  pagibigEE: number;
  withholdingTax: number;
  otherDeductions: number;
  netPay: number;
  breakdown?: Record<string, any> | null;
  status: string;
  computedAt: string;
  releasedAt?: string | null;
  user?: { id: string; firstName?: string | null; lastName?: string | null };
  salaryGrade?: { grade: number; amount: number } | null;
  period?: { label: string; periodStart: string; periodEnd: string };
}

export const listPayrollPeriods = async (
  token: string,
  params: {
    lineId: string;
    status?: string;
    lastCursor?: string | null;
    limit?: string;
  },
) => {
  const res = await axios.get("/payroll/periods", {
    headers: jsonHeaders(token),
    params: { ...params, ...(params.lastCursor ? { lastCursor: params.lastCursor } : {}) },
  });
  return res.data as {
    list: PayrollPeriodRow[];
    lastCursor: string | null;
    hasMore: boolean;
  };
};

export const createPayrollPeriod = async (
  token: string,
  body: {
    lineId: string;
    label: string;
    periodStart: string;
    periodEnd: string;
    userId: string;
  },
) => {
  const res = await axios.post("/payroll/periods/create", body, {
    headers: jsonHeaders(token),
  });
  return res.data;
};

export const removePayrollPeriod = async (token: string, id: string) => {
  const res = await axios.delete("/payroll/periods/remove", {
    headers: jsonHeaders(token),
    params: { id },
  });
  return res.data;
};

export const computePayrollPeriod = async (token: string, periodId: string) => {
  const res = await axios.post(
    "/payroll/periods/compute",
    { periodId },
    { headers: jsonHeaders(token) },
  );
  return res.data as { message: string; computed: number };
};

export const releasePayrollPeriod = async (token: string, periodId: string) => {
  const res = await axios.patch(
    "/payroll/periods/release",
    { periodId },
    { headers: jsonHeaders(token) },
  );
  return res.data;
};

export const listPayslips = async (
  token: string,
  params: {
    periodId?: string;
    userId?: string;
    lineId?: string;
    lastCursor?: string | null;
    limit?: string;
  },
) => {
  const res = await axios.get("/payroll/payslips", {
    headers: jsonHeaders(token),
    params: { ...params, ...(params.lastCursor ? { lastCursor: params.lastCursor } : {}) },
  });
  return res.data as {
    list: PayslipRow[];
    lastCursor: string | null;
    hasMore: boolean;
  };
};

export const getPayslip = async (token: string, id: string) => {
  const res = await axios.get("/payroll/payslip", {
    headers: jsonHeaders(token),
    params: { id },
  });
  return res.data as PayslipRow;
};

export interface DeductionRow {
  id: string;
  userId: string;
  lineId: string;
  periodId?: string | null;
  label: string;
  amount: number;
  recurring: boolean;
  createdAt: string;
  user?: { firstName?: string | null; lastName?: string | null };
}

export const listDeductions = async (
  token: string,
  params: { userId?: string; lineId?: string },
) => {
  const res = await axios.get("/payroll/deductions", {
    headers: jsonHeaders(token),
    params,
  });
  return res.data as { list: DeductionRow[] };
};

export const upsertDeduction = async (
  token: string,
  body: {
    id?: string;
    userId: string;
    lineId: string;
    label: string;
    amount: number;
    recurring?: boolean;
    periodId?: string;
  },
) => {
  const res = await axios.post("/payroll/deductions/upsert", body, {
    headers: jsonHeaders(token),
  });
  return res.data;
};

export const removeDeduction = async (token: string, id: string) => {
  const res = await axios.delete("/payroll/deductions/remove", {
    headers: jsonHeaders(token),
    params: { id },
  });
  return res.data;
};

export interface LineUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  Position?: { name?: string | null } | null;
  SalaryGrade?: { grade: number; amount: number } | null;
}

export const listLineUsers = async (
  token: string,
  lineId: string,
  query: string,
) => {
  const res = await axios.get("/leave/line-users", {
    headers: jsonHeaders(token),
    params: { lineId, query },
  });
  return res.data as { list: LineUser[] };
};
