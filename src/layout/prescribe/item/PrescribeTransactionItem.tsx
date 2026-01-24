import { memo } from "react";
import { useNavigate } from "react-router";
//
import { searchedChar } from "@/utils/element";
import { formatDate } from "@/utils/date";
import { prescriptionStatus } from "@/utils/helper";
//
import { TableRow, TableCell } from "@/components/ui/table";

//
import type { Prescription } from "@/interface/data";
interface Props {
  item: Prescription;
  no: number;
  query: string;
}

const PrescribeTransactionItem = ({ item, no, query }: Props) => {
  const nav = useNavigate();
  return (
    <TableRow
      className=" hover:bg-neutral-200 cursor-pointer"
      onClick={() => nav(`transaction/${item.id}`)}
    >
      <TableCell>{no}</TableCell>
      <TableCell>{item.refNumber}</TableCell>
      <TableCell>{searchedChar(query, item.lastname)}</TableCell>
      <TableCell>{searchedChar(query, item.firstname)}</TableCell>
      <TableCell>{formatDate(item.timestamp)}</TableCell>
      <TableCell>{prescriptionStatus[item.status]}</TableCell>
    </TableRow>
  );
};

export default memo(PrescribeTransactionItem);
