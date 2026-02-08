import { useParams } from "react-router";
import {
  Megaphone,
  Home,
  IdCardLanyard,
  File,
  Landmark,
  Blocks,
  Component,
  Building2,
} from "lucide-react";
import SIdeBarItem from "./SIdeBarItem";

export const menuList = [
  {
    title: "Dashboard",
    path: "dashboard",
    Icon: Home,
    children: [],
    accord: false,
  },
  {
    title: "Announcement",
    path: "announcement",
    Icon: Megaphone,
    children: [],
    accord: false,
  },
  {
    title: "Employees",
    path: "employee",
    Icon: IdCardLanyard,
    children: [],
    accord: false,
  },
  {
    title: "Applications",
    path: "application",
    Icon: File,
    children: [],
    accord: false,
  },
  {
    title: "Management",
    path: "human-resources/management",
    Icon: Building2,
    children: [
      {
        title: "Module",
        path: "module",
        Icon: Component,
        children: [],
        accord: true,
      },
      {
        title: "Salary Grades",
        path: "salary",
        Icon: Landmark,
        children: [],
        accord: true,
      },
      // {
      //   title: "Areas",
      //   path: "areas",
      //   Icon: LandPlot,
      //   children: [],
      //   accord: true,
      // },
      {
        title: "Units",
        path: "units",
        Icon: Blocks,
        children: [],
        accord: true,
      },
      {
        title: "Document Room",
        path: "document-room",
        Icon: Blocks,
        children: [],
        accord: true,
      },
      // {
      //   title: "Invite Users",
      //   path: "invite",
      //   Icon: Link,
      //   children: [],
      //   accord: true,
      // },
    ],
    accord: true,
  },
];

const SideBar = () => {
  const { lineId } = useParams();

  return (
    <div className="w-full h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg">HR Portal</h1>
            <p className="text-sm text-gray-500">Welcome back!</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-1">
          {menuList.map((item, index) => (
            <SIdeBarItem key={index} {...item} lineId={lineId} />
          ))}
        </nav>
      </div>
    </div>
  );
};

export default SideBar;
