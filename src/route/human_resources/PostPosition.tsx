import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Briefcase } from "lucide-react";

import { useAuth } from "@/provider/ProtectedRoute";
import { Button } from "@/components/ui/button";
import PositionSelection from "@/layout/human_resources/PositionSelection";

const PostPosition = () => {
  const auth = useAuth();
  const nav = useNavigate();
  const { lineId } = useParams();

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <div className="bg-white border-b flex-shrink-0">
        <div className="px-3 py-2 flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={() => nav(-1)}
          >
            <ArrowLeft className="h-3 w-3" />
          </Button>
          <div className="p-1.5 bg-blue-600 rounded-md flex-shrink-0">
            <Briefcase className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs font-semibold text-gray-900 truncate">
              New Job Posting
            </h1>
            <p className="text-[10px] text-gray-500 leading-none mt-0.5">
              Pick a position to create the post
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden p-3">
        <PositionSelection
          lineId={lineId}
          token={auth.token}
          userId={auth.userId as string}
        />
      </div>
    </div>
  );
};

export default PostPosition;
