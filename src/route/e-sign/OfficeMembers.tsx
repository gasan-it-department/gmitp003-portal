// Signatories & Receivers — who in this office may do what.
//
// This screen existed, and could not be found. The only door to it was
// HR -> Document Room -> pick a room -> a "Manage" tab: four clicks into
// a module most document staff never open, with nothing in the Document
// module linking to it at all. So the people who actually run an office
// could not change their own office's signatories.
//
// Same component HR uses, pointed at your own room instead of a room
// picker. Two doors, one implementation:
//
//   HR    - administers every office's room, and belongs to none of them.
//   Here  - an owner runs their own office, and nobody else's.
//
// The second door is why the server-side gate now exists. `documents` is
// an always-open module, so every line user can reach this URL: "only the
// owner" is enforced by the API (requireRoomAdmin) and merely reflected
// here. This page hiding a control is a courtesy, not the check.

import { useNavigate } from "react-router";
import { ArrowLeft, Building2, Crown, ShieldAlert } from "lucide-react";

import RoomConfig from "@/layout/e-sign/RoomConfig";
import { useRoom } from "@/provider/DocumentRoomProvider";
import { Button } from "@/components/ui/button";

/** Mirrors ROOM_MEMBER_TYPES on the API. */
const OWNER = 0;

const OfficeMembers = () => {
  const nav = useNavigate();
  const { room, me } = useRoom();

  const isOwner = me?.type === OWNER && me?.status === 1;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="px-3 py-2 border-b bg-white flex items-center gap-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1"
          onClick={() => nav("..")}
        >
          <ArrowLeft className="h-3 w-3" />
          Back
        </Button>
        <div className="flex items-center gap-1.5 min-w-0">
          <Building2 className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
          <div className="min-w-0">
            <h1 className="text-xs font-semibold text-gray-800 truncate">
              Signatories &amp; Receivers
            </h1>
            <p className="text-[10px] text-gray-500 leading-none mt-0.5 truncate">
              {room?.code ?? "Your office"} — who may sign, and who may receive
            </p>
          </div>
        </div>
        {isOwner && (
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 flex-shrink-0">
            <Crown className="h-2.5 w-2.5" />
            Owner
          </span>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        {!room?.id ? (
          <div className="p-6 text-center text-xs text-gray-500">
            Your office is still being set up.
          </div>
        ) : isOwner ? (
          <RoomConfig roomId={room.id} />
        ) : (
          <div className="p-6 max-w-md mx-auto text-center space-y-3">
            <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-gray-400" />
            </div>
            <h2 className="text-sm font-semibold text-gray-800">
              Only this office's owner can change its members
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Being trusted to sign documents is not the same as deciding who
              else may sign them. Ask the owner of{" "}
              {room.code ?? "your office"}, or the HR office, to make the
              change.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficeMembers;
