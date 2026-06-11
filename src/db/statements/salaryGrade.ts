import axios from "../axios";

export const lineSGlist = async (
  token: string,
  id: string | undefined,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const resposne = await axios.get("/salary-grade/list", {
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

/** Header summary for the salary-grade detail page. */
export const salaryGradeInfo = async (token: string, id: string) => {
  const response = await axios.get("/salary-grade/info", {
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

/** Paginated value-change history for a salary grade. */
export const salaryGradeHistory = async (
  token: string,
  id: string,
  lastCursor: string | null,
  limit: string,
) => {
  const response = await axios.get("/salary-grade/history", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: { id, lastCursor, limit },
  });
  if (response.status !== 200) throw new Error(response.data?.message);
  return response.data;
};

/** Paginated users assigned to a salary grade (optional search). */
export const salaryGradeUsers = async (
  token: string,
  id: string,
  lastCursor: string | null,
  limit: string,
  query: string,
) => {
  const response = await axios.get("/salary-grade/users", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: { id, lastCursor, limit, query },
  });
  if (response.status !== 200) throw new Error(response.data?.message);
  return response.data;
};

export const updateSalaryGrade = async (
  token: string,
  id: string,
  amount: number,
) => {
  const response = await axios.patch(
    "/salary-grade/update",
    {
      id,
      amount,
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
