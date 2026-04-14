import type { Dispatch, SetStateAction } from "react";

export const copyToClipboard = async (
  text: string,
  setCopied: Dispatch<SetStateAction<boolean>>,
) => {
  try {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch (error) {
    throw error;
  }
};
