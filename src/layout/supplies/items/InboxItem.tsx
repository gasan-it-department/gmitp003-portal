import { memo } from "react";
import { useNavigate } from "react-router";
//
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
// import {
//   Tooltip,
//   TooltipTrigger,
//   TooltipContent,
// } from "@/components/ui/tooltip";
//
import { inboxTypeIcon } from "@/utils/element";

//icons
//import { ListChecks, Paperclip } from "lucide-react";

import { formatDate } from "@/utils/date";

//
import type { SupplyBatchOrder } from "@/interface/data";
interface Props {
  onSelect: boolean;
  lineId: string | undefined;
  item: SupplyBatchOrder;
}

const InboxItem = ({ onSelect, lineId, item }: Props) => {
  const isViewed = false;
  const nav = useNavigate();

  return (
    <div
      onClick={() => nav(`/${lineId}/supplies/inbox/pr/${item.id}`)}
      className={` w-full p-2 rounded flex border mt-2 border-neutral-400 ${
        isViewed ? " bg-neutral-200" : "bg-white"
      } hover:bg-neutral-100  cursor-pointer `}
    >
      {onSelect && (
        <div className=" px-3 flex items-center">
          <Checkbox checked />
        </div>
      )}

      <div className=" px-4 flex items-center">
        <Avatar className=" w-12 h-12">
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </div>
      <div className=" w-full border border-t-0 border-l-0 ">
        <p className=" w-auto font-medium text-sm hover:underline text-[#181C14] max-w-5/6 lg:max-w-1/2 truncate">
          {item.title}
        </p>
        <p className=" text-sm max-w-5/6 lg:max-w-1/2 truncate">dasdas</p>
        <p className=" text-sm">{formatDate(item.timestamp)}</p>
      </div>
      <div className=" p-2 flex items-center">{inboxTypeIcon[0]}</div>
    </div>
  );
};

export default memo(InboxItem);
