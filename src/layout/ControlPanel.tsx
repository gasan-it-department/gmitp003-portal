import React from "react";

//
import ControlPanelItem from "./human_resources/ControlPanelItem";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Box,
  FolderPlus,
  IdCardLanyard,
  Scroll,
  LayoutDashboard,
  Users,
  Archive,
  Megaphone,
  HandHelping,
} from "lucide-react";
//
const panels = [
  {
    title: "Admin",
    path: "admin",
    Icon: LayoutDashboard,
    desc: "Manage Supplies",
  },
  {
    title: "Unit",
    path: "admin",
    Icon: Users,
    desc: "Manage Unit",
  },
  { title: "Inventory", path: "supplies", Icon: Box, desc: "Manage Supplies" },
  {
    title: "Personnel",
    path: "human-resources/home",
    Icon: IdCardLanyard,
    desc: "Manage Human Resources",
  },
  {
    title: "Documents",
    path: "documents",
    Icon: Scroll,
    desc: "Manage Human Resources",
  },
  {
    title: "Announcement",
    path: "documents",
    Icon: Megaphone,
    desc: "Announce and notify everyone",
  },
  {
    title: "Archives",
    path: "documents",
    Icon: Archive,
    desc: "Manage Human Resources",
  },
];

const ControlPanel = () => {
  return (
    <div className=" w-full h-auto grid-cols-2 lg:grid-cols-4 grid-rows-4 grid gap-2">
      {panels.map((item, i) => (
        <ControlPanelItem
          key={i}
          title={item.title}
          desc={item.desc}
          path={item.path}
          Icon={item.Icon}
        />
      ))}
      <div className=" border rounded hover:border-neutral-400 bg-white cursor-pointer">
        <div className=" w-full h-1/2 p-2 flex items-center justify-between">
          <FolderPlus size={45} color="#222831" />
        </div>
        <div className=" p-2 bg-amber-400">
          <h1 className=" font-medium font-sans text-lg text-neutral-700 text-right">
            Add Module
          </h1>
          <h1 className="  text-xs text-neutral-800 text-right">
            Request additional module
          </h1>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
