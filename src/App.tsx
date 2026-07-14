import { useState } from "react";
import { Outlet } from "react-router";
import "./App.css";

import SideBarProfile from "./layout/SideBarProfile";
import MainHeader from "./layout/MainHeader";
import HrImpersonationBanner from "./layout/HrImpersonationBanner";

function App() {
  // Mobile drawer state for the right side panel. On lg+ the panel is
  // always visible; below lg the user toggles it from the header.
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden">
      {/* Super-admin impersonation strip (only renders when active) */}
      <HrImpersonationBanner />

      <div className="flex-1 min-h-0 flex bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {/* ── Main column ────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <MainHeader onToggleDrawer={() => setDrawerOpen((v) => !v)} />
          <div className="flex-1 min-h-0 overflow-hidden">
            <Outlet />
          </div>
        </div>

        {/* ── Right side panel (Notifications + Profile) ─────────────── */}
        {/* Desktop: always visible at lg+, fixed width */}
        <aside className="hidden lg:flex w-80 xl:w-96 h-full border-l bg-white flex-shrink-0">
          <SideBarProfile />
        </aside>

        {/* Mobile drawer */}
        {drawerOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setDrawerOpen(false)}
            />
            <aside className="fixed top-0 right-0 h-full w-[85vw] max-w-sm bg-white border-l z-50 lg:hidden flex flex-col">
              <SideBarProfile onClose={() => setDrawerOpen(false)} />
            </aside>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
