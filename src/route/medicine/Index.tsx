//
import { Outlet } from "react-router";

//icons
import { Pill } from "lucide-react";

const Index = () => {
  return (
    <div className="w-full h-screen bg-neutral-100">
      <div className="w-full h-[10%] p-2 lg:px-12 flex items-center gap-2.5">
        <p className=" font-medium text-2xl text-neutral-700 flex">
          <Pill size={40} />
        </p>
        <p className=" font-medium text-2xl text-neutral-700 flex">
          Pharmaceuticals
        </p>
      </div>
      <div className=" w-full h-[90%]">
        <Outlet />
      </div>
    </div>
  );
};

export default Index;
