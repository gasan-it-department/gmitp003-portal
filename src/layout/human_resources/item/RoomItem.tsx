import { memo } from "react";

import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Users } from "lucide-react";

import type { ReceivingRoom } from "@/interface/data";

interface Props {
  room: ReceivingRoom;
  i: number;
  onClick: () => void;
}

const RoomItem = ({ room, i, onClick }: Props) => {
  const userCount = room._count?.authorizedUser ?? room.authorizedUser?.length ?? 0;

  return (
    <TableRow
      className="hover:bg-blue-50/40 cursor-pointer"
      onClick={onClick}
    >
      <TableCell className="text-[10px] text-gray-500">
        {(i + 1).toString().padStart(2, "0")}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <Building2 className="h-3 w-3 text-blue-500" />
          <code className="text-[11px] font-mono font-medium text-gray-900">
            {room.code}
          </code>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <MapPin className="h-2.5 w-2.5 text-gray-400 flex-shrink-0" />
          <span className="text-[11px] text-gray-800 truncate">
            {room.address ?? "—"}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 gap-1 ${
            userCount > 0
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-gray-50 text-gray-500 border-gray-200"
          }`}
        >
          <Users className="h-2.5 w-2.5" />
          {userCount}
        </Badge>
      </TableCell>
    </TableRow>
  );
};

export default memo(RoomItem);
