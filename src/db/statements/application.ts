import axios from "../axios";

export const deleleteApplication = async (
  id: string,
  token: string,
  userId: string,
  lineId: string,
) => {
  const response = await axios.delete(`/application/delete`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      userId,
      id,
      lineId,
    },
  });

  if (response.status !== 200) {
    throw new Error("Failed to delete application");
  }
  return response.data;
};

export const deleteSelctedApplication = async (
  token: string,
  ids: string[],
  userId: string,
  lineId: string,
) => {
  const response = await axios.post(
    `/application/delete-selected`,
    { ids, userId, lineId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (response.status !== 200) {
    throw new Error("Failed to delete selected applications");
  }

  return response.data;
};
