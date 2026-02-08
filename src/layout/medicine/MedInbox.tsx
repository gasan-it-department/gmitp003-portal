// React component
import { useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
//db and libs
import { getMedInbox } from "@/db/statement";
import { url } from "@/db/axios";
//components and layout
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import MedInboxItem from "./item/MedInboxItem";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
//icons
import { CircleAlert } from "lucide-react";

//
import type { MedicineNotification } from "@/interface/data";
interface Props {
  lineId: string | undefined;
  token: string | undefined;
}

interface ListProps {
  list: MedicineNotification[];
  hasMore: boolean;
  lastCursor: string | null;
}

const MedInbox = ({ lineId, token }: Props) => {
  const { ref, inView } = useInView();

  const { data, isFetchingNextPage, fetchNextPage, isFetching, hasNextPage } =
    useInfiniteQuery<ListProps>({
      queryKey: ["medIbox", lineId],
      queryFn: ({ pageParam }) =>
        getMedInbox(
          token as string,
          lineId,
          pageParam as string | null,
          "10",
          "",
        ),
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.lastCursor : undefined,
      initialPageParam: null,
    });

  useEffect(() => {
    if (inView && hasNextPage && !isFetching && !isFetchingNextPage) {
      fetchNextPage().catch((error) => {
        console.error("Error fetching next page:", error);
        toast.error("Failed to load more items");
      });
    }
  }, [inView, hasNextPage, isFetching, isFetchingNextPage, fetchNextPage]);

  // Calculate flattened data once

  return (
    <ScrollArea className="w-full h-full ">
      <ScrollBar />
      {isFetchingNextPage || isFetching ? (
        <Skeleton className=" w-full h-30 mt-2" />
      ) : data ? (
        data.pages.flatMap((item) => item.list).length > 0 ? (
          data.pages
            .flatMap((item) => item.list)
            .map((item, i) => (
              <MedInboxItem
                key={item.id}
                item={item}
                no={i}
                url={url}
                token={token}
                lineId={lineId}
              />
            ))
        ) : (
          <div className=" w-full flex justify-center">
            <p className=" font-medium text-sm text-neutral-600">
              No Inbox yet
            </p>
          </div>
        )
      ) : (
        <div className=" w-full flex justify-center items-center gap-2 mt-2">
          <CircleAlert color="red" size={16} />
          <p className=" font-medium text-sm">Something Went wrong</p>
        </div>
      )}
      <div ref={ref}>
        <div className="text-center py-4">
          {isFetchingNextPage && <p>Loading more...</p>}
        </div>
      </div>
    </ScrollArea>
  );
};

export default MedInbox;
