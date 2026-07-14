import { ShieldAlert, LogOut } from "lucide-react";
import { getHrImpersonation, exitLineHr } from "@/utils/impersonation";

/**
 * Shown across the top of the line shell whenever a super-admin is driving a
 * line's HR via an impersonation session. Makes the mode obvious and offers a
 * clean way back to the admin panel.
 */
const HrImpersonationBanner = () => {
  const imp = getHrImpersonation();
  if (!imp) return null;

  return (
    <div className="w-full bg-amber-500 text-white px-4 py-2 flex items-center justify-between gap-3 shadow-sm">
      <div className="flex items-center gap-2 min-w-0">
        <ShieldAlert className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm font-medium truncate">
          Managing HR for{" "}
          <span className="font-bold">{imp.lineName}</span> as super-admin
        </span>
      </div>
      <button
        onClick={exitLineHr}
        className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-md px-3 py-1 text-sm font-medium flex-shrink-0 transition-colors"
      >
        <LogOut className="w-3.5 h-3.5" />
        Exit
      </button>
    </div>
  );
};

export default HrImpersonationBanner;
