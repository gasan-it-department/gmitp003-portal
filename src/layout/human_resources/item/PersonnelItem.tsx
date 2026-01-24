import React from "react";

//

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
      <TableRow>
        <TableCell className=" font-medium">{no + 1}</TableCell>
        <TableCell className=" font-medium">{item.lastName}</TableCell>
        <TableCell className=" font-medium">{item.firstName}</TableCell>
      </TableRow>
    </>
  );
};

export default PersonnelItem;
