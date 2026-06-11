import { useNavigate, useParams, useLocation } from "react-router";
import { ShieldOff, ArrowLeft, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shown when ModuleGuard determines the current user lacks access to the
 * module they're trying to load. We deliberately don't reveal whether
 * the module exists at all — the message is the same for "you don't
 * have access" and "unknown module".
 */
const AccessDenied = () => {
  const nav = useNavigate();
  const { lineId } = useParams();
  const location = useLocation();

  return (
    <div className="w-full h-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-md w-full bg-white border rounded-lg shadow-sm p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 flex items-center justify-center mb-4">
          <ShieldOff className="h-7 w-7 text-rose-600" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900 mb-1">
          Access denied
        </h1>
        <p className="text-sm text-gray-600">
          You don&apos;t have permission to view this module. If you think
          this is a mistake, ask your HR admin to grant you module access.
        </p>
        <p className="text-[11px] text-gray-400 mt-2 font-mono break-all">
          {location.pathname}
        </p>

        <div className="mt-5 flex flex-col sm:flex-row justify-center gap-2">
          <Button variant="outline" onClick={() => nav(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go back
          </Button>
          {lineId ? (
            <Button onClick={() => nav(`/${lineId}`)} className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              My modules
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
