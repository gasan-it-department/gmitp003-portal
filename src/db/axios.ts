import axiosInstance from "axios";
//VITE_FORWARDED_URL VITE_SERVER_URL
export const frontendUrl = import.meta.env.VITE_FRONTEND_URL;
export const forwardedUrl = import.meta.env.VITE_FORWARDED_URL;
export const getUrl = () => {
  const url = import.meta.env.VITE_SERVER_URL;
  const domain = import.meta.env.VITE_DOMAIN;
  const status = import.meta.env.VITE_STATUS;

  if (status === 1 && domain) {
    return domain;
  } else if (status === 2 && forwardedUrl) {
    return forwardedUrl;
  }
  return url;
};

export const url = import.meta.env.VITE_SERVER_URL;
const axios = axiosInstance.create({
  baseURL: getUrl(),
  withCredentials: true,
  timeout: 30000,
});

export default axios;
