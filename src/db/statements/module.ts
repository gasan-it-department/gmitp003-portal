import axios from "../axios";

export const removeModuleAccess = async (
  token: string,
  id: string,
  userId: string,
  module: string,
  lineId: string
) => {
  await axios.patch(
    "/module/remove-access",
    { id, userId, module, lineId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    }
  );
};

export const updateModuleAccess = async (
  token: string,
  id: string,
  userId: string,
  module: string,
  lineId: string,
  status: number | undefined,
  privilege: number | undefined
) => {
  const response = await axios.patch(
    "/module/update-access",
    { id, userId, module, lineId, status, privilege },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    }
  );
  if (response.status !== 200) throw new Error(response.data);
  return response.data;
};
