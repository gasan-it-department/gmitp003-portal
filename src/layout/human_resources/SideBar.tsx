import { useState } from "react";
import { useParams, NavLink } from "react-router";
import {
  Megaphone,
  Home,
  IdCardLanyard,
  File,
  Landmark,
  Blocks,
  Component,
  Building2,
  Link,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  CalendarDays,
  Wallet,
} from "lucide-react";
import SIdeBarItem from "./SIdeBarItem";
import SideBarProfile from "./SideBarProfile";

export const menuList = [
  { title: "Dashboard",    path: "dashboard",    Icon: Home,          children: [], accord: false },
  { title: "Announcement", path: "announcement", Icon: Megaphone,     children: [], accord: false },
  { title: "Employees",    path: "employee",     Icon: IdCardLanyard, children: [], accord: false },
  { title: "Applications", path: "application",  Icon: File,          children: [], accord: false },
  {
    title: "Management",
    path: "human-resources/management",
    Icon: Building2,
    accord: true,
    children: [
      { title: "Module",        path: "module",   Icon: Component,    children: [], accord: true },
      { title: "Salary Grades", path: "salary",   Icon: Landmark,     children: [], accord: true },
      { title: "Leaves",        path: "leaves",   Icon: CalendarDays, children: [], accord: true },
      { title: "Payroll",       path: "payroll",  Icon: Wallet,       children: [], accord: true },
      { title: "Units",         path: "units",    Icon: Blocks,       children: [], accord: true },
      { title: "Document Room", path: "document", Icon: FileText,     children: [], accord: true },
      { title: "Invite Users",  path: "invite",   Icon: Link,         children: [], accord: true },
    ],
  },
];

const SideBar = () => {
  const { lineId } = useParams();
  const [collapsed, setCollapsed] = useState(false);

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

      {/* ── Navigation ─────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {menuList.map((item, index) => (
          <SIdeBarItem
            key={index}
            {...item}
            lineId={lineId}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* ── Profile footer ─────────────────────────────────────────── */}
      <div className="p-2 border-t">
        <SideBarProfile collapsed={collapsed} />
      </div>
    </aside>
  );
};

export default SideBar;
