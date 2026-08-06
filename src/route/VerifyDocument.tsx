import { useCallback, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import {
  verifyDocumentFile,
  lookupDocumentSerial,
  type SealLookup,
  type VerifyReport,
} from "@/db/statements/verifyDocument";
import {
  BadgeCheck,
  FileWarning,
  HelpCircle,
  Loader2,
  ShieldCheck,
  Upload,
  Search,
  FileText,
} from "lucide-react";

/**
 * Public document verifier.
 *
 * Reachable without an account — a supplier, auditor or citizen handed a
 * signed municipal document must be able to check it. The page uploads the
 * file so the server can hash it; the file is not stored.
 *
 * The three verdicts are styled very differently on purpose. TAMPERED is the
 * whole reason this page exists, so it must be impossible to mistake for a
 * pass at a glance.
 */

const fmt = (v?: string | null) =>
  v ? new Date(v).toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" }) : "—";

const kb = (n?: number) => (n ? `${(n / 1024).toFixed(0)} KB` : "—");

const VERDICT = {
  AUTHENTIC: {
    label: "Authentic",
    blurb: "This document was issued by the Municipality of Gasan and has not been altered.",
    Icon: BadgeCheck,
    ring: "border-emerald-300 bg-emerald-50",
    chip: "bg-emerald-600 text-white",
    fg: "text-emerald-900",
    icon: "text-emerald-600",
  },
  TAMPERED: {
    label: "Do not trust this file",
    blurb: "This file does not match what was issued. Treat it as altered.",
    Icon: FileWarning,
    ring: "border-rose-400 bg-rose-50",
    chip: "bg-rose-600 text-white",
    fg: "text-rose-900",
    icon: "text-rose-600",
  },
  UNKNOWN: {
    label: "Not recognised",
    blurb: "No issued document matches this file.",
    Icon: HelpCircle,
    ring: "border-amber-300 bg-amber-50",
    chip: "bg-amber-500 text-white",
    fg: "text-amber-900",
    icon: "text-amber-600",
  },
} as const;

const VerifyDocument = () => {
  const [params] = useSearchParams();
  const [report, setReport] = useState<VerifyReport | null>(null);
  const [lookup, setLookup] = useState<SealLookup | null>(null);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [serial, setSerial] = useState(params.get("serial") ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  const run = useCallback(async (file: File) => {
    setBusy(true);
    setError(null);
    setReport(null);
    setLookup(null);
    setPct(0);
    try {
      setReport(await verifyDocumentFile(file, setPct));
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(
        err.response?.data?.message ??
          "Could not check that file. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) run(f);
  };

  const checkSerial = async () => {
    const s = serial.trim();
    if (!s) return;
    setBusy(true);
    setError(null);
    setReport(null);
    setLookup(null);
    try {
      setLookup(await lookupDocumentSerial(s));
    } catch {
      setError("Could not look up that serial.");
    } finally {
      setBusy(false);
    }
  };

  const v = report ? VERDICT[report.verdict] : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 leading-tight">
              Verify a signed document
            </h1>
            <p className="text-xs text-gray-500">
              Municipality of Gasan, Marinduque
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-3 mb-6">
          Upload a signed PDF issued by the Municipality to check whether it is
          genuine and unaltered. Your file is only used to compute a
          fingerprint — it is not stored.
        </p>

        {/* ── Drop zone ──────────────────────────────────────────────── */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition ${
            dragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-white hover:border-blue-400"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) run(f);
              e.target.value = "";
            }}
          />
          {busy ? (
            <div className="flex flex-col items-center gap-2 text-gray-600">
              <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
              <p className="text-sm">Checking the document… {pct > 0 ? `${pct}%` : ""}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-7 w-7 text-gray-400" />
              <p className="text-sm font-medium text-gray-800">
                Drop the PDF here, or click to choose
              </p>
              <p className="text-xs text-gray-500">Maximum 40 MB</p>
            </div>
          )}
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {/* ── Verdict ────────────────────────────────────────────────── */}
        {report && v ? (
          <div className={`mt-6 rounded-xl border-2 p-5 ${v.ring}`}>
            <div className="flex items-start gap-3">
              <v.Icon className={`h-8 w-8 shrink-0 ${v.icon}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${v.chip}`}
                  >
                    {v.label}
                  </span>
                  {report.serial ? (
                    <span className="font-mono text-xs text-gray-600">
                      {report.serial}
                    </span>
                  ) : null}
                </div>
                <p className={`mt-2 text-sm font-medium ${v.fg}`}>{v.blurb}</p>
                <p className="mt-1 text-xs text-gray-600">{report.message}</p>
              </div>
            </div>

            {/* Chain problems — a file can be byte-perfect yet have a broken
                signature chain, so these are called out separately. */}
            {report.chain && report.chain.problems.length > 0 ? (
              <ul className="mt-4 space-y-1 rounded-md bg-white/70 p-3">
                {report.chain.problems.map((p, i) => (
                  <li key={i} className="text-xs text-rose-800">
                    • {p}
                  </li>
                ))}
              </ul>
            ) : null}

            {report.verdict === "AUTHENTIC" || report.verdict === "TAMPERED" ? (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Document" value={report.documentTitle ?? "—"} />
                <Field label="Issued" value={fmt(report.issuedAt)} />
                <Field label="Size at issue" value={kb(report.byteSize)} />
                <Field
                  label="Signatures"
                  value={
                    report.chain
                      ? `${report.chain.valid} of ${report.chain.total} verified`
                      : "—"
                  }
                />
              </div>
            ) : null}

            {report.signers?.length ? (
              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                  Signed by
                </p>
                <div className="rounded-md border bg-white divide-y">
                  {report.signers.map((s) => (
                    <div key={s.userId + s.slot} className="flex items-center justify-between gap-3 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm text-gray-900 truncate">{s.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {s.position ?? "—"}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 shrink-0">
                        {fmt(s.signedAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <details className="mt-4">
              <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                Technical fingerprint
              </summary>
              <p className="mt-1.5 break-all rounded bg-white/70 p-2 font-mono text-[11px] text-gray-600">
                SHA-256 {report.sha256}
              </p>
            </details>
          </div>
        ) : null}

        {/* ── Serial lookup ──────────────────────────────────────────── */}
        <div className="mt-10 rounded-xl border bg-white p-5">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">
              Look up by serial
            </h2>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            The code printed at the bottom of a signed document. This shows what
            was issued — it cannot tell you whether the copy in your hand was
            altered. For that, upload the file above.
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              value={serial}
              onChange={(e) => setSerial(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && checkSerial()}
              placeholder="GSN-XXXX-XXXX-XXXX"
              className="flex-1 min-w-[220px] rounded-md border px-3 py-2 font-mono text-sm outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={checkSerial}
              disabled={busy || !serial.trim()}
              className="inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
              Look up
            </button>
          </div>

          {lookup ? (
            lookup.found ? (
              <div className="mt-4 rounded-lg border bg-slate-50 p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Document" value={lookup.documentTitle ?? "—"} />
                  <Field label="Issued" value={fmt(lookup.issuedAt)} />
                  <Field label="Size at issue" value={kb(lookup.byteSize)} />
                  <Field
                    label="Signatures"
                    value={
                      lookup.chain
                        ? `${lookup.chain.valid} of ${lookup.chain.total} verified`
                        : "—"
                    }
                  />
                </div>
                {lookup.notice ? (
                  <p className="mt-3 rounded bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    {lookup.notice}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {lookup.message ?? "No document was issued under that serial."}
              </p>
            )
          ) : null}
        </div>

        <p className="mt-8 text-center text-[11px] text-gray-400">
          Republic of the Philippines · Province of Marinduque · Municipality of
          Gasan
        </p>
      </div>
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
      {label}
    </p>
    <p className="text-sm text-gray-900 break-words">{value}</p>
  </div>
);

export default VerifyDocument;
