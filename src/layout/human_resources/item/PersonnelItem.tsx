import { memo } from "react";

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
        <TableCell className=" font-medium">{no}</TableCell>
        <TableCell className=" font-medium">{item.lastName}</TableCell>
        <TableCell className=" font-medium">{item.firstName}</TableCell>
        <TableCell className=" font-medium">{item.middleName}</TableCell>
        <TableCell className=" font-medium">
          {item.Position?.name || "N/A"}
        </TableCell>
      </TableRow>
    </>
  );
};

export default memo(PersonnelItem);
