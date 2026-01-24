import {} from "react";

//
import { HelpingHand } from "lucide-react";

//
import { Outlet } from "react-router";
//

const Index = () => {
  return (
    <div className=" w-full h-screen bg-neutral-100">
      <div className=" w-full h-[10%] border border-x-0 border-t-0 border-b-neutral-200 flex items-center">
        <div className=" flex items-center gap-2 p-4 text-xl font-semibold text-neutral-700">
          <HelpingHand size={40} />
          <p className="font-medium text-2xl text-neutral-700 flex">
            Prescribe
          </p>
        </div>
      </div>
      <div className=" w-full h-[90%]">
        <Outlet />
      </div>
    </div>
  );
};

export default Index;
