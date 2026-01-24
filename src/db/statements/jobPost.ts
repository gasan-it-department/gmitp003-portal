import axios from "../axios";

export const updatePostedJobStatus = async (
  token: string,
  id: string,
  userId: string,
  lineId: string,
  status: number,
) => {
  const response = await axios.patch(
    "/application/post/update/status",
    { id, userId, lineId, status },
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
