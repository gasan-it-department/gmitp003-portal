import { Send, FileText } from "lucide-react";
import { Outlet } from "react-router";

const DisseminationIndex = () => {
  return (
    <div className=" w-full h-full overflow-auto relative">
      {/* Header */}
      <div className=" flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default DisseminationIndex;
