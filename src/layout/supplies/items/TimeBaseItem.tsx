import React from "react";

//components and Layout
import { TableRow, TableCell } from "@/components/ui/table";

//interfaces/types/props
import { type TimebaseGroupPriceProps } from "@/interface/data";
interface Props {
  item: TimebaseGroupPriceProps;
  index: number;
  rangeYear: number[];
}

const TimeBaseItem = ({ index, item, rangeYear }: Props) => {
  return (
    <>
      <TableRow>
        <TableCell>{index + 1}</TableCell>
        <TableCell>{item.name}</TableCell>
        <TableCell>
          {rangeYear.length === 2
            ? item.secondhalfRecieved
            : item.firstHalfRecieved}
        </TableCell>
        <TableCell>
          {rangeYear.length === 2 ? item.secondhalfCost : item.firstHalfCost}
        </TableCell>

        <TableCell>
          {rangeYear.length === 1
            ? item.firstHalfRecieved
            : item.secondhalfRecieved}
        </TableCell>
        <TableCell>
          {rangeYear.length === 1 ? item.firstHalfCost : item.secondhalfCost}
        </TableCell>
        <TableCell>{item.totalQuantity}</TableCell>
        <TableCell>
          <div className="flex justify-center gap-6 text-xs mt-1">
            <span>{item.firstHalfdispense}</span>
            <span>{item.secondHalfDispense}</span>
          </div>
        </TableCell>
        <TableCell>{item.totalInsuance}</TableCell>
        <TableCell>{item.totalBalanceQuantity}</TableCell>
        <TableCell>{item.totalQuantity}</TableCell>
      </TableRow>
    </>
  );
};

export default TimeBaseItem;
