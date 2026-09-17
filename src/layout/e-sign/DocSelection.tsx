import { useLocation, useNavigate, useParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
import { useRoom } from "@/provider/DocumentRoomProvider";
import PlacementEditor from "./PlacementEditor";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

// Standalone route for re-editing placements after the wizard is past
// the Documents step. Mounted at /…/dissemination/set-up/:newRoomId/file.
const DocSelection = () => {
  const { newRoomId } = useParams();
  const auth = useAuth();
  const { room } = useRoom();
  const nav = useNavigate();
  const loc = useLocation();

  /**
   * Back to the wizard, not out of it.
   *
   * This route is a SIBLING of set-up/:newRoomId in the route tree rather
   * than a child of it, so a relative `nav("..")` resolved all the way up
   * to the routing list. Coming here to nudge one box therefore ejected you
   * from the wizard, and getting back in restarted at Recipients — the
   * entire setup again, to change nothing. Dropping the last segment lands
   * exactly where the user came from.
   */
  const backToWizard = () => nav(loc.pathname.replace(/\/file\/?$/, ""));

  return (
    <main className="w-full h-full flex flex-col bg-white">
      <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={backToWizard}
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to the routing
        </Button>
        <div className="leading-tight">
          <div className="text-xs font-semibold text-gray-900">
            Edit e-signature placements
          </div>
          <div className="text-[10px] text-gray-500">
            Drag on the page to draw a box. Each box is bound to a signatory
            slot.
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <PlacementEditor
          queueRoomId={newRoomId as string}
          token={auth.token as string}
          userId={auth.userId as string}
          lineId={room?.lineId as string}
        />
      </div>
    </main>
  );
};

export default DocSelection;
