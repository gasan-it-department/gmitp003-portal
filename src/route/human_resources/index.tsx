import {} from "react";
import { Outlet } from "react-router";
//components and layout
import Header from "@/layout/human_resources/Header";
import SideBar from "@/layout/human_resources/SideBar";

const index = () => {
  return (
    <div className=" w-full h-screen flex bg-neutral-100">
      <div className="w-1/5 h-full ">
        <SideBar />
      </div>
      <div className="w-4/5 h-full">
        <div className="w-full h-[10%]">
          <Header />
        </div>
        <div className="w-full h-[90%] overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default index;
