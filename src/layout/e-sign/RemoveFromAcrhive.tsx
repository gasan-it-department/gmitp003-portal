import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";

//
import { removeArchiveDocument } from "@/db/statements/document";

import { Button } from "@/components/ui/button";
import Modal from "@/components/custom/Modal";
import ConfirmDelete from "../ConfirmDelete";
import { toast } from "sonner";

interface Props {
  token: string;
  userId: string;
  lineId: string;
  id: string;
  roomId: string;
}

const RemoveFromAcrhive = ({ token, userId, lineId, id, roomId }: Props) => {
  const [isOpen, setIsOpen] = useState(0);

  const nav = useNavigate();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: () => removeArchiveDocument(token, id, userId, lineId),
    onError: (err) => {
      toast.error("TRANSACTION FAILED", {
        description: `${err.message}`,
      });
    },
    onSuccess: async () => {
      setIsOpen(0);
      await queryClient.invalidateQueries({
        queryKey: ["archived-documents", roomId],
        refetchType: "active",
      });
      nav(`/${lineId}/documents/archive`, {
        replace: true,
      });
    },
  });
  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={() => setIsOpen(1)}
      >
        Remove From Archive
      </Button>
      <Modal
        title={undefined}
        children={
          <div>
            <ConfirmDelete
              title="Removal"
              confirmation={"confirm"}
              setOnOpen={() => {
                if (isPending) return;
                setIsOpen(0);
              }}
              onFunction={() => {
                mutateAsync();
              }}
              isLoading={isPending}
            />
          </div>
        }
        footer={1}
        onOpen={isOpen === 1}
        className={""}
        setOnOpen={() => {
          setIsOpen(0);
        }}
      />
    </>
  );
};

export default RemoveFromAcrhive;
