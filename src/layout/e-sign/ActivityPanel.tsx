// The Document module's Activity panel.
//
// It used to be a mock — three invented alerts about Contract-2024-Q1.pdf,
// a hardcoded "3" on the badge, and a summary that said 24 documents had
// been processed today no matter what day it was. Everything below is the
// office's own data.
//
// Three tabs, in the order the questions get asked:
//   Pinned  — what is waiting on you, and where did our own routings get to
//   Alerts  — the live notification feed, same source as the header bell
//   Logs    — the municipality's Document activity trail
//
// Live in two senses: the socket prepends new alerts as they land, and the
// same event quietly refetches the pinned piles, because a notification
// saying "X signed your document" and a panel still showing it unsigned is
// worse than no panel at all.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import {
  AlertCircle,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  FileClock,
  Inbox,
  Loader2,
  PenLine,
  RefreshCw,
  Send,
} from "lucide-react";

import {
  acknowledgeReceipt,
  documentActivity,
  documentActivityLog,
  type ActivityArrived,
  type ActivityLogRow,
  type DocumentActivity,
} from "@/db/statements/document";
import { userNotifications } from "@/db/statement";
import { markNotificationAsRead } from "@/db/statements/notification";
import { getSocket, joinUserRoom } from "@/db/socketClient";

import type { Notification } from "@/interface/data";

interface Props {
  token: string;
  userId: string;
  /** The office this panel is reporting on. */
  roomId: string;
  /** For links out of the panel into the routing screens. */
  lineId: string;
}

interface NotifPage {
  list: Notification[];
  lastCursor: string | null;
  hasMore: boolean;
}

interface LogPage {
  list: ActivityLogRow[];
  lastCursor: string | null;
  hasMore: boolean;
}

// ── Small shared bits ──────────────────────────────────────────────────

/** "3m", "2h", "Tue" — a narrow column has no room for a full date. */
const ago = (value: string | Date | null | undefined): string => {
  if (!value) return "";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";
  const mins = Math.round((Date.now() - then) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

/** An average waiting time, in the largest unit that stays readable. */
const duration = (ms: number | null): string => {
  if (ms === null) return "—";
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `${mins}m`;
  const hrs = ms / 3_600_000;
  if (hrs < 48) return `${hrs.toFixed(1)}h`;
  return `${(hrs / 24).toFixed(1)}d`;
};

const SectionHead = ({
  icon,
  label,
  count,
  tone = "gray",
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  tone?: "gray" | "amber" | "blue" | "emerald";
}) => {
  const tones: Record<string, string> = {
    gray: "bg-gray-50 text-gray-700",
    amber: "bg-amber-50 text-amber-800",
    blue: "bg-blue-50 text-blue-800",
    emerald: "bg-emerald-50 text-emerald-800",
  };
  return (
    <div
      className={`px-2.5 py-1.5 border-b flex items-center gap-1.5 ${tones[tone]}`}
    >
      {icon}
      <span className="text-[10px] font-semibold">{label}</span>
      {typeof count === "number" && count > 0 && (
        <span className="ml-auto text-[10px] font-semibold tabular-nums">
          {count}
        </span>
      )}
    </div>
  );
};

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="border rounded-lg bg-white overflow-hidden">{children}</div>
);

const Empty = ({ text }: { text: string }) => (
  <p className="px-2.5 py-3 text-[10px] text-gray-400 text-center">{text}</p>
);

/** Two numbers as a bar. Used for signatures and for receipts. */
const Meter = ({
  done,
  total,
  label,
  tone,
}: {
  done: number;
  total: number;
  label: string;
  tone: string;
}) => (
  <div className="flex items-center gap-1.5">
    <span className="text-[10px] text-gray-500 w-14 flex-shrink-0">{label}</span>
    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
      <div
        className={`h-full rounded-full ${tone}`}
        style={{ width: total > 0 ? `${(done / total) * 100}%` : "0%" }}
      />
    </div>
    <span className="text-[10px] text-gray-600 tabular-nums w-7 text-right flex-shrink-0">
      {done}/{total}
    </span>
  </div>
);

// ── The panel ──────────────────────────────────────────────────────────

const ActivityPanel = ({ token, userId, roomId, lineId }: Props) => {
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("pinned");
  const [live, setLive] = useState(() => getSocket().connected);

  // ── Pinned: one request for the whole "needs you" view ─────────────
  const activityKey = useMemo(
    () => ["document-activity", roomId] as const,
    [roomId],
  );
  const {
    data: act,
    isLoading: actLoading,
    isFetching: actFetching,
    refetch: refetchActivity,
  } = useQuery<DocumentActivity>({
    queryKey: activityKey,
    queryFn: () => documentActivity(token, roomId),
    enabled: !!token && !!roomId,
    // A quiet floor under the socket: if an event is ever missed, the
    // panel is still no more than a couple of minutes stale.
    refetchInterval: 120_000,
    refetchOnWindowFocus: true,
  });

  // ── Alerts: the same feed as the header bell ───────────────────────
  const notifKey = useMemo(() => ["notifications", userId] as const, [userId]);
  const {
    data: notifData,
    isLoading: notifLoading,
    isFetchingNextPage: notifFetchingNext,
    hasNextPage: notifHasNext,
    fetchNextPage: fetchMoreNotifs,
  } = useInfiniteQuery<NotifPage>({
    queryKey: notifKey,
    queryFn: ({ pageParam }) =>
      userNotifications(token, userId, pageParam as string | null, "10"),
    initialPageParam: null,
    getNextPageParam: (last) => (last.hasMore ? last.lastCursor : undefined),
    enabled: !!token && !!userId,
    refetchOnWindowFocus: false,
  });
  const notifications = useMemo(
    () => notifData?.pages.flatMap((p) => p.list) ?? [],
    [notifData],
  );
  const unread = notifications.filter((n) => !n.isRead).length;

  // ── Logs: the municipality's Document trail ────────────────────────
  const {
    data: logData,
    isLoading: logLoading,
    isFetchingNextPage: logFetchingNext,
    hasNextPage: logHasNext,
    fetchNextPage: fetchMoreLogs,
  } = useInfiniteQuery<LogPage>({
    queryKey: ["document-activity-log", roomId],
    queryFn: ({ pageParam }) =>
      documentActivityLog(token, roomId, pageParam as string | null, "20"),
    initialPageParam: null,
    getNextPageParam: (last) => (last.hasMore ? last.lastCursor : undefined),
    enabled: !!token && !!roomId,
    refetchOnWindowFocus: false,
  });
  const logs = useMemo(
    () => logData?.pages.flatMap((p) => p.list) ?? [],
    [logData],
  );

  // ── Real time ──────────────────────────────────────────────────────
  // Coalesce: signing a routing with four recipients fires several
  // notifications within a second, and each one must not cost a refetch.
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: activityKey });
      queryClient.invalidateQueries({ queryKey: ["document-activity-log", roomId] });
    }, 700);
  }, [queryClient, activityKey, roomId]);

  useEffect(() => {
    if (!userId) return;
    const off = joinUserRoom(userId, (n) => {
      // Prepend into the same cache the bell reads, so the two never
      // disagree about what has arrived.
      queryClient.setQueryData<{ pages: NotifPage[]; pageParams: unknown[] }>(
        notifKey,
        (prev) => {
          if (!prev) return prev;
          if (prev.pages.some((p) => p.list.some((m) => m.id === n.id)))
            return prev;
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
                    content: n.content,
                    path: n.path ?? null,
                    createdAt: n.createdAt,
                    isRead: n.isRead ?? false,
                  } as unknown as Notification,
                  ...first.list,
                ],
              },
              ...rest,
            ],
          };
        },
      );
      scheduleRefresh();
    });
    return () => {
      off();
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [userId, queryClient, notifKey, scheduleRefresh]);

  // Whether the socket is actually up. Shown, because a panel that
  // claims to be live and silently is not is the worst of both.
  useEffect(() => {
    const s = getSocket();
    const up = () => setLive(true);
    const down = () => setLive(false);
    s.on("connect", up);
    s.on("disconnect", down);
    setLive(s.connected);
    return () => {
      s.off("connect", up);
      s.off("disconnect", down);
    };
  }, []);

  // ── Actions ────────────────────────────────────────────────────────
  const openRouting = (queueId: string | null) => {
    if (!queueId) return;
    nav(`/${lineId}/documents/dissemination/view/${queueId}`);
  };

  const receipt = useMutation({
    mutationFn: (targetRoomId: string) =>
      acknowledgeReceipt(token, { targetRoomId, received: true }),
    onSuccess: () => {
      toast.success("Marked received");
      queryClient.invalidateQueries({ queryKey: activityKey });
      queryClient.invalidateQueries({ queryKey: ["dissemination-inbox"] });
    },
    onError: (e: unknown) => {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Could not mark it received.";
      toast.error(msg);
    },
  });

  const readOne = useMutation({
    mutationFn: (id: string) => markNotificationAsRead(token, userId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notifKey }),
  });

  const needs = act?.needsYou;
  const pinnedCount =
    (needs?.toSignTotal ?? 0) +
    (needs?.toOpenTotal ?? 0) +
    (needs?.toReceiveTotal ?? 0);

  // A single arrived row, used by both the unopened and unreceived piles.
  const ArrivedRow = ({
    row,
    action,
  }: {
    row: ActivityArrived;
    action?: "receive";
  }) => (
    <div className="px-2.5 py-2 hover:bg-gray-50">
      <button
        type="button"
        onClick={() => openRouting(row.queueId)}
        className="w-full text-left"
      >
        <p className="text-[10px] font-medium text-gray-900 truncate">
          {row.title}
        </p>
        <p className="text-[10px] text-gray-500 truncate">
          from {row.from}
          {row.copyFurnished && (
            <span className="text-gray-400"> · copy furnished</span>
          )}
        </p>
        <p className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-0.5">
          <Clock className="h-2 w-2" /> {ago(row.arrivedAt)}
        </p>
      </button>
      {action === "receive" && (
        <Button
          size="sm"
          variant="outline"
          disabled={receipt.isPending}
          onClick={() => receipt.mutate(row.targetId)}
          className="mt-1.5 h-6 w-full text-[10px] gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
        >
          {receipt.isPending && receipt.variables === row.targetId ? (
            <Loader2 className="h-2.5 w-2.5 animate-spin" />
          ) : (
            <Check className="h-2.5 w-2.5" />
          )}
          Mark received
        </Button>
      )}
    </div>
  );

  return (
    <Tabs
      value={tab}
      onValueChange={setTab}
      className="flex-1 flex flex-col min-h-0"
    >
      {/* Tab strip */}
      <div className="px-2 py-1.5 border-b bg-gray-50 flex-shrink-0">
        <TabsList className="w-full h-7 bg-white border p-0.5">
          <TabsTrigger
            value="pinned"
            className="flex-1 h-6 text-[10px] data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none gap-1"
          >
            <AlertCircle className="h-2.5 w-2.5" />
            Pinned
            {pinnedCount > 0 && (
              <Badge className="h-3.5 px-1 text-[9px] leading-none ml-0.5 bg-amber-500 hover:bg-amber-500">
                {pinnedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="alerts"
            className="flex-1 h-6 text-[10px] data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none gap-1"
          >
            <Bell className="h-2.5 w-2.5" />
            Alerts
            {unread > 0 && (
              <Badge className="h-3.5 px-1 text-[9px] leading-none ml-0.5">
                {unread}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="logs"
            className="flex-1 h-6 text-[10px] data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none gap-1"
          >
            <FileClock className="h-2.5 w-2.5" />
            Logs
          </TabsTrigger>
        </TabsList>
      </div>

      {/* ── Pinned ─────────────────────────────────────────────────── */}
      <TabsContent
        value="pinned"
        className="flex-1 overflow-auto p-2 space-y-2 mt-0 data-[state=inactive]:hidden"
      >
        {actLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        ) : (
          <>
            {pinnedCount === 0 && (
              <Card>
                <div className="px-2.5 py-6 text-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto mb-1.5" />
                  <p className="text-[10px] font-medium text-gray-700">
                    Nothing is waiting on you
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Signed, opened and receipted.
                  </p>
                </div>
              </Card>
            )}

            {/* Awaiting your signature */}
            {(needs?.toSign.length ?? 0) > 0 && (
              <Card>
                <SectionHead
                  icon={<PenLine className="h-2.5 w-2.5" />}
                  label="Awaiting your signature"
                  count={needs?.toSignTotal}
                  tone="amber"
                />
                <div className="divide-y divide-gray-100">
                  {needs?.toSign.map((s) => (
                    <button
                      key={s.arrangementId}
                      type="button"
                      onClick={() => openRouting(s.queueId)}
                      className="w-full text-left px-2.5 py-2 hover:bg-gray-50"
                    >
                      <p className="text-[10px] font-medium text-gray-900 truncate">
                        {s.title}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">
                        from {s.from} · signature {s.position} of{" "}
                        {s.totalSignatories}
                      </p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-0.5">
                        <Clock className="h-2 w-2" /> waiting {ago(s.sentAt)}
                        {s.signed > 0 && (
                          <span className="ml-1">· {s.signed} already in</span>
                        )}
                      </p>
                    </button>
                  ))}
                </div>
                {(needs?.toSignTotal ?? 0) > (needs?.toSign.length ?? 0) && (
                  <p className="px-2.5 py-1 text-[10px] text-gray-400 border-t bg-gray-50">
                    and {(needs?.toSignTotal ?? 0) - (needs?.toSign.length ?? 0)}{" "}
                    more
                  </p>
                )}
              </Card>
            )}

            {/* Arrived, nobody here has opened it */}
            {(needs?.toOpen.length ?? 0) > 0 && (
              <Card>
                <SectionHead
                  icon={<Eye className="h-2.5 w-2.5" />}
                  label="Not opened yet"
                  count={needs?.toOpenTotal}
                  tone="blue"
                />
                <div className="divide-y divide-gray-100">
                  {needs?.toOpen.map((r) => (
                    <ArrivedRow key={r.targetId} row={r} />
                  ))}
                </div>
                {(needs?.toOpenTotal ?? 0) > (needs?.toOpen.length ?? 0) && (
                  <p className="px-2.5 py-1 text-[10px] text-gray-400 border-t bg-gray-50">
                    and {(needs?.toOpenTotal ?? 0) - (needs?.toOpen.length ?? 0)}{" "}
                    more
                  </p>
                )}
              </Card>
            )}

            {/* Opened, still unsigned-for */}
            {(needs?.toReceive.length ?? 0) > 0 && (
              <Card>
                <SectionHead
                  icon={<Inbox className="h-2.5 w-2.5" />}
                  label="Not marked received"
                  count={needs?.toReceiveTotal}
                  tone="amber"
                />
                <div className="divide-y divide-gray-100">
                  {needs?.toReceive.map((r) => (
                    <ArrivedRow key={r.targetId} row={r} action="receive" />
                  ))}
                </div>
                {(needs?.toReceiveTotal ?? 0) >
                  (needs?.toReceive.length ?? 0) && (
                  <p className="px-2.5 py-1 text-[10px] text-gray-400 border-t bg-gray-50">
                    and{" "}
                    {(needs?.toReceiveTotal ?? 0) -
                      (needs?.toReceive.length ?? 0)}{" "}
                    more
                  </p>
                )}
              </Card>
            )}

            {/* What we sent, and where it got to */}
            <Card>
              <SectionHead
                icon={<Send className="h-2.5 w-2.5" />}
                label="Out for signature"
                count={act?.outbox.active}
                tone="gray"
              />
              {(act?.outbox.inFlight.length ?? 0) === 0 ? (
                <Empty text="Nothing of yours is in flight." />
              ) : (
                <div className="divide-y divide-gray-100">
                  {act?.outbox.inFlight.map((q) => (
                    <div key={q.queueId} className="px-2.5 py-2">
                      <button
                        type="button"
                        onClick={() => openRouting(q.queueId)}
                        className="w-full text-left"
                      >
                        <p className="text-[10px] font-medium text-gray-900 truncate">
                          {q.title}
                        </p>
                        <p className="text-[10px] text-gray-400 mb-1.5">
                          sent {ago(q.sentAt)}
                        </p>
                      </button>
                      <div className="space-y-1">
                        <Meter
                          label="Signed"
                          done={q.signed}
                          total={q.totalSignatories}
                          tone="bg-blue-500"
                        />
                        <Meter
                          label="Opened"
                          done={q.opened}
                          total={q.totalRecipients}
                          tone="bg-sky-400"
                        />
                        <Meter
                          label="Received"
                          done={q.received}
                          total={q.totalRecipients}
                          tone="bg-emerald-500"
                        />
                      </div>
                      {q.waitingOn.length > 0 && (
                        <p className="text-[10px] text-gray-400 mt-1 truncate">
                          waiting on {q.waitingOn.join(", ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Today — every one of these is a dated row in the database */}
            <Card>
              <SectionHead
                icon={<Clock className="h-2.5 w-2.5" />}
                label="Today"
                tone="gray"
              />
              <div className="p-2.5 space-y-1.5">
                {[
                  { label: "Signed by you", value: act?.today.signedByYou ?? 0 },
                  { label: "Opened here", value: act?.today.opened ?? 0 },
                  { label: "Receipts logged", value: act?.today.receipts ?? 0 },
                  { label: "Routings started", value: act?.today.started ?? 0 },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between"
                  >
                    <span className="text-[10px] text-gray-500">
                      {row.label}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-900 tabular-nums">
                      {row.value}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1.5 border-t">
                  <span className="text-[10px] text-gray-500">
                    Avg. time to receipt
                  </span>
                  <span className="text-[10px] font-semibold text-gray-900 tabular-nums">
                    {duration(act?.today.avgResponseMs ?? null)}
                  </span>
                </div>
              </div>
            </Card>
          </>
        )}
      </TabsContent>

      {/* ── Alerts ─────────────────────────────────────────────────── */}
      <TabsContent
        value="alerts"
        className="flex-1 overflow-auto p-2 space-y-2 mt-0 data-[state=inactive]:hidden"
      >
        <Card>
          <SectionHead
            icon={<Bell className="h-2.5 w-2.5" />}
            label="Recent alerts"
            count={unread}
            tone="gray"
          />
          {notifLoading ? (
            <div className="p-2 space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : notifications.length === 0 ? (
            <Empty text="No alerts yet." />
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    if (!n.isRead) readOne.mutate(n.id);
                    if (n.path) nav(n.path);
                  }}
                  className={`w-full text-left px-2.5 py-2 flex items-start gap-2 hover:bg-gray-50 ${
                    n.isRead ? "" : "bg-blue-50/40"
                  }`}
                >
                  <span
                    className={`mt-1 h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                      n.isRead ? "bg-transparent" : "bg-blue-500"
                    }`}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[10px] font-medium text-gray-900 truncate">
                      {n.title}
                    </span>
                    <span className="block text-[10px] text-gray-500 line-clamp-2">
                      {n.content}
                    </span>
                    <span className="block text-[10px] text-gray-400 mt-0.5">
                      {ago(n.createdAt)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
          {notifHasNext && (
            <div className="px-2.5 py-1.5 border-t bg-gray-50">
              <button
                type="button"
                disabled={notifFetchingNext}
                onClick={() => fetchMoreNotifs()}
                className="w-full text-[10px] text-blue-600 hover:underline disabled:text-gray-400"
              >
                {notifFetchingNext ? "Loading…" : "Load more →"}
              </button>
            </div>
          )}
        </Card>
      </TabsContent>

      {/* ── Logs ───────────────────────────────────────────────────── */}
      <TabsContent
        value="logs"
        className="flex-1 overflow-auto p-2 space-y-2 mt-0 data-[state=inactive]:hidden"
      >
        <Card>
          <SectionHead
            icon={<FileClock className="h-2.5 w-2.5" />}
            label="Document activity"
            tone="gray"
          />
          {logLoading ? (
            <div className="p-2 space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : logs.length === 0 ? (
            <Empty text="Nothing logged yet." />
          ) : (
            <div className="divide-y divide-gray-100">
              {logs.map((l) => (
                <div key={l.id} className="px-2.5 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-medium text-gray-900 truncate">
                      {l.title}
                    </span>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">
                      {new Date(l.timestamp).toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5">
                    {l.desc}
                  </p>
                  {l.who && (
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {l.who} · {ago(l.timestamp)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
          {logHasNext && (
            <div className="px-2.5 py-1.5 border-t bg-gray-50">
              <button
                type="button"
                disabled={logFetchingNext}
                onClick={() => fetchMoreLogs()}
                className="w-full text-[10px] text-blue-600 hover:underline disabled:text-gray-400"
              >
                {logFetchingNext ? "Loading…" : "Load more →"}
              </button>
            </div>
          )}
        </Card>
      </TabsContent>

      {/* Connection state + a manual pull, at the foot of every tab */}
      <div className="px-2.5 py-1 border-t bg-gray-50 flex items-center gap-1.5 flex-shrink-0">
        <span
          className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
            live ? "bg-emerald-500" : "bg-gray-300"
          }`}
          title={live ? "Live" : "Reconnecting…"}
        />
        <span className="text-[10px] text-gray-400">
          {live ? "Live" : "Offline"}
        </span>
        <button
          type="button"
          onClick={() => refetchActivity()}
          className="ml-auto text-gray-400 hover:text-gray-700"
          title="Refresh"
        >
          <RefreshCw
            className={`h-2.5 w-2.5 ${actFetching ? "animate-spin" : ""}`}
          />
        </button>
      </div>
    </Tabs>
  );
};

export default ActivityPanel;
