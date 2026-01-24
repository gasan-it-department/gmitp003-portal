import { useParams } from "react-router";
import { useState, useEffect, useCallback } from "react";
//layout const components
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableRow,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import OverviewSupplyItem from "./items/OverviewSupplyItem";
import hotkeys, { type HotkeysEvent } from "hotkeys-js";
//lib/db/statement
import { suppliesOverview } from "@/db/statement";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { ProtectedRouteProps } from "@/interface/data";

//
import { type SupplyStockTrack } from "@/interface/data";
interface Props {
  listId: string | undefined;
  auth: ProtectedRouteProps;
  query: string;
}

const SupplyOverviewList = ({ listId, auth, query }: Props) => {
  const { lineId, containerId } = useParams();
  const [selected, setSelected] = useState<SupplyStockTrack | null>(null);
  const [indexed, setIndex] = useState(0);
  const { data, isFetching, fetchNextPage, refetch, isFetchingNextPage } =
    useInfiniteQuery<{
      list: SupplyStockTrack[];
      hasMore: boolean;
      lastCursor: string | null;
    }>({
      queryFn: ({ pageParam }) =>
        suppliesOverview(
          auth.token as string,
          pageParam,
          "20",
          query,
          "",
          listId as string
        ),
      queryKey: ["listSupplyOverview", listId],
      initialPageParam: null,
      getNextPageParam: (lastPage) => lastPage.lastCursor,
    });

  useEffect(() => {
    refetch();
  }, [query]);

  const handleHotkeys = useCallback(
    (event: KeyboardEvent, handler: HotkeysEvent) => {
      event.preventDefault();

      if (handler.key === "up") {
        setIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }

      if (handler.key === "down") {
        setIndex((prev) => prev + 1);
      }
    },
    []
  );

  useEffect(() => {
    hotkeys("up, down", handleHotkeys);

    return () => {
      hotkeys.unbind("up, down", handleHotkeys);
    };
  }, [handleHotkeys]);

  return (
    <div className="w-full h-full">
      <Table className=" w-full h-full">
        <TableHeader className="border bg-neutral-700 w-full h-[10%]">
          <TableHead className="text-white">No.</TableHead>
          <TableHead className="text-white">Ref</TableHead>
          <TableHead className="text-white">Item</TableHead>
          <TableHead className="text-white">Product/Brand</TableHead>
          <TableHead className="text-white">Stock</TableHead>
          <TableHead className="text-white">Status</TableHead>
        </TableHeader>
        <TableBody className=" w-full h-[80%] overflow-auto">
          {data ? (
            data.pages.flatMap((item) => item.list).length > 0 ? (
              data.pages
                .flatMap((item) => item.list)
                .map((item, i) => (
                  <OverviewSupplyItem
                    key={item.id}
                    index={i}
                    item={item}
                    onSelect={indexed}
                    lineId={lineId as string}
                    token={auth.token as string}
                    userId={auth.userId as string}
                    listId={listId as string}
                    containerId={containerId as string}
                  />
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className=" text-center">
                  No item found!
                </TableCell>
              </TableRow>
            )
          ) : null}
        </TableBody>
        <TableFooter className="bg-muted/50 mt-auto w-full h-[10%]">
          <TableRow>
            <TableCell colSpan={6} className="text-center">
              Footer content
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};

export default SupplyOverviewList;
