import axios from "../axios";
export const getPSGSRegions = async () => {
  try {
    const response = await fetch(`https://psgc.gitlab.io/api/regions/`);
    const data = await response.json();
    return data;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : String(err));
  }
};
