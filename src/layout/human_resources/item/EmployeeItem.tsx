import { memo } from "react";
import { searchedChar } from "@/utils/element";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";

//
import { viewUserProfile } from "@/db/statement";
//components and Layout
import { TableRow, TableCell } from "@/components/ui/table";
import { toast } from "sonner";
//interfaces and props
import { type User } from "@/interface/data";

interface Props {
  item: User;
  no: number;
  query: string;
  token: string;
  userId: string;
}

const EmployeeItem = ({ item, no, query, token, userId }: Props) => {
  const nav = useNavigate();

  const handleView = async () => {};

  const { mutateAsync, isPending } = useMutation({
    mutationFn: () => viewUserProfile(token, item.id, userId),
    onError: () => {
      toast.error("FAILED TO NAVIGATE");
    },
    onSuccess: () => {
      nav(`${item.id}`);
    },
  });
  return (
    <>
      <TableRow
        onClick={() => {
          if (isPending) return;
          mutateAsync();
        }}
        className=" hover:bg-neutral-200 cursor-pointer"
      >
        <TableCell>{no + 1}</TableCell>
        <TableCell>{searchedChar(query, item.lastName)}</TableCell>
        <TableCell>{searchedChar(query, item.firstName)}</TableCell>
        <TableCell>{searchedChar(query, item.middleName) || "N/A"}</TableCell>
        <TableCell>{searchedChar(query, item.username) || "N/A"}</TableCell>
        <TableCell>
          {(item.PositionSlot &&
            searchedChar(query, item.PositionSlot.pos.name)) ||
            "N/A"}
        </TableCell>
      </TableRow>
    </>
  );
};

export default memo(EmployeeItem);
