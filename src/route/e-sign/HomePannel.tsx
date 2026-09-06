import { useState } from "react";
import { useParams } from "react-router";

import { Button } from "@/components/ui/button";
import { PanelRightClose, PanelRightOpen } from "lucide-react";

import ESignPannel from "@/layout/e-sign/ESignPannel";
import ActivityPanel from "@/layout/e-sign/ActivityPanel";
import { useAuth } from "@/provider/ProtectedRoute";
import { useRoom } from "@/provider/DocumentRoomProvider";

const HomePannel = () => {
  const [sideOpen, setSideOpen] = useState(true);
  const auth = useAuth();
  const { room } = useRoom();
  const { lineId } = useParams();

  return (
    <div className="w-full h-full flex bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Main content */}
      <div className="flex-1 min-w-0 overflow-auto">
        <ESignPannel />
      </div>

      {/* Side panel */}
      <aside
        className={`bg-white border-l flex-shrink-0 transition-[width] duration-200 ease-out ${
          sideOpen ? "w-80" : "w-10"
        } flex flex-col`}
      >
        {/* Collapse toggle header */}
        <div className="px-2 py-1.5 border-b bg-gray-50 flex items-center justify-between flex-shrink-0">
          {sideOpen && (
            <span className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
              Activity
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 ml-auto"
            onClick={() => setSideOpen((o) => !o)}
            title={sideOpen ? "Collapse panel" : "Expand panel"}
          >
            {sideOpen ? (
              <PanelRightClose className="h-3 w-3" />
            ) : (
              <PanelRightOpen className="h-3 w-3" />
            )}
          </Button>
        </div>

        {sideOpen &&
          (room?.id && auth.token && auth.userId ? (
            <ActivityPanel
              token={auth.token as string}
              userId={auth.userId as string}
              roomId={room.id}
              lineId={lineId as string}
            />
          ) : (
            <p className="p-3 text-[10px] text-gray-400">
              Your office is still being set up — there is nothing to report
              yet.
            </p>
          ))}
      </aside>
    </div>
  );
};

export default HomePannel;
