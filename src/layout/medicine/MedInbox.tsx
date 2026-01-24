// React component
import { useEffect } from "react";
import { useMutation, useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
//db and libs
import axios from "@/db/axios";
import { getMedInbox } from "@/db/statement";
import { url } from "@/db/axios";
//components and layout
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import MedInboxItem from "./item/MedInboxItem";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
//icons
import { RotateCcw, CircleAlert } from "lucide-react";

import { socket } from "@/db/socket";

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
  const sendNotification = async () => {
    try {
      const response = await axios.post("/notification/send", {
        userId: "3e8d2296-4806-430c-8b1e-b888b7afa0e9",
        title: "Test Notification",
        message: "This is a test notification message",
        type: "info",
      });

      console.log("Notification sent:", response.data);
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  const { mutateAsync, isPending } = useMutation({
    mutationFn: sendNotification,
    onSuccess: () => {
      console.log("OK");
    },
    onError: (err) => {
      console.log(err);
    },
  });

  const {
    data,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    isFetching,
    hasNextPage,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["medIbox", lineId],
    queryFn: ({ pageParam }) =>
      getMedInbox(
        token as string,
        lineId,
        pageParam as string | null,
        "10",
        ""
      ),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    initialPageParam: null,
  });

  console.log({ data });

  useEffect(() => {
    if (inView && hasNextPage && !isFetching && !isFetchingNextPage) {
      fetchNextPage().catch((error) => {
        console.error("Error fetching next page:", error);
        toast.error("Failed to load more items");
      });
    }
  }, [inView, hasNextPage, isFetching, isFetchingNextPage, fetchNextPage]);

  // Calculate flattened data once
  const allMedicines = data?.pages.flatMap((page) => page.list) || [];
  const totalCount = allMedicines.length;

  return (
    <ScrollArea className="w-full h-full ">
      <ScrollBar />
      <div className="w-full flex justify-end">
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => mutateAsync()}
        >
          <RotateCcw />
        </Button>
      </div>
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
