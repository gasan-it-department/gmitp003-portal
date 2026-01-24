import axios from "../axios";

export const sendResetLink = async (
  token: string,
  userId: string,
  accountId: string,
  lineId: string
) => {
  const response = await axios.post(
    "/account/send-reset-link",
    {
      userId,
      accountId,
      lineId,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    }
  );

  if (response.status !== 200) throw new Error(response.data.message);
  return response.data;
};
