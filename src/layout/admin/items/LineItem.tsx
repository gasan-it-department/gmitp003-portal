import { memo, useState } from "react";
import moment from "moment";
//
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
//
import { searchedChar } from "@/utils/element";
import { getStatusBadge } from "@/utils/helper";
//
import type { LineProps } from "@/interface/data";
import {
  Building,
  Calendar,
  MapPin,
  MoreVertical,
  Users,
  Settings,
  PauseCircle,
  Wrench,
  Eye,
  Edit,
  Trash2,
  Power,
  Copy,
  Archive,
} from "lucide-react";

interface Props {
  item: LineProps;
  query: string;
  onAction?: (action: string, line: LineProps) => void;
}

const LineItem = ({ item, query, onAction }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const statusInfo = getStatusBadge(item.status);

  const handleAction = (action: string) => {
    setIsOpen(false);
    onAction?.(action, item);
  };

  const getStatusIcon = () => {
    switch (item.status) {
      case 0:
        return <PauseCircle className="w-4 h-4 text-red-500" />;
      case 1:
        return <Power className="w-4 h-4 text-green-500" />;
      case 2:
        return <Wrench className="w-4 h-4 text-yellow-500" />;
      default:
        return <Settings className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <TooltipProvider>
      <TableRow
        key={item.id}
        className="hover:bg-gray-50 transition-colors group"
      >
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <Building className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {searchedChar(query, item.name)}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <span className="font-mono">ID: {item.id.slice(0, 8)}...</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => navigator.clipboard.writeText(item.id)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Copy ID</p>
                  </TooltipContent>
                </Tooltip>
              </p>
            </div>
          </div>
        </TableCell>

        <TableCell>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm text-gray-700 line-clamp-1">
                  {item.barangay?.name || "N/A"},{" "}
                  {item.municipal?.name || "N/A"}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {/* <p className="text-xs">
                  {[
                    item.barangay?.name,
                    item.municipal?.name,
                    item.province?.name,
                    item.region?.name,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p> */}
              </TooltipContent>
            </Tooltip>
          </div>
        </TableCell>

        <TableCell>
          <Badge
            variant="outline"
            className={`${statusInfo.color} flex items-center gap-1.5 px-2.5 py-1 border`}
          >
            {getStatusIcon()}
            <span className="text-xs font-medium">{statusInfo.label}</span>
          </Badge>
        </TableCell>

        <TableCell>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <Tooltip>
              <TooltipTrigger asChild>
                {/* <span className="text-sm text-gray-700">{formattedDate}</span> */}
              </TooltipTrigger>
              <TooltipContent>
                {/* <p className="text-xs">
                  Created {moment(item.timestamp).fromNow()}
                </p> */}
              </TooltipContent>
            </Tooltip>
          </div>
        </TableCell>

        <TableCell>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm text-gray-700">
                  {item._count?.User || 0} users
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {item._count?.User || 0} active users in this line
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TableCell>

        <TableCell className="text-right">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-70 hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-56 p-2 shadow-lg border border-gray-200 rounded-xl"
              align="end"
              sideOffset={5}
            >
              <div className="space-y-1">
                {/* View Details */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-9 px-3 text-sm"
                  onClick={() => handleAction("view")}
                >
                  <Eye className="w-3.5 h-3.5 mr-2 text-gray-500" />
                  View Details
                </Button>

                {/* Edit */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-9 px-3 text-sm"
                  onClick={() => handleAction("edit")}
                >
                  <Edit className="w-3.5 h-3.5 mr-2 text-blue-500" />
                  Edit Line
                </Button>

                <div className="h-px bg-gray-100 my-1" />

                {/* Status Management */}
                {item.status !== 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-9 px-3 text-sm text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => handleAction("activate")}
                  >
                    <Power className="w-3.5 h-3.5 mr-2" />
                    Activate
                  </Button>
                )}
                {item.status !== 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-9 px-3 text-sm text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                    onClick={() => handleAction("suspend")}
                  >
                    <PauseCircle className="w-3.5 h-3.5 mr-2" />
                    Suspend
                  </Button>
                )}
                {item.status !== 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-9 px-3 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    onClick={() => handleAction("maintenance")}
                  >
                    <Wrench className="w-3.5 h-3.5 mr-2" />
                    Maintenance
                  </Button>
                )}

                <div className="h-px bg-gray-100 my-1" />

                {/* Archive */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-9 px-3 text-sm text-gray-600 hover:text-gray-700"
                  onClick={() => handleAction("archive")}
                >
                  <Archive className="w-3.5 h-3.5 mr-2" />
                  Archive
                </Button>

                {/* Delete */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-9 px-3 text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleAction("delete")}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Delete
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </TableCell>
      </TableRow>
    </TooltipProvider>
  );
};

export default memo(LineItem);
