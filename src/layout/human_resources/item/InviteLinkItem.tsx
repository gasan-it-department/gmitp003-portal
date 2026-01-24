import { useState, memo } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
//components and layout
import { TableRow, TableCell } from "@/components/ui/table";
import Modal from "@/components/custom/Modal";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
//icons
import { Trash, Pause, Eye } from "lucide-react";
//utils
import { formatDate } from "@/utils/date";
import { inviteLinkStatus } from "@/utils/helper";

//db
import { deleteInviteLink } from "@/db/statement";
//interface and Props
import type {
  InvitationLinkProps,
  ProtectedRouteProps,
} from "@/interface/data";

interface Props {
  no: number;
  item: InvitationLinkProps;
  auth: ProtectedRouteProps;
  lineId: string | undefined;
}

const InviteLinkItem = ({ no, item, auth, lineId }: Props) => {
  const [onOpen, setOnOpen] = useState(0);

  const nav = useNavigate();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () =>
      deleteInviteLink(
        auth.token as string,
        item.id,
        auth.userId as string,
        lineId as string
      ),
    mutationKey: ["delete-link", item.id],
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["invitations", lineId],
        refetchType: "active",
      });
      setOnOpen(0);
    },
    onError: () => {
      toast.error("Failed to delete.", {
        closeButton: false,
        description: "Something went wrong",
      });
    },
  });

  return (
    <>
      <TableRow
        className=" hover:bg-neutral-200 cursor-pointer"
        onClick={() => setOnOpen(1)}
      >
        <TableCell>{no}</TableCell>
        <TableCell>{item.code}</TableCell>
        <TableCell>{formatDate(item.createdAt)}</TableCell>
        <TableCell>{formatDate(item.expiresAt)}</TableCell>
        <TableCell>{inviteLinkStatus(item.status)}</TableCell>
      </TableRow>
      <Modal
        title={`Invite Link Code: ${item.code}`}
        onOpen={onOpen === 1}
        className={""}
        setOnOpen={() => setOnOpen(0)}
      >
        <div className=" w-full ">
          <div>
            <p className=" font-medium font-mono">Code: {item.code}</p>
            <p className=" font-medium font-mono">
              Date Created: {formatDate(item.createdAt)}
            </p>
            <p className=" font-medium font-mono">
              Date Expiration: {formatDate(item.expiresAt)}
            </p>
          </div>
          <div className=" w-full flex gap-2 mt-6">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setOnOpen(2)}
            >
              <Trash />
              Delete
            </Button>
            <Button size="sm" variant="outline" onClick={() => setOnOpen(3)}>
              <Pause /> Suspend
            </Button>
            <Button size="sm" variant="outline" onClick={() => nav(item.url)}>
              <Eye /> Visit
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title={`Delete Invite Link Code: ${item.code}`}
        onOpen={onOpen === 2}
        className={" min-w-20"}
        setOnOpen={() => {
          if (isPending) return;
          setOnOpen(0);
        }}
        footer={true}
        yesTitle="Confirm"
        onFunction={() => mutateAsync()}
        loading={isPending}
      >
        <p className=" text-neutral-800">
          Are you sure you want to delete this "Invite Link"?
        </p>
        <p className="  text-orange-500">
          WARNING: This action cannot be undo afterwards.
        </p>
        <p className=" text-neutral-600 text-sm">
          It will not affect the registered user from this link.
        </p>
      </Modal>

      <Modal
        title={`Suspend Link Code: ${item.code}`}
        children={undefined}
        onOpen={onOpen === 3}
        className={""}
        setOnOpen={() => {
          if (isPending) return;
          setOnOpen(0);
        }}
      />
    </>
  );
};

export default memo(InviteLinkItem);
