import { memo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { viewMedicineNotification } from "@/db/statement";

import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Loader2, Calendar } from "lucide-react";

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
    if (item.view === 1) return nav(item.path);
    await viewMedicineNotification(token, item.id);
    nav(item.path);
  };

  const { mutateAsync, isPending } = useMutation({
    mutationFn: handleNav,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["medIbox", lineId],
        refetchType: "active",
      }),
    onError: (err) =>
      toast.error("Failed to open notification.", {
        description: err.message,
      }),
  });

  const isUnread = item.view === 0;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          type="button"
          onClick={() => mutateAsync()}
          disabled={isPending}
          className={`group w-full text-left border rounded-md bg-white hover:border-blue-300 hover:bg-blue-50/30 transition-colors overflow-hidden ${
            isUnread ? "border-l-2 border-l-blue-500" : ""
          }`}
        >
          <div className="px-2 py-1.5">
            <div className="flex items-center justify-between gap-1.5">
              <p
                className={`text-[11px] truncate group-hover:text-blue-700 ${
                  isUnread
                    ? "font-semibold text-gray-900"
                    : "font-medium text-gray-700"
                }`}
              >
                {item.title}
              </p>
              <div className="flex items-center gap-1 flex-shrink-0">
                {isPending && (
                  <Loader2 className="h-2.5 w-2.5 animate-spin text-blue-500" />
                )}
                {isUnread && !isPending && (
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                )}
              </div>
            </div>
            <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5">
              {item.message}
            </p>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
              <Calendar className="h-2.5 w-2.5" />
              {formatDate(item.timestamp)}
            </div>
          </div>
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem className="text-xs">Mark as viewed</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default memo(MedInboxItem);
