import {} from "react";

//db
import { prescriptionProgress } from "@/db/statement";
//hooks
import { useInfiniteQuery } from "@tanstack/react-query";
//

import {
  Item,
  //ItemActions,
  ItemTitle,
  ItemDescription,
  ItemFooter,
  ItemHeader,
  ItemContent,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
//utils
import { formatDate } from "@/utils/date";
import { prescriptionProgressStatus } from "@/utils/helper";
//
import type { PrescriptionProgress } from "@/interface/data";
interface Props {
  id: string | undefined;
  token: string | undefined;
}
interface ListProps {
  list: PrescriptionProgress[];
  hasMore: boolean;
  lastCursor: string | null;
}

const DispensaryProgress = ({ token, id }: Props) => {
  const { data, isFetching, isFetchingNextPage } = useInfiniteQuery<ListProps>({
    queryKey: ["prescriptionProgress", id],
    queryFn: ({ pageParam }) =>
      prescriptionProgress(
        token as string,
        id,
        pageParam as string | null,
        "20",
        "",
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
  });

  return (
    <div className=" w-full h-full">
      <ScrollArea className=" w-full h-full overflow-auto p-2">
        <ScrollBar />
        {isFetching || isFetchingNextPage ? (
          <Skeleton className=" w-full h-30" />
        ) : data ? (
          data.pages
            .flatMap((item) => item.list)
            .map((item) => (
              <Item
                key={item.id}
                className=" w-full bg-white hover:border-neutral-500 border"
                variant="outline"
              >
                <ItemHeader>
                  <ItemTitle className=" ">
                    {prescriptionProgressStatus[item.step].progress}
                  </ItemTitle>
                </ItemHeader>
                <ItemContent>
                  <ItemDescription>
                    {prescriptionProgressStatus[item.step].desc}
                  </ItemDescription>
                </ItemContent>
                <ItemFooter>{formatDate(item.timestamp)}</ItemFooter>
              </Item>
            ))
        ) : null}
      </ScrollArea>
    </div>
  );
};

export default DispensaryProgress;
