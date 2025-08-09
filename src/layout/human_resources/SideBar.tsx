//icons

//
import {
  Briefcase,
  Home,
  IdCardLanyard,
  File,
  CircleEllipsis,
  LandPlot,
  Landmark,
  Blocks,
  Box,
} from "lucide-react";
import SIdeBarItem from "./SIdeBarItem";
import SideBarProfile from "./SideBarProfile";
//
const menuList = [
  {
    title: "Home",
    path: "/human-resources/home",
    Icon: Home,
    children: [],
    accord: false,
  },
  {
    title: "Supplies",
    path: "/human-resources/plantilla",
    Icon: Box,
    children: [],
    accord: false,
  },
  {
    title: "Plantilla",
    path: "/human-resources/plantilla",
    Icon: Briefcase,
    children: [],
    accord: false,
  },
  {
    title: "Employees",
    path: "/human-resources/employees",
    Icon: IdCardLanyard,
    children: [],
    accord: false,
  },
  {
    title: "Application",
    path: "/human-resources/application",
    Icon: File,
    children: [],
    accord: false,
  },
  {
    title: "Others",
    path: "/human-resources/application",
    Icon: CircleEllipsis,
    children: [
      {
        title: "Salary Grade",
        path: "/human-resources/salary",
        Icon: Landmark,
        children: [],
        accord: true,
      },
      {
        title: "Areas",
        path: "/human-resources/areas",
        Icon: LandPlot,
        children: [],
        accord: true,
      },

      {
        title: "Unit",
        path: "/human-resources/groups",
        Icon: Blocks,
        children: [],
        accord: true,
      },
    ],
    accord: true,
  },
];
const SideBar = () => {
  return (
    <div className=" w-full h-full flex flex-col justify-between border border-t-0 border-b-0 border-l-0 bg-white">
      <div className=" w-full">
        <div className=" w-full p-4">
          <p className=" font-medium font-mono text-lg">Welcome OM!</p>
        </div>
        <div className=" w-full flex flex-col gap-1 p-2">
          {menuList.map((item) => (
            <SIdeBarItem {...item} />
          ))}
        </div>
      </div>
      <div className="w-full p-2">
        <SideBarProfile />
      </div>
    </div>
  );
};

export default SideBar;
