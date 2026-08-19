import { ShieldAlert, LogOut } from "lucide-react";
import { getHrImpersonation, exitLineHr } from "@/utils/impersonation";

/**
 * Shown across the very top of the app whenever a super-admin is driving a
 * line's HR via an impersonation session.
 *
 * This must be mounted OUTSIDE the route tree. It used to live inside `App`,
 * which only wraps `/:lineId` — and the HR module is mounted at
 * `/:lineId/human-resources` as a SIBLING of that route, not a child. So the
 * one screen the banner exists for was the one screen it never rendered on,
 * leaving the super-admin with no way back to the admin panel.
 *
 * Deliberately in normal document flow rather than fixed/sticky: several
 * module shells use `sticky top-0` headers, and a fixed strip would sit on top
 * of them. The HR sidebar carries its own always-visible exit for when the
 * page is scrolled (see SideBar).
 */
const HrImpersonationBanner = () => {
  const imp = getHrImpersonation();
  if (!imp) return null;

  return (
    <div className="w-full bg-amber-500 text-white px-4 py-2 flex items-center justify-between gap-3 shadow-sm">
      <div className="flex items-center gap-2 min-w-0">
        <ShieldAlert className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm font-medium truncate">
          Managing HR for <span className="font-bold">{imp.lineName}</span> as
          super-admin
        </span>
      </div>
      <button
        onClick={exitLineHr}
        className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-md px-3 py-1 text-sm font-medium flex-shrink-0 transition-colors"
        title="End this HR session and go back to the super-admin panel"
      >
        <LogOut className="w-3.5 h-3.5" />
        Return to admin panel
      </button>
    </div>
  );
};

export default HrImpersonationBanner;
