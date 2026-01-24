import { TableRow, TableCell } from "@/components/ui/table";
import Modal from "@/components/custom/Modal";

//utils
import { searchedChar } from "@/utils/element";

//hooks
import { useState } from "react";
//props and types
import { type User } from "@/interface/data";
interface Props {
  no: number;
  item: User;
  query?: string;
}
const PeopleItem = ({ item, no, query }: Props) => {
  const [onOpen, setOnOpen] = useState(0);
  return (
    <>
      <TableRow
        className=" hover:bg-neutral-200 cursor-pointer"
        onClick={() => setOnOpen(1)}
      >
        <TableCell className=" font-medium">{no}</TableCell>
        <TableCell>{item.username}</TableCell>
        <TableCell>{searchedChar(query as string, item.firstName)}</TableCell>
        <TableCell>{searchedChar(query as string, item.lastName)}</TableCell>
        <TableCell>{item.middleName}</TableCell>
        <TableCell>{item.email}</TableCell>
        <TableCell>{item.Position?.name || "N/A"}</TableCell>
        <TableCell>{item.department?.name || "N/A"}</TableCell>
        <TableCell>{item.status}</TableCell>
      </TableRow>
      <Modal
        onOpen={onOpen === 1}
        setOnOpen={() => setOnOpen(0)}
        title={`${item.lastName}, ${item.firstName}`}
        className={""}
      >
        <div className=" w-full h-full">User Info</div>
      </Modal>
    </>
  );
};

export default PeopleItem;
