export const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
};

export const setCookie = (name: string, value: string, days: number) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 1 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;domain=${
    window.location.hostname
  };${window.location.protocol === "https:" ? "secure;" : ""}`;
};
export const removeCookie = (name: string) => {
  // Use the exact same parameters as setCookie, but with expired date
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${
    window.location.hostname
  };${window.location.protocol === "https:" ? "secure;" : ""}`;
};
