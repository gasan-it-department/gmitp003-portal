import axios from "../axios";

export const getUserData = async (
  token: string,
  userProfileId: string,
  userId: string,
) => {
  const response = await axios.get("/user/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    params: {
      userProfileId,
      userId,
    },
  });

  if (response.status !== 200) throw new Error(response.data.message);
  return response.data;
};

// Upload/replace the user's profile picture (multipart). Returns the new URL.
export const updateProfilePicture = async (
  token: string,
  userId: string,
  file: Blob,
) => {
  const form = new FormData();
  form.append("userId", userId);
  form.append("file", file, "avatar.jpg");
  const response = await axios.post("/user/profile-picture", form, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  if (response.status !== 200) throw new Error("Upload failed");
  return response.data as { file_url: string };
};

export const searchLineUser = async (
  token: string,
  id: string,
  query: string,
  lastCursor: string | null,
  limit: string,
) => {
  const response = await axios.get("/users/search", {
    params: {
      id,
      query,
      lastCursor,
      limit,
    },
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
  if (response.status !== 200) {
    throw new Error(`${response.data.message}`);
  }
  return response.data;
};

export const removeUser = async (
  token: string,
  id: string,
  userId: string,
  lineId: string,
) => {
  const response = await axios.delete("/user/delete", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
    params: {
      id,
      userId,
      lineId,
    },
  });

  if (response.status !== 200) {
    throw new Error(response.data);
  }
  return response.data;
};
