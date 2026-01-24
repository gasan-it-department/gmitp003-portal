import axiosInstance from "axios";
//VITE_FORWARDED_URL VITE_SERVER_URL
export const frontendUrl = import.meta.env.VITE_FRONTEND_URL;
export const forwardedUrl = import.meta.env.VITE_FORWARDED_URL;
export const url = import.meta.env.VITE_SERVER_URL;
const axios = axiosInstance.create({
  baseURL: import.meta.env.VITE_SERVER_URL,
  withCredentials: true,
  timeout: 30000,
});

export default axios;
