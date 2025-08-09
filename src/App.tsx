import { Outlet } from "react-router";
import "./App.css";

//i
import { Button } from "./components/ui/button";
import SideBarProfile from "./layout/SideBarProfile";
import MainHeader from "./layout/MainHeader";
import ControlPanel from "./layout/ControlPanel";

//icons
import { ClipboardList } from "lucide-react";

function App() {
  return (
    <div className=" w-full h-screen flex bg-neutral-100">
      <div className=" w-full lg:w-2/3 h-full">
        <div className=" w-full h-[10%]">
          <MainHeader />
        </div>
        <div className=" w-full h-[90%]">
          <Outlet />
        </div>
        {/* <p className=" font-medium text-neutral-800">Control Panel</p> */}
      </div>
      <div className=" hidden lg:block lg:w-1/3 h-full border border-y-0 border-r-0">
        <SideBarProfile />
      </div>
    </div>
  );
}

export default App;
