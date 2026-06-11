import { useEffect } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";

import { getMedInbox } from "@/db/statement";
import { url } from "@/db/axios";
import { joinLineRoom } from "@/db/socketClient";

import MedInboxItem from "./item/MedInboxItem";
import { Loader2, Inbox, AlertCircle } from "lucide-react";

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
  const queryClient = useQueryClient();
  const {
    data,
    isFetchingNextPage,
    fetchNextPage,
    isFetching,
    hasNextPage,
    isError,
  } = useInfiniteQuery<ListProps>({
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
    enabled: !!lineId && !!token,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: true,
    // Poll so new low-stock notifications appear without a manual reload.
    // The badge query above pulses every 30 s; we keep the list in sync.
    refetchInterval: 60_000,
  });

  const { ref } = useInView({
    threshold: 0.5,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetching && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
  });

  // ── Real-time: prepend new medicine notifications for this line ──
  useEffect(() => {
    if (!lineId) return;
    return joinLineRoom(lineId, (n) => {
      queryClient.setQueryData<{
        pages: ListProps[];
        pageParams: unknown[];
      }>(["medIbox", lineId], (prev) => {
        if (!prev) return prev;
        const exists = prev.pages.some((p) =>
          p.list.some((m) => m.id === n.id),
        );
        if (exists) return prev;
        const [first, ...rest] = prev.pages;
        if (!first) return prev;
        return {
          ...prev,
          pages: [
            {
              ...first,
              list: [
                {
                  id: n.id,
                  title: n.title,
                  message: n.message,
                  path: n.path ?? null,
                  timestamp: n.timestamp,
                  view: n.view ?? 0,
                  type: n.type ?? 1,
                  userId: n.userId,
                  lineId: n.lineId,
                } as unknown as MedicineNotification,
                ...first.list,
              ],
            },
            ...rest,
          ],
        };
      });
      // Bump the unread badge count immediately.
      queryClient.invalidateQueries({
        queryKey: ["newInboxCount", lineId],
        refetchType: "active",
      });
    });
  }, [lineId, queryClient]);

  const items = data?.pages.flatMap((p) => p.list) ?? [];
  const isInitialLoading = isFetching && items.length === 0;

  if (isInitialLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-1.5 text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p className="text-[10px]">Loading inbox...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full h-full flex items-center justify-center px-3">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <p className="text-[10px] font-medium text-red-600">
            Failed to load inbox
          </p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center px-3">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <Inbox className="h-4 w-4 text-gray-300" />
          </div>
          <p className="text-[10px] font-medium text-gray-500">
            No notifications yet
          </p>
          <p className="text-[10px] text-gray-400 max-w-[180px]">
            Alerts about stock, expiring medicines, and dispensary activity
            will show up here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto px-0.5">
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <MedInboxItem
            key={item.id}
            item={item}
            no={i}
            url={url}
            token={token}
            lineId={lineId}
          />
        ))}

        {hasNextPage && <div ref={ref} className="h-6" />}

        {isFetchingNextPage && (
          <div className="flex items-center justify-center gap-1.5 py-2 text-gray-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-[10px]">Loading more...</span>
          </div>
        )}

        {!hasNextPage && items.length > 0 && (
          <div className="text-center py-1.5">
            <span className="text-[10px] text-gray-400">End of inbox</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedInbox;
