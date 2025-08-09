import axiosInstance from "axios";

const axios = axiosInstance.create({
  baseURL: import.meta.env.VITE_SERVER_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true, // Include cookies in requests
});

export default axios;
