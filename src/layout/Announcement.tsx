import { useParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
//
import AnnouncementList from "./AnnouncementList";
//

const Announcement = () => {
  const { lineId } = useParams();
  const auth = useAuth();
  return (
    <div className=" w-full h-full bg-white border border-neutral-400 rounded">
      <div className=" w-full h-[90%] p-2">
        <AnnouncementList
          lineId={lineId as string}
          token={auth.token as string}
          userId={auth.userId as string}
        />
      </div>
    </div>
  );
};

export default Announcement;
