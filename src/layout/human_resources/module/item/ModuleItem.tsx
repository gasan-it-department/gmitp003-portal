import type { LucideProps } from "lucide-react";
import React, { memo } from "react";
import { useNavigate } from "react-router";

interface Props {
  item: {
    module: string;
    users: number;
    index: number;
    Icon: React.ForwardRefExoticComponent<
      Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
    >;
    path: string;
  };
}

const ModuleItem = ({ item }: Props) => {
  const nav = useNavigate();
  return (
    <div
      key={item.index}
      onClick={() => nav(`${item.path}/users`)}
      className="border rounded-lg p-4 bg-white hover:border-neutral-300 cursor-pointer"
    >
      <div className="flex items-center justify-between mb-2">
        <item.Icon className="w-5 h-5" />
        <span className="text-sm text-gray-500">#{item.index}</span>
      </div>
      <h3 className="font-medium text-sm mb-2">{item.module}</h3>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-600">Users</span>
        <span className="font-semibold">{item.users}</span>
      </div>
    </div>
  );
};

export default memo(ModuleItem);
