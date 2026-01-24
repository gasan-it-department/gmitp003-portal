import { useAuth } from "@/provider/ProtectedRoute";
import { useParams } from "react-router";

import PositionSelection from "@/layout/human_resources/PositionSelection";

const PostPosition = () => {
  const auth = useAuth();
  const { lineId } = useParams();

  return (
    <div className=" w-full h-full">
      <div className=" w-full h-full">
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
