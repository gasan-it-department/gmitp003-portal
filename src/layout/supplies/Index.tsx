import { useAuth } from "@/provider/ProtectedRoute";
//import { ClipboardList } from "lucide-react";
import ControlPanel from "../ControlPanel";
import Announcement from "../Announcement";

// const homeItems = [
//   { title: "Accomplishment", path: "task", Icon: ClipboardList },
//   { title: "Account", path: "task", Icon: ClipboardList },
//   { title: "Assisstance", path: "task", Icon: ClipboardList },
//   { title: "Complaint", path: "task", Icon: ClipboardList },
// ];
const Index = () => {
  const auth = useAuth();
  return (
    <div className=" w-full h-full">
      <div className=" w-full h-full p-3 overflow-auto ">
        <div className=" w-full">
          <Announcement />
        </div>

        <ControlPanel id={auth.userId as string} token={auth.token as string} />
      </div>
    </div>
  );
};

export default Index;
