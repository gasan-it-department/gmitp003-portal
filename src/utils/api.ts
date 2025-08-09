export const handleHeader = (token: string) => {
  const header = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
    "Cache-Control": "no-cache, no-store, must-revalidate",
  };

  return header;
};

export const header = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "X-Requested-With": "XMLHttpRequest",
  "Cache-Control": "no-cache, no-store, must-revalidate",
};
