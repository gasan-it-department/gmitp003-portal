import axios from "../axios";

/**
 * Public document verification. No Authorization header on purpose — the whole
 * point is that a recipient outside the LGU can check a document they were
 * handed without an account.
 */

export type Verdict = "AUTHENTIC" | "TAMPERED" | "UNKNOWN";

export interface SealSigner {
  slot: number;
  userId: string;
  name: string;
  position: string | null;
  signedAt: string;
}

export interface ChainReport {
  total: number;
  valid: number;
  intact: boolean;
  problems: string[];
}

export interface VerifyReport {
  verdict: Verdict;
  message: string;
  sha256: string;
  serial?: string;
  documentTitle?: string | null;
  issuedAt?: string;
  byteSize?: number;
  signers?: SealSigner[];
  chain?: ChainReport;
  filename?: string | null;
}

/** Uploads the file and returns the verdict. The file never leaves this
 *  request — the server hashes it and does not store it. */
export const verifyDocumentFile = async (
  file: File,
  onProgress?: (pct: number) => void,
) => {
  const form = new FormData();
  form.append("file", file);
  const res = await axios.post<VerifyReport>("/document/verify-file", form, {
    headers: { "X-Requested-With": "XMLHttpRequest" },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
  return res.data;
};

export interface SealLookup {
  found: boolean;
  message?: string;
  serial?: string;
  documentTitle?: string | null;
  issuedAt?: string;
  sha256?: string;
  byteSize?: number;
  signers?: SealSigner[];
  chain?: ChainReport;
  notice?: string;
}

export const lookupDocumentSerial = async (serial: string) => {
  const res = await axios.get<SealLookup>(
    `/document/verify-seal/${encodeURIComponent(serial)}`,
    {
      headers: { "X-Requested-With": "XMLHttpRequest" },
      validateStatus: (s) => s === 200 || s === 404,
    },
  );
  return res.data;
};
