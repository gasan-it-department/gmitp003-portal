import { memo } from "react";

import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import type { User } from "@/interface/data";

interface Props {
  item: User;
  no: number;
}

const PersonnelItem = ({ item, no }: Props) => {
  // The backend returns `Position: { name }` (matched to the `positionId`
  // FK). Earlier code tried to read `PositionSlot?.pos?.name` which never
  // populated and always rendered "N/A".
  const position =
    (item as any).Position?.name ??
    (item as any).PositionSlot?.pos?.name ??
    null;

  return (
    <TableRow className="hover:bg-blue-50/40">
      <TableCell className="text-[10px] text-gray-500">{no}</TableCell>
      <TableCell className="text-[11px] font-medium text-gray-900">
        {item.lastName ?? "—"}
      </TableCell>
      <TableCell className="text-[11px] text-gray-800">
        {item.firstName ?? "—"}
      </TableCell>
      <TableCell className="text-[11px] text-gray-700">
        {item.middleName ?? "—"}
      </TableCell>
      <TableCell>
        {position ? (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200"
          >
            {position}
          </Badge>
        ) : (
          <span className="text-[10px] text-gray-400 italic">No position</span>
        )}
      </TableCell>
    </TableRow>
  );
};

export default memo(PersonnelItem);
