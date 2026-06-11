import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { removeArchiveDocument } from "@/db/statements/document";

import { Button } from "@/components/ui/button";
import Modal from "@/components/custom/Modal";
import ConfirmDelete from "../ConfirmDelete";
import { Trash2 } from "lucide-react";

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
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ??
        (err instanceof Error ? err.message : "Failed to remove archive");
      toast.error(msg);
    },
    onSuccess: async () => {
      setIsOpen(0);
      toast.success("Archive removed");
      // Invalidate both the list and the detail caches so the UI updates
      await queryClient.invalidateQueries({
        queryKey: ["archived-documents", roomId],
        refetchType: "active",
      });
      await queryClient.invalidateQueries({
        queryKey: ["archive-detail", id],
        refetchType: "active",
      });
      nav(`/${lineId}/documents/archive`, { replace: true });
    },
  });

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full h-7 text-xs gap-1.5 justify-start text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
        onClick={() => setIsOpen(1)}
        disabled={isPending}
      >
        <Trash2 className="h-3 w-3" />
        Remove from Archive
      </Button>

      <Modal
        title={undefined}
        children={
          <ConfirmDelete
            title="Removal"
            confirmation={"confirm"}
            setOnOpen={() => {
              if (isPending) return;
              setIsOpen(0);
            }}
            onFunction={() => {
              if (!isPending) mutateAsync();
            }}
            isLoading={isPending}
          />
        }
        footer={1}
        onOpen={isOpen === 1}
        className=""
        setOnOpen={() => {
          if (isPending) return;
          setIsOpen(0);
        }}
      />
    </>
  );
};

export default RemoveFromAcrhive;
