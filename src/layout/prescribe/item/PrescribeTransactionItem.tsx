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
      <TableCell>
        {item.refNumber}
        {(item as { external?: boolean }).external && (
            <span className="ml-1 inline-flex items-center rounded border border-amber-300 bg-amber-50 px-1 text-[9px] font-semibold text-amber-700"
              title={(item as { external?: boolean }).externalSource ? `External prescription — ${(item as { external?: boolean }).externalSource}` : "External prescription (private doctor / another RHU)"}>
              EXTERNAL
            </span>
          )}
      </TableCell>
      <TableCell>{searchedChar(query, item.lastname)}</TableCell>
      <TableCell>{searchedChar(query, item.firstname)}</TableCell>
      <TableCell>{formatDate(item.timestamp)}</TableCell>
      <TableCell>{prescriptionStatus[item.status]}</TableCell>
    </TableRow>
  );
};

export default memo(PrescribeTransactionItem);
