import { useLocation, useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Menu, ChevronLeft, LayoutDashboard } from "lucide-react";

interface Props {
  onToggleDrawer?: () => void;
}

const MainHeader = ({ onToggleDrawer }: Props) => {
  const nav = useNavigate();
  const location = useLocation();
  const canGoBack =
    location.pathname !== "/" && window.history.length > 1;

  return (
    <header className="w-full bg-white border-b flex-shrink-0">
      <div className="px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {canGoBack && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => nav(-1)}
              title="Back"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
          )}
          <div className="p-1.5 bg-blue-600 rounded-md flex-shrink-0">
            <LayoutDashboard className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs font-semibold text-gray-900 truncate">
              Gasan Municipal Portal
            </h1>
            <p className="text-[10px] text-gray-500 leading-none mt-0.5">
              Integrated services dashboard
            </p>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0 lg:hidden"
          onClick={onToggleDrawer}
          title="Notifications & profile"
        >
          <Menu className="h-3 w-3" />
        </Button>
      </div>
    </header>
  );
};

export default MainHeader;
