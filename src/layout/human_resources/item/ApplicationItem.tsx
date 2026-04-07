import { memo, useState, type SetStateAction } from "react";
import { data, useNavigate } from "react-router";
import { deleleteApplication } from "@/db/statements/application";
import { useMutation, useQueryClient } from "@tanstack/react-query";
//
import { formatDate } from "@/utils/date";
import { applicationStatus } from "@/utils/helper";
import { searchedChar } from "@/utils/element";
//
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import Modal from "@/components/custom/Modal";
import ConfirmDelete from "@/layout/ConfirmDelete";
//
import type { SubmittedApplicationProps } from "@/interface/data";
import { set } from "zod";

interface Props {
  item: SubmittedApplicationProps;
  no: number;
  query: string;
  onMultiSelect: boolean;
  handleCheckSelected: (id: string) => boolean;
  handleAddSelected: (id: string) => void;
  token: string;
  userId: string;
  lineId: string;
}
const ApplicationItem = ({
  no,
  item,
  query,
  onMultiSelect,
  handleCheckSelected,
  handleAddSelected,
  userId,
  token,
  lineId,
}: Props) => {
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const [onOpen, setOnOpen] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: () => deleleteApplication(item.id, token, userId, lineId),
    onSuccess: () => {
      setIsOpen(false);
      setOnOpen(0);
      queryClient.invalidateQueries({
        queryKey: ["applications", item.lineId],
      });
    },
    onError: (error) => {
      console.error("Error deleting application:", error);
    },
  });
  return (
    <ContextMenu onOpenChange={(open) => setIsOpen(open)}>
      <ContextMenuTrigger
        asChild={true}
        onContextMenu={() => {
          setIsOpen(true);
        }}
      >
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
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>Actions</ContextMenuLabel>
        <ContextMenuItem disabled={isPending} onClick={() => setOnOpen(1)}>
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
      <Modal
        title={"Delete Application"}
        children={
          <ConfirmDelete
            confirmation={"confirm"}
            setOnOpen={setOnOpen}
            onFunction={() => {
              mutateAsync();
            }}
            isLoading={isPending}
          />
        }
        footer={1}
        onOpen={onOpen === 1}
        className={""}
        setOnOpen={() => {
          if (isPending) return;
          setOnOpen(0);
        }}
      />
    </ContextMenu>
  );
};

export default memo(ApplicationItem);
