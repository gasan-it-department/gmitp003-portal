import type { ProtectedRouteProps, SupplyOrder } from "@/interface/data";

//
import { getPurchaseRequestItemList } from "@/db/statement";

//layout and components
import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import PRListItem from "./items/PRListItem";
import SWWItem from "../item/SWWItem";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
//icons
import { Download } from "lucide-react";
//props and interface
import { useInfiniteQuery } from "@tanstack/react-query";

interface Props {
  purchaseReqId: string | undefined;
  auth: ProtectedRouteProps;
}

interface ListProps {
  list: SupplyOrder[];
  lastCursor: string | null;
  hasMore: boolean;
}

const PRList = ({ purchaseReqId, auth }: Props) => {
  const { data } = useInfiniteQuery<ListProps>({
    queryKey: ["purchaseReqList", purchaseReqId],
    queryFn: ({ pageParam }) =>
      getPurchaseRequestItemList(
        auth.token as string,
        purchaseReqId as string,
        pageParam as string | null,
        "20",
        ""
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.lastCursor,
  });

  return (
    <div className=" w-full h-full">
      <TooltipProvider>
        <div className=" w-full p-2 flex justify-end border border-x-0 bg-white">
          <Tooltip delayDuration={500}>
            <TooltipTrigger>
              <Button size="sm" className=" cursor-pointer">
                <Download />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export as</TooltipContent>
          </Tooltip>
        </div>
        <Table>
          <TableHeader className=" border bg-neutral-700">
            <TableHead className=" text-white">Stock No.</TableHead>
            <TableHead className=" text-white">Item</TableHead>
            <TableHead className=" text-white">Item Description</TableHead>
            <TableHead className=" text-white">Quantity</TableHead>
            <TableHead className=" text-white">Unit Cost</TableHead>
            <TableHead className=" text-white">Unit of Measure</TableHead>
            <TableHead className=" text-white">Total Cost</TableHead>
            <TableHead className=" text-white">Remark</TableHead>
          </TableHeader>
          <TableBody>
            {data ? (
              data.pages.flatMap((item) => item.list).length > 0 ? (
                data.pages
                  .flatMap((item) => item.list)
                  .map((item, i) => (
                    <PRListItem key={item.id} no={i} item={item} />
                  ))
              ) : (
                <TableRow>
                  <TableCell className=" text-sm font-medium" colSpan={7}>
                    No Data found!
                  </TableCell>
                </TableRow>
              )
            ) : (
              <SWWItem colSpan={7} />
            )}
          </TableBody>
        </Table>
      </TooltipProvider>
    </div>
  );
};

export default PRList;
