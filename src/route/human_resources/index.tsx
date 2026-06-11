import { Outlet } from "react-router";
import Header from "@/layout/human_resources/Header";
import SideBar from "@/layout/human_resources/SideBar";

const HumanResourcesLayout = () => {
  return (
    <div className="w-full h-screen flex bg-neutral-100 overflow-hidden">
      <SideBar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-shrink-0">
          <Header />
        </div>
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default HumanResourcesLayout;
