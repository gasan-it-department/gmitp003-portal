import { ClipboardList } from "lucide-react";
import ControlPanel from "../ControlPanel";
import Announcement from "../Announcement";

const homeItems = [
  { title: "Accomplishment", path: "task", Icon: ClipboardList },
  { title: "Account", path: "task", Icon: ClipboardList },
  { title: "Assisstance", path: "task", Icon: ClipboardList },
  { title: "Complaint", path: "task", Icon: ClipboardList },
];
const Index = () => {
  return (
    <div className=" w-full h-full">
      <div className=" w-full h-full p-3 overflow-auto ">
        <div className=" w-full">
          <Announcement fullWith={false} />
        </div>
        <div className=" w-full h-auto grid grid-cols-2 lg:grid-cols-5 gap-2 border border-x-0 border-t-0 pb-4 mt-10">
          {homeItems.map((item, i) => (
            <div
              key={i}
              className=" border bg-white cursor-pointer hover:border-neutral-500 rounded min-h-20"
            >
              <p className=" font-medium text-sm">{item.title}</p>
            </div>
          ))}
        </div>
        <p className=" font-medium mb-4 mt-4">Control Panel</p>
        <ControlPanel />
      </div>
    </div>
  );
};

export default Index;
