import { useEffect, useState } from "react";
import { useParams } from "react-router";
import axios from "@/db/axios";
import { Loader2, CheckCircle2, AlertCircle, MapPin } from "lucide-react";

interface VerifyData {
  id: string;
  slot: number;
  status: number; // 0 pending · 1 signed · 2 rejected
  signedAt: string | null;
  geo: { lat: number; lng: number; accuracy: number | null } | null;
  queue: { id: string; title: string | null; status: number } | null;
  user: {
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    position?: string | null;
  } | null;
}

// Public-facing verification page — opened when someone scans the QR
// stamped on a signed PDF. No auth required; the URL itself is the only
// thing identifying the signature record (unguessable UUID).
const Verify = () => {
  const { id } = useParams();
  const [data, setData] = useState<VerifyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    axios
      .get(`/document/verify-data/${id}`)
      .then((res) => {
        if (cancelled) return;
        setData(res.data);
      })
      .catch((e: any) => {
        if (cancelled) return;
        setError(
          e?.response?.data?.message ||
            e?.message ||
            "No record matches this verification code.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="min-h-screen w-full bg-gray-50 flex items-start justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-7 w-7 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold">
            ✓
          </div>
          <h1 className="text-base font-semibold text-gray-900">
            Signature Verification
          </h1>
        </div>

        {loading ? (
          <div className="border rounded-xl bg-white p-6 flex items-center justify-center text-xs text-gray-500">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading…
          </div>
        ) : error || !data ? (
          <div className="border rounded-xl bg-white p-6 text-center">
            <AlertCircle className="h-7 w-7 text-amber-500 mx-auto mb-2" />
            <div className="text-sm font-semibold text-gray-900">
              Not found
            </div>
            <p className="text-xs text-gray-500 mt-1">{error ?? "—"}</p>
          </div>
        ) : (
          <VerifyCard data={data} />
        )}

        <div className="text-[10px] text-gray-400 text-center mt-3">
          Verification id:{" "}
          <span className="font-mono select-all">{id}</span>
        </div>
      </div>
    </div>
  );
};

export default Verify;

const VerifyCard = ({ data }: { data: VerifyData }) => {
  const fullName =
    `${data.user?.firstName ?? ""} ${data.user?.lastName ?? ""}`.trim() ||
    data.user?.username ||
    "—";
  const signedAt = data.signedAt
    ? new Date(data.signedAt).toLocaleString(undefined, {
        weekday: "short",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
      })
    : "—";
  const isSigned = data.status === 1;

  const rows: Array<[string, React.ReactNode]> = [
    ["Signer", fullName],
    ["Position", data.user?.position ?? "—"],
    ["Document", data.queue?.title ?? "—"],
    ["Slot #", String(data.slot)],
    [
      "Status",
      isSigned ? (
        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
          <CheckCircle2 className="h-3 w-3" /> Signed
        </span>
      ) : data.status === 2 ? (
        <span className="text-rose-700 font-semibold">Rejected</span>
      ) : (
        <span className="text-amber-700 font-semibold">Pending</span>
      ),
    ],
    ["Signed at", signedAt],
    [
      "Signing location",
      data.geo ? (
        <a
          href={`https://www.google.com/maps?q=${data.geo.lat},${data.geo.lng}`}
          target="_blank"
          rel="noopener"
          className="text-blue-700 hover:underline inline-flex items-start gap-1"
        >
          <MapPin className="h-3 w-3 mt-0.5" />
          <span>
            {data.geo.lat.toFixed(6)}, {data.geo.lng.toFixed(6)}
            {data.geo.accuracy
              ? ` (±${Math.round(data.geo.accuracy)}m)`
              : ""}
            <br />
            <span className="text-[10px] text-gray-500">
              Open in Google Maps ↗
            </span>
          </span>
        </a>
      ) : (
        <span className="text-gray-500 italic">Not captured</span>
      ),
    ],
  ];

  return (
    <div className="border rounded-xl bg-white overflow-hidden">
      <div
        className={`px-3 py-2 text-xs font-semibold ${
          isSigned
            ? "bg-emerald-50 text-emerald-700 border-b border-emerald-200"
            : "bg-amber-50 text-amber-700 border-b border-amber-200"
        }`}
      >
        {isSigned ? "✅ Verified signature" : "⏳ Not yet signed"}
      </div>
      <table className="w-full text-xs">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-b last:border-b-0">
              <th className="text-left text-gray-500 font-medium w-2/5 px-3 py-2 align-top">
                {k}
              </th>
              <td className="text-gray-900 px-3 py-2 align-top">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
