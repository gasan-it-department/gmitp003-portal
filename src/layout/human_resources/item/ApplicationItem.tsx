import { memo } from "react";
import { useNavigate } from "react-router";
//
import { formatDate } from "@/utils/date";
import { applicationStatus } from "@/utils/helper";
import { searchedChar } from "@/utils/element";
//
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
//
import type { SubmittedApplicationProps } from "@/interface/data";

interface Props {
  item: SubmittedApplicationProps;
  no: number;
  query: string;
  onMultiSelect: boolean;
  handleCheckSelected: (id: string) => boolean;
  handleAddSelected: (id: string) => void;
}
const ApplicationItem = ({
  no,
  item,
  query,
  onMultiSelect,
  handleCheckSelected,
  handleAddSelected,
}: Props) => {
  const nav = useNavigate();
  return (
    <TableRow
      className=" hover:bg-neutral-200 cursor-pointer"
      onClick={() => {
        if (onMultiSelect) {
          handleAddSelected(item.id);
          return;
        }
        nav(item.id);
      }}
    >
      {onMultiSelect && (
        <TableCell>
          <Checkbox checked={handleCheckSelected(item.id)} />
        </TableCell>
      )}
      <TableCell>{no}</TableCell>
      <TableCell>{item?.forPosition?.name || "N/A"}</TableCell>
      <TableCell className=" truncate max-w-40">
        {searchedChar(query, item.lastname)},{" "}
        {searchedChar(query, item.firstname)}{" "}
      </TableCell>
      <TableCell>{formatDate(item.timestamp)}</TableCell>
      <TableCell>{applicationStatus[item.status]}</TableCell>
    </TableRow>
  );
};

export default memo(ApplicationItem);
