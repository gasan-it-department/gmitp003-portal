import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
//
import { userAssignedModule } from "@/db/statement";
//
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Box,
  IdCardLanyard,
  Scroll,
  // LayoutDashboard,
  // Users,
  // Archive,
  // Megaphone,
  Pill,
  HandHelping,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Module } from "@/interface/data";

// Control Panel Item Component
interface ControlPanelItemProps {
  title: string;
  path: string;
  desc?: string;
  Icon: LucideIcon;
  notifications?: number;
}

const ControlPanelItem = ({
  title,
  path,
  Icon,
  desc,
  notifications,
}: ControlPanelItemProps) => {
  const nav = useNavigate();
  const { lineId } = useParams();

  const handleClick = () => {
    if (path === "human-resources") {
      return nav(`/${lineId}/human-resources/dashboard`);
    }
    nav(`/${lineId}/${path}`);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "group relative bg-white rounded-xl border border-gray-200 cursor-pointer",
              "transition-all duration-300 hover:shadow-lg hover:border-blue-300 hover:scale-105",
              "flex flex-col h-full overflow-hidden",
            )}
            onClick={handleClick}
          >
            {/* Notification Badge */}
            {notifications && notifications > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 z-10 h-6 w-6 flex items-center justify-center p-0 text-xs"
              >
                {notifications > 9 ? "9+" : notifications}
              </Badge>
            )}

            {/* Header with Icon */}
            <div className="p-6 flex-1 flex flex-col justify-center items-center">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-100 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300" />
                <Icon
                  size={48}
                  className={cn(
                    "relative z-10 transition-all duration-300",
                    "text-gray-600 group-hover:text-blue-600 group-hover:scale-110",
                  )}
                />
              </div>

              {/* Title */}
              <h3 className="mt-4 text-lg font-semibold text-gray-900 text-center group-hover:text-blue-700 transition-colors">
                {title}
              </h3>

              {/* Description */}
              {desc && (
                <p className="mt-2 text-sm text-gray-500 text-center line-clamp-2">
                  {desc}
                </p>
              )}
            </div>

            {/* Footer with Action Indicator */}
            <div
              className={cn(
                "px-4 py-3 border-t border-gray-100 bg-gray-50",
                "group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 group-hover:text-blue-600 transition-colors">
                  Click to access
                </span>
                <ChevronRight
                  size={16}
                  className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"
                />
              </div>
            </div>

            {/* Hover Glow Effect */}
            <div className="absolute inset-0 rounded-xl bg-blue-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Go to {title}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Main Control Panel Component
export const panels = [
  // {
  //   title: "Admin",
  //   path: "admin",
  //   Icon: LayoutDashboard,
  //   desc: "System administration and settings",
  //   notifications: 2,
  // },
  // {
  //   title: "Unit",
  //   path: "admin",
  //   Icon: Users,
  //   desc: "Manage organizational units and teams",
  //   notifications: 0,
  // },
  {
    title: "Inventory",
    path: "supplies",
    Icon: Box,
    desc: "Manage supplies and stock levels",
    notifications: 5,
  },
  {
    title: "Pharmaceuticals",
    path: "medicine",
    Icon: Pill,
    desc: "Manage medicine inventory and prescriptions",
    notifications: 3,
  },
  {
    title: "Prescribe",
    path: "prescribe-medicine",
    Icon: HandHelping,
    desc: "Create and manage medical prescriptions",
    notifications: 1,
  },
  {
    title: "Personnel",
    path: "human-resources",
    Icon: IdCardLanyard,
    desc: "Manage human resources and employee data",
    notifications: 0,
  },
  {
    title: "Documents",
    path: "documents",
    Icon: Scroll,
    desc: "Access and manage important documents",
    notifications: 8,
  },
  // {
  //   title: "Announcement",
  //   path: "announcements",
  //   Icon: Megaphone,
  //   desc: "Create and broadcast announcements",
  //   notifications: 0,
  // },
  // {
  //   title: "Archives",
  //   path: "archives",
  //   Icon: Archive,
  //   desc: "Access archived records and documents",
  //   notifications: 0,
  // },
];

interface Props {
  id: string;
  token: string;
}

const ControlPanel = ({ id, token }: Props) => {
  const { data } = useQuery<Module[]>({
    queryKey: ["user-modules", id],
    queryFn: () => userAssignedModule(token as string, id),
    enabled: !!token || !!id,
  });

  // Solution 1: Map-based O(n) solution (FASTEST)
  const modules = useMemo(() => {
    if (!data) return [];

    // Create a Map for O(1) lookups
    const panelMap = new Map();
    panels.forEach((panel) => {
      panelMap.set(panel.path, panel);
    });

    const result = [];
    for (let i = 0; i < data.length; i++) {
      const mod = data[i];
      console.log(mod);

      const module = panelMap.get(mod.moduleName);
      if (module) {
        result.push({
          id: mod.id,
          Icon: module.Icon,
          desc: module.desc,
          title: module.title,
          path: module.path,
        });
      }
    }
    return result;
  }, [data]); // Add proper dependencies

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Control Panel
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Manage all aspects of your organization from one centralized
            dashboard. Access different modules to handle inventory, personnel,
            documents, and more.
          </p>
        </div>

        {/* Control Panel Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modules.map((item, index) => (
            <ControlPanelItem
              key={index}
              title={item.title}
              desc={item.desc}
              path={item.path}
              Icon={item.Icon}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
