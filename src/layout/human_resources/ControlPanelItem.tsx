//import React from "react";
import { useNavigate, useParams } from "react-router";
//props
import { Bell, type LucideIcon } from "lucide-react";

interface Props {
  title: string;
  path: string;
  desc?: string;
  Icon: LucideIcon;
}

const ControlPanelItem = ({ title, path, Icon, desc }: Props) => {
  const nav = useNavigate();
  const { lineId } = useParams();
  return (
    <div
      className=" border rounded hover:border-neutral-400 bg-white cursor-pointer"
      onClick={() => nav(`/${lineId}/${path}`)}
    >
      <div className=" w-full h-1/2 p-2 flex items-center justify-between">
        <Icon size={35} color="#222831" />
        <Bell color="#393E46" strokeWidth={1.5} size={20} />
      </div>
      <div className=" p-2 bg-amber-300">
        <h1 className=" font-medium font-sans text-lg text-neutral-700 text-right">
          {title}
        </h1>
        <h1 className="  text-xs text-neutral-800 text-right">{desc}</h1>
      </div>
    </div>
  );
};

export default ControlPanelItem;
