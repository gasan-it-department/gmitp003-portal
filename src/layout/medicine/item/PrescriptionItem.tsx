import { memo } from "react";
//hooks/
import { useNavigate } from "react-router";
//components and layout
import { TableRow, TableCell } from "@/components/ui/table";
import Modal from "@/components/custom/Modal";

//utils
import { prescriptionStatus } from "@/utils/helper";
import { searchedChar } from "@/utils/element";
import { formatDate } from "@/utils/date";
//interface/props/scheam
import type { Prescription } from "@/interface/data";
interface Props {
  item: Prescription;
  no: number;
  query: string;
}

const PrescriptionItem = ({ item, no, query }: Props) => {
  const nav = useNavigate();
  return (
    <>
      <TableRow
        className=" cursor-pointer hover:bg-neutral-200"
        onClick={() => nav(`/${item.lineId}/medicine/prescription/${item.id}`)}
      >
        <TableCell>{no + 1}</TableCell>
        <TableCell>{searchedChar(query, item.refNumber)}</TableCell>
        <TableCell>{searchedChar(query, item.lastname)}</TableCell>
        <TableCell>{searchedChar(query, item.firstname)}</TableCell>
        <TableCell>{formatDate(item.timestamp)}</TableCell>
        <TableCell>{prescriptionStatus[item.status]}</TableCell>
      </TableRow>
      <Modal
        title={""}
        children={undefined}
        onOpen={false}
        className={""}
        setOnOpen={function (): void | Promise<void> {
          throw new Error("Function not implemented.");
        }}
      />
    </>
  );
};

export default memo(PrescriptionItem);
