import type { LucideProps } from "lucide-react";
import React, { memo } from "react";
import { useNavigate } from "react-router";
import { Users, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
    <button
      type="button"
      onClick={() => nav(`${item.path}/users`)}
      className="group border rounded-lg bg-white overflow-hidden hover:border-blue-300 hover:shadow-sm transition-all text-left"
    >
      <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <item.Icon className="h-3 w-3 text-blue-500" />
          <span className="text-xs font-semibold text-gray-800">
            {item.module}
          </span>
        </div>
        <span className="text-[10px] text-gray-400 font-mono">#{item.index}</span>
      </div>
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Users className="h-3 w-3 text-gray-400" />
          <span className="text-[10px] text-gray-500">Users</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {item.users}
          </Badge>
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  );
};

export default memo(ModuleItem);
