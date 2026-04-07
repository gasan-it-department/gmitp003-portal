import { memo } from "react";
//
import { TableCell, TableRow } from "@/components/ui/table";
//
import type { ReceivingRoom } from "@/interface/data";

interface Props {
  room: ReceivingRoom;
  i: number;
  onClick: () => void;
}

const RoomItem = ({ room, i, onClick }: Props) => {
  return (
    <TableRow
      key={room.id}
      className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
      onClick={onClick}
    >
      <TableCell className="font-medium text-gray-500">
        {(i + 1).toString().padStart(2, "0")}
      </TableCell>
      <TableCell className="text-gray-800">{room.address}</TableCell>
      <TableCell>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
          {room.code}
        </span>
      </TableCell>
    </TableRow>
  );
};

export default memo(RoomItem);
