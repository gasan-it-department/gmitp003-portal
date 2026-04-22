import { memo } from "react";
//
import { TableRow, TableCell } from "@/components/ui/table";
//
import type { User } from "@/interface/data";
interface Props {
  item: User;
  no: number;
}
const PersonnelItem = ({ item, no }: Props) => {
  return (
    <>
      <TableRow className=" cursor-pointer hover:bg-gray-100">
        <TableCell className=" font-medium">{no}</TableCell>
        <TableCell className=" font-medium">{item.lastName}</TableCell>
        <TableCell className=" font-medium">{item.firstName}</TableCell>
        <TableCell className=" font-medium">{item.middleName}</TableCell>
        <TableCell className=" font-medium">
          {item?.PositionSlot?.pos?.name || "N/A"}
        </TableCell>
      </TableRow>
    </>
  );
};

export default memo(PersonnelItem);
