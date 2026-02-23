import axios from "../axios";

export const viewUserNotification = async (
  token: string,
  id: string,
  userId: string,
) => {
  const response = await axios.patch(
    "/notification/view",
    {
      id,
      userId,
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

  if (response.status !== 200) throw new Error(response.data.message);
  return response.data;
};

export const masrkNotificationsAsRead = async (
  token: string,
  userId: string,
  id: string,
) => {
  const response = await axios.patch(
    "/notification/mark-as-read",
    {
      userId,
      id,
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
  if (response.status !== 200) throw new Error(response.data.message);
  return response.data;
};
