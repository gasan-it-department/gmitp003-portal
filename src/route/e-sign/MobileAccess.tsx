import { Smartphone } from "lucide-react";
//
import { useAuth } from "@/provider/ProtectedRoute";
import { useRoom } from "@/provider/DocumentRoomProvider";
import MobileAccess from "@/layout/medicine/MobileAccess";

/**
 * Documents → Mobile Access — grants/revokes who may use the mobile
 * document scanner. Reuses the Pharmacy Mobile Access UI with the
 * /document/mobile-access endpoints; the API enforces the grant (403) on
 * every scanner read/write, so ungranted phones can't touch the registry.
 */
const DocumentsMobileAccess = () => {
  const auth = useAuth();
  const { room } = useRoom();
  const lineId = room?.lineId as string | undefined;

  if (!auth.token || !lineId || !auth.userId) return null;

  return (
    <div className="w-full h-full overflow-auto">
      <div className="p-4 pb-0 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Smartphone className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Mobile Access
            </h2>
            <p className="text-xs text-gray-500">
              Who can use the mobile document scanner
            </p>
          </div>
        </div>
      </div>
      <MobileAccess
        token={auth.token}
        lineId={lineId}
        userId={auth.userId as string}
        endpoints={{
          list: "/document/mobile-access",
          candidates: "/document/mobile-access/candidates",
          mutate: "/document/mobile-access",
        }}
        copy={{
          heading: "Who can use the mobile document scanner",
          body:
            "Only the users listed below can scan barcode stickers and register received documents from the mobile app. Everyone else is blocked — the server rejects every scan lookup and registration without a grant. Add or remove access anytime; you can add yourself too.",
          emptyBody:
            "Until you add someone, no one can scan or register received documents from a phone.",
        }}
      />
    </div>
  );
};

export default DocumentsMobileAccess;
