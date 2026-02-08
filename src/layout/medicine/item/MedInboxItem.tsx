import { memo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
//
import { useNavigate } from "react-router";
//
import { viewMedicineNotification } from "@/db/statement";
//
import {
  Item,
  ItemContent,
  ItemHeader,
  //ItemMedia,
  ItemFooter,
  // ItemTitle,
  ItemDescription,
} from "@/components/ui/item";
import { toast } from "sonner";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuContent,
  //ContextMenuLabel,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Spinner } from "@/components/ui/spinner";
//
import type { MedicineNotification } from "@/interface/data";

import { formatDate } from "@/utils/date";

interface Props {
  item: MedicineNotification;
  no: number;
  url: string;
  token: string | undefined;
  lineId: string | undefined;
}

const MedInboxItem = ({ item, token, lineId }: Props) => {
  const nav = useNavigate();
  const queryClient = useQueryClient();

  const handleNav = async () => {
    if (!item.path) return;
    if (item.view === 1) return nav(`${item.path}`);
    await viewMedicineNotification(token, item.id);
    nav(`${item.path}`);
  };

  const { mutateAsync, isPending } = useMutation({
    mutationFn: handleNav,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["medIbox", lineId],
        refetchType: "active",
      });
    },
    onError: (err) => {
      toast.error("Failed to navigate.", {
        description: err.message,
        closeButton: false,
      });
    },
  });
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Item
          onClick={() => mutateAsync()}
          variant="outline"
          className={` bg-white cursor-pointer border hover:border-green-400 mt-2 ${
            item.view === 0 ? " bg-neutral-200 border-green-500" : ""
          }`}
        >
          <ItemHeader
            className={` ${
              item.view === 0 ? " font-medium" : ""
            } flex items-center`}
          >
            {item.title}
            {isPending && <Spinner />}
          </ItemHeader>
          <ItemContent>
            <ItemDescription className=" truncate">
              {item.message}
            </ItemDescription>
          </ItemContent>
          <ItemFooter>{formatDate(item.timestamp)}</ItemFooter>
        </Item>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Mark as View</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default memo(MedInboxItem);
