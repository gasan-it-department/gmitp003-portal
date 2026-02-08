import { memo } from "react";

//utils
import { searchedChar } from "@/utils/element";
//
import { TableRow, TableCell } from "@/components/ui/table";
//
import type { Position } from "@/interface/data";
interface Props {
  onChange: (...event: any[]) => void;
  item: Position;
  no: number;
  query: string;
  onClick: () => void;
}
const SelectPosItem = ({ no, item, query, onClick }: Props) => {
  return (
    <TableRow
      onClick={onClick}
      className=" hover:bg-neutral-200 cursor-pointer"
    >
      <TableCell>{no + 1}</TableCell>
      <TableCell>{searchedChar(query, item.name)}</TableCell>
    </TableRow>
  );
};

export default memo(SelectPosItem);
