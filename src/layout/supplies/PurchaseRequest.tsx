//import React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useParams, useSearchParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
//
import { getPurchaseRequest } from "@/db/statement";
//
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableRow,
//   TableHeader,
//   TableHead,
// } from "@/components/ui/table";
// import PRItems from "./items/PRItems";
// import SWWItem from "../item/SWWItem";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import PRInfo from "./PRInfo";
import PRList from "./PRList";
import PRConversation from "./PRConversation";
//icons
import { ListCheck, Info, MessageCircle } from "lucide-react";

//
import type { SupplyOrder } from "@/interface/data";

interface ListProps {
  list: SupplyOrder[];
  hasMore: boolean;
  lastCursor: string;
}

// interface Props {
//   auth: ProtectedRouteProps;
// }

const PurchaseRequest = () => {
  const { lineId, purchaseReqId } = useParams();
  const [params, setParams] = useSearchParams({ tabs: "info" });
  const auth = useAuth();
  const {} = useInfiniteQuery<ListProps>({
    queryKey: ["purchase-request", lineId],
    queryFn: ({ pageParam }) =>
      getPurchaseRequest(
        auth.token as string,
        lineId as string,
        pageParam as string | null,
        "20",
        "",
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.lastCursor,
  });

  const currentTabs = params.get("tabs") || "info";

  const handleChangeParams = (key: string, value: string) => {
    setParams(
      (prev) => {
        prev.set(key, value);
        return prev;
      },
      {
        replace: true,
      },
    );
  };
  return (
    <div className=" w-full h-full">
      <TooltipProvider>
        <Tabs
          value={currentTabs}
          className=" w-full h-full"
          onValueChange={(e) => {
            handleChangeParams("tabs", e);
          }}
        >
          <div className=" h-[10%] flex items-center ">
            <TabsList defaultValue="info">
              <TabsTrigger value="info">
                <Info />
                Info
              </TabsTrigger>
              <TabsTrigger value="list">
                <ListCheck />
                List
              </TabsTrigger>
              <TabsTrigger value="comment">
                <MessageCircle />
                Comments
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="info" className=" w-full h-[90%]">
            <PRInfo purchaseReqId={purchaseReqId} auth={auth} />
          </TabsContent>
          <TabsContent value="list" className=" w-full h-[90%]">
            <PRList purchaseReqId={purchaseReqId} auth={auth} />
          </TabsContent>
          <TabsContent value="comment" className=" w-full h-[90%]">
            <PRConversation />
          </TabsContent>
        </Tabs>
      </TooltipProvider>
    </div>
  );
};

export default PurchaseRequest;
