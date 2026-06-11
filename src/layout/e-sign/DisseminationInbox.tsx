import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
//
import {
  disseminationInbox,
  resetRoomMembership,
} from "@/db/statements/document";
import { useAuth } from "@/provider/ProtectedRoute";
//
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Inbox,
  FileText,
  Loader2,
  ArrowRight,
  Building2,
  RotateCcw,
} from "lucide-react";

interface Props {
  roomId: string;
  token: string;
}

const QSTATUS: Record<number, { label: string; cls: string }> = {
  0: { label: "Draft", cls: "bg-gray-100 text-gray-700 border-gray-200" },
  1: { label: "Active", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  2: {
    label: "Completed",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  3: { label: "Cancelled", cls: "bg-rose-50 text-rose-700 border-rose-200" },
};

const LIMIT = "20";

const DisseminationInbox = ({ roomId, token }: Props) => {
  const nav = useNavigate();
  const auth = useAuth();
  const qc = useQueryClient();
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (
      !confirm(
        "Reset your room? You'll be moved to a brand new ReceivingRoom — any in-progress drafts in your current room stay where they are but will no longer be yours.",
      )
    )
      return;
    setResetting(true);
    try {
      await resetRoomMembership(token, auth.userId as string);
      // Refresh the room context everywhere.
      await qc.invalidateQueries({
        queryKey: ["signatory-registry", auth.userId],
      });
      await qc.invalidateQueries({ queryKey: ["dissemination"] });
    } catch (e: any) {
      alert(
        e?.response?.data?.message ||
          e?.message ||
          "Reset failed. Check the API logs.",
      );
    } finally {
      setResetting(false);
    }
  };
  const { ref } = useInView({
    onChange(inView) {
      if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
  });

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["dissemination", "inbox", roomId],
    queryFn: ({ pageParam }) =>
      disseminationInbox(token, roomId, pageParam, LIMIT),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => (last.hasMore ? last.lastCursor : undefined),
    enabled: !!token && !!roomId,
    // Always refetch on mount so freshly-dispatched disseminations show up
    // the moment the recipient opens the Inbox tab.
    refetchOnMount: "always",
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  });

  const rows = useMemo(
    () => (data?.pages ?? []).flatMap((p) => p.list as any[]),
    [data],
  );
  const debug = (data?.pages?.[0] as any)?.debug as
    | {
        toRoomId: string;
        rawCount: number;
        dispatchedCount: number;
        sample: Array<{
          id: string;
          status: number;
          signatureQueueRoomId: string | null;
          queueRoom: { id: string; title: string | null; status: number; step: number } | null;
        }>;
      }
    | undefined;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-auto p-3">
        {isLoading ? (
          <div className="h-40 flex items-center justify-center text-xs text-gray-500">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...
          </div>
        ) : rows.length === 0 ? (
          <div className="space-y-3">
            <div className="h-40 flex flex-col items-center justify-center text-center">
              <Inbox className="h-6 w-6 text-gray-300 mb-2" />
              <div className="text-xs font-medium text-gray-700">
                No incoming disseminations
              </div>
              <div className="text-[10px] text-gray-500">
                Documents routed to this room will appear here.
              </div>
            </div>

            {/* Diagnostic — explains exactly why the inbox is empty so we
                can tell apart "wrong room id" from "nothing dispatched". */}
            <div className="mx-auto max-w-xl border rounded-lg bg-white overflow-hidden text-[10px]">
              <div className="px-3 py-2 border-b bg-gray-50 font-semibold uppercase tracking-wide text-gray-600">
                Diagnostic
              </div>
              <div className="p-3 space-y-1.5">
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500">Your room id</span>
                  <span className="font-mono select-all text-gray-800 truncate">
                    {roomId || "(missing — your account isn't in any room)"}
                  </span>
                </div>
                {debug ? (
                  <>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500">
                        TargetRoom rows for this id
                      </span>
                      <span className="font-semibold text-gray-800">
                        {debug.rawCount}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500">
                        Of those, dispatched (status ≥ 1)
                      </span>
                      <span className="font-semibold text-gray-800">
                        {debug.dispatchedCount}
                      </span>
                    </div>
                    {debug.sample.length > 0 ? (
                      <div className="pt-2 mt-2 border-t">
                        <div className="text-gray-500 mb-1">
                          Sample of matching TargetRoom rows:
                        </div>
                        <div className="space-y-1">
                          {debug.sample.map((t) => (
                            <div
                              key={t.id}
                              className="font-mono text-[10px] flex justify-between gap-2"
                            >
                              <span className="truncate">
                                queue {t.queueRoom?.id?.slice(0, 8) ?? "—"} ·{" "}
                                {t.queueRoom?.title ?? "(no title)"}
                              </span>
                              <span
                                className={
                                  (t.queueRoom?.status ?? 0) >= 1
                                    ? "text-emerald-700"
                                    : "text-amber-700"
                                }
                              >
                                queue.status={t.queueRoom?.status ?? "null"}
                              </span>
                            </div>
                          ))}
                        </div>
                        {debug.rawCount > 0 && debug.dispatchedCount === 0 ? (
                          <div className="mt-2 text-amber-700">
                            ⚠ TargetRoom rows exist but no queue has been
                            dispatched yet — the sender's `finalize` call
                            didn't complete. Re-open the draft and click
                            Dispatch again.
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="pt-2 mt-2 border-t space-y-2">
                        <div className="text-amber-700">
                          ⚠ No TargetRoom rows reference your room id. Two
                          common causes:
                        </div>
                        <ul className="list-disc pl-4 text-gray-600 space-y-0.5">
                          <li>
                            The sender targeted a different room — verify
                            you and the sender resolve to{" "}
                            <span className="font-semibold">different</span>{" "}
                            room ids.
                          </li>
                          <li>
                            Your account is sharing a room with someone
                            else (e.g. the sender). If you see the sender's
                            outbox here too, that's it — reset your room
                            below to get your own.
                          </li>
                        </ul>
                        <div className="pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px]"
                            onClick={handleReset}
                            disabled={resetting}
                          >
                            {resetting ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3 w-3 mr-1" />
                            )}
                            Reset to a fresh room
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="border rounded-lg bg-white overflow-hidden divide-y">
            {rows.map((r) => {
              const q = r.queueRoom ?? {};
              const s = QSTATUS[q.status] ?? QSTATUS[1];
              const docs = q._count?.documents ?? 0;
              const sender = q.user
                ? `${q.user.firstName ?? ""} ${q.user.lastName ?? ""}`.trim()
                : "—";
              return (
                <div
                  key={r.id}
                  className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-3"
                  onClick={() => nav(`view/${q.id}`)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-900 truncate">
                        {q.title || "(no subject)"}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] h-5 px-1.5 ${s.cls}`}
                      >
                        {s.label}
                      </Badge>
                    </div>
                    <div className="mt-0.5 text-[10px] text-gray-500 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {q.fromRoom?.code || "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {docs} doc{docs === 1 ? "" : "s"}
                      </span>
                      <span className="text-gray-400">
                        Sent by {sender}
                      </span>
                      <span className="text-gray-400">
                        {q.timestamp
                          ? new Date(q.timestamp).toLocaleString()
                          : ""}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                </div>
              );
            })}
            <div ref={ref} className="h-6 flex items-center justify-center">
              {isFetchingNextPage ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DisseminationInbox;
