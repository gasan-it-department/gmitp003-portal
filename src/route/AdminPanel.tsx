import { useSearchParams } from "react-router";
import { useState, type ReactNode } from "react";

import { useAdminAuth } from "@/provider/AdminRouter";
import { Button } from "@/components/ui/button";
import {
  BookUser,
  Server,
  ShieldCheck,
  DatabaseBackup,
  ScrollText,
  LogOut,
  Menu,
} from "lucide-react";

import Account from "./admin-panel/Account";
import Lines from "./admin-panel/Lines";
import Logs from "./admin-panel/Logs";
import Backup from "./admin-panel/Backup";

type TabValue = "account" | "line" | "logs" | "backup";

const TABS: {
  value: TabValue;
  label: string;
  icon: typeof BookUser;
  component: ReactNode;
}[] = [
  { value: "account", label: "Accounts", icon: BookUser, component: <Account /> },
  { value: "line", label: "Lines", icon: Server, component: <Lines /> },
  {
    value: "logs",
    label: "Audit Logs",
    icon: ScrollText,
    component: <Logs />,
  },
  {
    value: "backup",
    label: "Backups",
    icon: DatabaseBackup,
    component: <Backup />,
  },
];

const AdminPanel = () => {
  const [params, setParams] = useSearchParams({ tab: "account" });
  const [mobileOpen, setMobileOpen] = useState(false);
  const { userId, logout } = useAdminAuth();

  const raw = params.get("tab") || "account";
  const currentTab = (TABS.some((t) => t.value === raw) ? raw : "account") as TabValue;
  const active = TABS.find((t) => t.value === currentTab) ?? TABS[0];

  const selectTab = (value: TabValue) => {
    setParams(
      (prev) => {
        prev.set("tab", value);
        return prev;
      },
      { replace: true },
    );
    setMobileOpen(false);
  };

  const NavItems = () => (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {TABS.map((tab) => {
        const isActive = tab.value === currentTab;
        return (
          <button
            key={tab.value}
            onClick={() => selectTab(tab.value)}
            className={
              "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors " +
              (isActive
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-300 hover:bg-white/5 hover:text-white")
            }
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );

  const SidebarBody = () => (
    <>
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-white/10">
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white leading-tight">
            Admin Console
          </p>
          <p className="text-[10px] text-slate-400 leading-tight">
            System administration
          </p>
        </div>
      </div>

      <NavItems />

      {/* Footer / logout */}
      <div className="px-3 py-3 border-t border-white/10">
        <div className="px-2 pb-2 text-[10px] text-slate-500 truncate">
          ID: {userId ?? "—"}
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gradient-to-b from-gray-50 to-gray-100 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col bg-slate-900 flex-none">
        <SidebarBody />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-60 flex flex-col bg-slate-900">
            <SidebarBody />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="flex-none h-16 bg-white border-b border-gray-200 flex items-center gap-3 px-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <active.icon className="h-5 w-5 text-indigo-600" />
            <h1 className="text-base font-semibold text-gray-900 truncate">
              {active.label}
            </h1>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 min-h-0 overflow-auto">{active.component}</main>
      </div>
    </div>
  );
};

export default AdminPanel;
