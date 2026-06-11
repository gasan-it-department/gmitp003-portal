import { Outlet } from "react-router";
import { Archive, MapPin, Loader2, AlertCircle } from "lucide-react";
import { useGeo } from "@/provider/GeoProvider";

const GeoBadge = () => {
  const { status, coords, refresh } = useGeo();
  let label = "Locating…";
  let dotCls = "bg-amber-500 animate-pulse";
  let textCls = "text-amber-700";
  let clickable = false;

  if (status === "ready" && coords) {
    label = `Location ready (±${Math.round(coords.accuracy ?? 0)}m)`;
    dotCls = "bg-emerald-500";
    textCls = "text-emerald-700";
  } else if (status === "denied") {
    label = "Location blocked — click to retry";
    dotCls = "bg-rose-500";
    textCls = "text-rose-700";
    clickable = true;
  } else if (status === "unavailable") {
    label = "Location unsupported";
    dotCls = "bg-gray-400";
    textCls = "text-gray-600";
  } else if (status === "error") {
    label = "Location error — click to retry";
    dotCls = "bg-rose-500";
    textCls = "text-rose-700";
    clickable = true;
  } else if (status === "requesting") {
    label = "Requesting location…";
    dotCls = "bg-amber-500 animate-pulse";
    textCls = "text-amber-700";
  } else if (status === "idle") {
    label = "Location not yet requested";
    dotCls = "bg-gray-400";
    textCls = "text-gray-600";
    clickable = true;
  }

  return (
    <button
      type="button"
      onClick={clickable ? () => refresh() : undefined}
      disabled={!clickable && status !== "ready"}
      className={`flex items-center gap-1.5 ${clickable ? "cursor-pointer hover:bg-gray-50" : "cursor-default"} rounded px-1.5 py-0.5`}
      title={
        status === "ready"
          ? "Your signing location is captured and ready. It'll be embedded in signed PDF QR codes."
          : "We need your location to embed it in signature QR codes. Click to retry."
      }
    >
      {status === "requesting" ? (
        <Loader2 className="h-3 w-3 animate-spin text-amber-600" />
      ) : status === "ready" ? (
        <MapPin className="h-3 w-3 text-emerald-600" />
      ) : (
        <AlertCircle className="h-3 w-3 text-rose-600" />
      )}
      <span className={`h-1.5 w-1.5 rounded-full ${dotCls}`} />
      <span className={`text-[10px] font-medium ${textCls}`}>{label}</span>
    </button>
  );
};

const Index = () => {
  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b flex-shrink-0">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-blue-600 rounded-md flex-shrink-0">
              <Archive className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-semibold text-gray-900 truncate">
                Municipal Document Management
              </h1>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                Archive, sign & disseminate
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <GeoBadge />
            <span className="h-3 w-px bg-gray-200" />
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            <span className="text-[10px] text-gray-600 font-medium">
              Operational
            </span>
          </div>
        </div>
      </div>

      {/* Routed content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default Index;
