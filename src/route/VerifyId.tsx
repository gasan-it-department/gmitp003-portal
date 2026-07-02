import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { verifyIdCode } from "@/db/statement";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Loader2,
  Building2,
} from "lucide-react";

type Result = Awaited<ReturnType<typeof verifyIdCode>>;

const VerifyId = () => {
  const [params] = useSearchParams();
  const code = params.get("code") || "";
  const [data, setData] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let on = true;
    if (!code) {
      setLoading(false);
      setError(true);
      return;
    }
    verifyIdCode(code)
      .then((r) => on && setData(r))
      .catch(() => on && setError(true))
      .finally(() => on && setLoading(false));
    return () => {
      on = false;
    };
  }, [code]);

  const valid = data?.found && data?.valid;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border overflow-hidden">
        {/* Status band */}
        <div
          className={
            "px-5 py-4 flex items-center gap-3 text-white " +
            (loading
              ? "bg-slate-400"
              : valid
                ? "bg-emerald-600"
                : "bg-red-600")
          }
        >
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : valid ? (
            <ShieldCheck className="h-7 w-7" />
          ) : data?.found ? (
            <ShieldAlert className="h-7 w-7" />
          ) : (
            <ShieldX className="h-7 w-7" />
          )}
          <div>
            <p className="text-sm font-semibold leading-tight">
              {loading
                ? "Verifying…"
                : valid
                  ? "Valid ID"
                  : data?.found
                    ? "Not currently active"
                    : "ID not found"}
            </p>
            <p className="text-[11px] opacity-90 leading-tight">
              {loading
                ? "Checking against records"
                : valid
                  ? "This ID belongs to an active employee"
                  : data?.found
                    ? "Account is archived or disabled"
                    : "This code doesn't match any record"}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          {loading ? (
            <div className="h-24 flex items-center justify-center text-slate-300">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : error || !data?.found ? (
            <p className="text-sm text-slate-500 text-center py-6">
              {error
                ? "Couldn't verify this ID right now."
                : "No employee is associated with this ID."}
            </p>
          ) : (
            <div className="flex items-center gap-4">
              {data.photoUrl ? (
                <img
                  src={data.photoUrl}
                  alt={data.fullName}
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-slate-100 flex-none"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-lg font-semibold flex-none">
                  {(data.fullName?.[0] ?? "?").toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-base font-semibold text-slate-900 leading-tight">
                  {data.fullName}
                </p>
                {data.position && (
                  <p className="text-xs text-slate-600 mt-0.5">
                    {data.position}
                  </p>
                )}
                {data.department && (
                  <p className="text-[11px] text-slate-500 mt-1 inline-flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {data.department}
                  </p>
                )}
                <span
                  className={
                    "mt-2 inline-block text-[10px] font-medium px-2 py-0.5 rounded-full " +
                    (valid
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200")
                  }
                >
                  {data.status}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t bg-slate-50 text-center">
          <p className="text-[10px] text-slate-400">
            {data?.line ? `${data.line} · ` : ""}Official ID verification
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyId;
