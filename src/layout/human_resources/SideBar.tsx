import { useState } from "react";
import { useParams, NavLink } from "react-router";
import { getHrImpersonation, exitLineHr } from "@/utils/impersonation";
import {
  Archive,
  Blocks,
  Building2,
  CalendarDays,
  Clock4,
  Component,
  File,
  FileText,
  Home,
  IdCardLanyard,
  Landmark,
  Link,
  LogOut,
  Megaphone,
  PanelLeftClose,
  PanelLeftOpen,
  QrCode,
  Send,
  Wallet,
  Wrench,
} from "lucide-react";
import SIdeBarItem from "./SIdeBarItem";

// Grouped sidebar. Each group renders a small section header followed by its
// leaf items. (Replaces the old flat list + single "Management" accordion.)
export const menuGroups = [
  {
    section: "Overview",
    items: [
      { title: "Dashboard",    path: "dashboard",    Icon: Home,      children: [], accord: false },
      { title: "Announcement", path: "announcement", Icon: Megaphone, children: [], accord: false },
    ],
  },
  {
    section: "Recruitment",
    items: [
      { title: "Applications", path: "application", Icon: File, children: [], accord: false },
      { title: "Invite Users", path: "invite",      Icon: Link, children: [], accord: false },
    ],
  },
  {
    section: "Workforce",
    items: [
      { title: "Employees",     path: "employee",    Icon: IdCardLanyard, children: [], accord: false },
      { title: "Non-Plantilla", path: "provisional", Icon: Clock4,        children: [], accord: false },
      { title: "Archived",      path: "archived",    Icon: Archive,       children: [], accord: false },
      { title: "Units",         path: "units",       Icon: Blocks,        children: [], accord: false },
      { title: "Salary Grades", path: "salary",      Icon: Landmark,      children: [], accord: false },
    ],
  },
  {
    section: "Operations",
    items: [
      { title: "Attendance",    path: "attendance", Icon: QrCode,     children: [], accord: false },
      { title: "Message Queue", path: "messages",   Icon: Send,       children: [], accord: false },
      { title: "Leaves",        path: "leaves",   Icon: CalendarDays, children: [], accord: false },
      { title: "Payroll",       path: "payroll",  Icon: Wallet,       children: [], accord: false },
      { title: "Document Room", path: "document", Icon: FileText,     children: [], accord: false },
      { title: "Modules",       path: "module",   Icon: Component,    children: [], accord: false },
    ],
  },
  {
    section: "Tools",
    items: [
      { title: "Tools", path: "tools", Icon: Wrench, children: [], accord: false },
    ],
  },
];

const SideBar = () => {
  const { lineId } = useParams();
  const [collapsed, setCollapsed] = useState(false);
  // Non-null only while a super-admin is driving this line's HR.
  const impersonation = getHrImpersonation();

  return (
    <aside
      className={`h-full flex flex-col bg-white border-r border-gray-200 transition-[width] duration-200 ease-out flex-shrink-0 ${
        collapsed ? "w-14" : "w-56"
      }`}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="px-3 py-2.5 border-b flex items-center gap-2">
        <NavLink
          to={`/${lineId}`}
          className="flex items-center gap-2 min-w-0 flex-1"
          title="Back to control panel"
        >
          <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">
                HR Portal
              </p>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5 truncate">
                Personnel & access
              </p>
            </div>
          )}
        </NavLink>

        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 flex-shrink-0"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-3.5 w-3.5" />
          ) : (
            <PanelLeftClose className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* ── Navigation (grouped sections) ──────────────────────────── */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-2">
        {menuGroups.map((group) => (
          <div key={group.section} className="space-y-0.5">
            {!collapsed && (
              <p className="px-2 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {group.section}
              </p>
            )}
            {group.items.map((item, index) => (
              <SIdeBarItem
                key={index}
                {...item}
                lineId={lineId}
                collapsed={collapsed}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* ── Super-admin escape hatch ────────────────────────────────── */}
      {/* The banner at the top of the page scrolls away; the sidebar does
          not, so the way out is always one click from anywhere in HR. */}
      {impersonation && (
        <div className="p-2 border-t bg-amber-50">
          <button
            type="button"
            onClick={exitLineHr}
            title={`Leave ${impersonation.lineName} and return to the super-admin panel`}
            className={`w-full flex items-center gap-2 rounded-md bg-amber-500 hover:bg-amber-600 text-white transition-colors ${
              collapsed ? "justify-center p-2" : "px-2.5 py-2"
            }`}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!collapsed && (
              <span className="min-w-0 text-left">
                <span className="block text-xs font-semibold leading-tight">
                  Return to admin
                </span>
                <span className="block text-[10px] text-amber-50 truncate">
                  Managing {impersonation.lineName}
                </span>
              </span>
            )}
          </button>
        </div>
      )}
    </aside>
  );
};

export default SideBar;
