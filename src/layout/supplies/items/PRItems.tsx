import { memo, useState } from "react";

import Modal from "@/components/custom/Modal";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
//props and interfaces
import type { SupplyOrder } from "@/interface/data";
interface Props {
  item: SupplyOrder;
  no: number;
}

const PRItems = ({ item, no }: Props) => {
  const [onOpen, setOnOpen] = useState(0);
  return (
    <>
      <TableRow className=" hover:bg-neutral-200 cursor-pointer">
        <TableCell>{no}</TableCell>
        <TableCell>{item.refNumber}</TableCell>
        <TableCell>{item.subject || "N/A"}</TableCell>
        <TableCell>{}</TableCell>
        <TableCell>{item.user?.department?.name || "N/A"}</TableCell>
        <TableCell>{no}</TableCell>
        <TableCell>
          <div className=" flex gap-1">
            <Button size="sm"></Button>
          </div>
        </TableCell>
      </TableRow>
      <Modal
        title={""}
        children={undefined}
        onOpen={onOpen === 1}
        className={""}
        setOnOpen={() => {
          setOnOpen(0);
        }}
      />
    </>
  );
};

export default PRItems;
