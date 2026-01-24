import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
import { useDebounce } from "use-debounce";
//
import { getPurchaseRequest } from "@/db/statement";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import InboxItem from "./items/InboxItem";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import { ScrollBar, ScrollArea } from "@/components/ui/scroll-area";

//icons
import { SquareCheckBig, Search, ListFilterPlus, View } from "lucide-react";

//
import type { SupplyBatchOrder } from "@/interface/data";
interface ListProps {
  list: SupplyBatchOrder;
  lastCursor: string | null;
  hasMore: boolean;
}
const InventoryInbox = () => {
  const [onMultiSelect, setOnMultiSelect] = useState(false);
  const [params, setParams] = useSearchParams({ view: "0", query: "" });
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 1000);
  const { lineId } = useParams();

  const auth = useAuth();
  const currentQuery = params.get("query") || "";

  const { data, isFetching, isFetchingNextPage, refetch } =
    useInfiniteQuery<ListProps>({
      queryKey: ["purchaseRequests", lineId],
      queryFn: ({ pageParam }) =>
        getPurchaseRequest(
          auth.token as string,
          lineId as string,
          pageParam as string | null,
          "20",
          query
        ),
      initialPageParam: null,
      getNextPageParam: (lastPage) => lastPage.lastCursor,
    });

  const handleChangeParams = (key: string, value: string) => {
    setParams(
      (prev) => {
        prev.set(key, value);
        return prev;
      },
      {
        replace: true,
      }
    );
  };

  useEffect(() => {
    refetch();
  }, [query]);
  return (
    <div className=" w-full h-full bg-white">
      <TooltipProvider>
        <div className=" w-ful h-[10%] p-2 flex items-center gap-2 ">
          <InputGroup className=" bg-white ">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              value={currentQuery}
              placeholder="Search"
              onChange={(e) => {
                e.preventDefault();
                setText(e.target.value);
                handleChangeParams("query", e.target.value);
              }}
            />
          </InputGroup>

          <ButtonGroup>
            <Button
              size="sm"
              className=" cursor-pointer"
              variant={onMultiSelect ? "default" : "outline"}
              onClick={() => {
                setOnMultiSelect(!onMultiSelect);
              }}
            >
              <SquareCheckBig />
            </Button>

            <ButtonGroupSeparator />
            <Button size="sm" variant="outline">
              <View />
            </Button>
            <ButtonGroupSeparator />
            <Button size="sm">
              <ListFilterPlus />
            </Button>
          </ButtonGroup>
        </div>
        <ScrollArea className=" overflow-auto h-[90%] ">
          {isFetchingNextPage || isFetching ? (
            <Skeleton className=" w-full h-20" />
          ) : data ? (
            data.pages.flatMap((item) => item.list).length > 0 ? (
              data.pages
                .flatMap((item) => item.list)
                .map((item) => (
                  <InboxItem
                    item={item}
                    onSelect={onMultiSelect}
                    lineId={lineId}
                  />
                ))
            ) : null
          ) : null}

          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </TooltipProvider>
    </div>
  );
};

export default InventoryInbox;
