//import React from "react";

//
import { Outlet } from "react-router";

//uicons
import { UserCog } from "lucide-react";

//helper and utils
import { iconMainColor } from "@/utils/helper";

const Index = () => {
  return (
    <div className=" w-full h-full">
      <div className="w-full h-[10%] p-2 lg:px-12 flex items-center gap-2.5">
        <div className="w-full h-[10%] p-2 lg:px-12 flex items-center gap-2.5">
          <p className=" font-medium text-2xl text-neutral-700 flex">
            <UserCog size={40} color={iconMainColor} />
          </p>
          <p className=" font-medium text-2xl text-neutral-700 flex">Admin</p>
        </div>
      </div>
      <div className="">
        <Outlet />
      </div>
    </div>
  );
};

export default Index;
