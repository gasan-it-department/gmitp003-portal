import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { newInboxCount } from "@/db/statement";
import { scanLowStock } from "@/db/statements/storage";
import { useAuth } from "@/provider/ProtectedRoute";
import { useParams } from "react-router";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Inbox, Loader2, RefreshCw, BellRing } from "lucide-react";

import MedInbox from "./MedInbox";

interface Props {
  lineId: string | undefined;
  token: string | undefined;
}

const Notification = ({ lineId, token }: Props) => {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const { lineId: routeLineId } = useParams();
  const activeLineId = lineId ?? routeLineId;

  // Auto-refresh badge + inbox every 30 s so low-stock alerts surface
  // without the user needing to reload.
  const { data, isFetching, refetch } = useQuery<{
    message: "OK";
    count: number;
  }>({
    queryKey: ["newInboxCount", activeLineId],
    queryFn: () => newInboxCount(token, activeLineId),
    enabled: !!activeLineId && !!token,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });

  const { mutateAsync: runScan, isPending: isScanning } = useMutation({
    mutationFn: () =>
      scanLowStock(auth.token as string, activeLineId as string),
    onSuccess: async (r) => {
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ["medIbox", activeLineId] }),
      ]);
      if (r?.notified > 0) {
        toast.success(
          `${r.notified} alert${r.notified === 1 ? "" : "s"} sent`,
          {
            description: `${r.belowThreshold} stock row${r.belowThreshold === 1 ? "" : "s"} below threshold.`,
          },
        );
      } else {
        toast.message("All stock levels look healthy.");
      }
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ??
        (err instanceof Error ? err.message : "Scan failed");
      toast.error(msg);
    },
  });

  const unread = data?.count ?? 0;

  return (
    <Tabs defaultValue="inbox" className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between gap-1.5 flex-shrink-0">
        <TabsList className="h-7 p-0.5 flex-1">
          <TabsTrigger
            value="inbox"
            className="text-[10px] gap-1.5 data-[state=active]:text-blue-700"
          >
            <Inbox className="h-3 w-3" />
            Inbox
            {isFetching ? (
              <Loader2 className="h-2.5 w-2.5 animate-spin text-gray-400" />
            ) : (
              unread > 0 && (
                <Badge
                  variant="destructive"
                  className="h-3.5 px-1 text-[9px] leading-none ml-0.5"
                >
                  {unread > 99 ? "99+" : unread}
                </Badge>
              )
            )}
          </TabsTrigger>
        </TabsList>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => runScan()}
          disabled={isScanning || !activeLineId}
          className="h-7 w-7 p-0 flex-shrink-0"
          title="Scan stock levels and send pending alerts"
        >
          {isScanning ? (
            <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
          ) : (
            <BellRing className="h-3 w-3 text-gray-500" />
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-7 w-7 p-0 flex-shrink-0"
          title="Refresh inbox"
        >
          <RefreshCw
            className={`h-3 w-3 text-gray-500 ${isFetching ? "animate-spin" : ""}`}
          />
        </Button>
      </div>
      <TabsContent
        value="inbox"
        className="flex-1 min-h-0 mt-2 overflow-hidden"
      >
        <MedInbox lineId={activeLineId} token={token} />
      </TabsContent>
    </Tabs>
  );
};

export default Notification;
