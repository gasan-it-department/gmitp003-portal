import axios from "../axios";

export const humanResourcesDashboard = async (
  token: string,
  lineId: string
) => {
  const response = await axios.get("/dashboard/human-resources", {
    params: {
      lineId,
    },
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }
  return response.data;
};
