import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useAuth } from "@/provider/ProtectedRoute";
//
import {
  applyLeave,
  cancelLeave,
  leaveCatalogue,
  listLeaveCredits,
  listLeaves,
  type LeaveCatalogueItem,
  type LeaveItem,
} from "@/db/statements/leave";
//
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Modal from "@/components/custom/Modal";
import {
  ArrowLeft,
  CalendarDays,
  Plus,
  Loader2,
  Inbox,
  PiggyBank,
} from "lucide-react";

const surfaceErr = (err: unknown, fallback = "Something went wrong") => {
  const e = err as any;
  return e?.response?.data?.message || e?.response?.data?.error || e?.message || fallback;
};

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  approved: { label: "Approved", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  denied: { label: "Denied", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  cancelled: { label: "Cancelled", cls: "bg-gray-100 text-gray-700 border-gray-200" },
};

const MyLeaves = () => {
  const { lineId } = useParams();
  const auth = useAuth();
  const qc = useQueryClient();
  const [onOpen, setOnOpen] = useState(false);
  const year = new Date().getFullYear();

  const { ref } = useInView({
    onChange(inView) {
      if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
  });
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["leaves", "mine", auth.userId],
    queryFn: ({ pageParam }) =>
      listLeaves(auth.token as string, {
        userId: auth.userId as string,
        lastCursor: pageParam,
        limit: "20",
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (l) => (l.hasMore ? l.lastCursor : undefined),
    enabled: !!auth.token && !!auth.userId,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
  const rows = useMemo(
    () => (data?.pages ?? []).flatMap((p) => p.list),
    [data],
  );

  const credits = useQuery({
    queryKey: ["leave-credits", auth.userId, year],
    queryFn: () =>
      listLeaveCredits(auth.token as string, auth.userId as string, year),
    enabled: !!auth.token && !!auth.userId,
    refetchOnMount: "always",
  });

  const cancelMu = useMutation({
    mutationFn: (id: string) =>
      cancelLeave(auth.token as string, {
        leaveId: id,
        userId: auth.userId as string,
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["leaves", "mine", auth.userId] }),
    onError: (e) => alert(surfaceErr(e)),
  });

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-2">
        <Link
          to={`/${lineId}/services`}
          className="h-7 px-2 rounded hover:bg-white border bg-white text-[10px] flex items-center gap-1 text-gray-600"
        >
          <ArrowLeft className="h-3 w-3" /> Services
        </Link>
        <div className="h-7 w-7 rounded-md bg-white border flex items-center justify-center">
          <CalendarDays className="h-3.5 w-3.5 text-gray-700" />
        </div>
        <div>
          <div className="text-xs font-semibold">My Leave Applications</div>
          <div className="text-[10px] text-gray-500">
            Apply for leave and track approval.
          </div>
        </div>
        <Button
          size="sm"
          className="h-7 text-xs ml-auto"
          onClick={() => setOnOpen(true)}
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Apply for leave
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
        {/* Credit summary */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-2">
            <PiggyBank className="h-3.5 w-3.5 text-gray-600" />
            <span className="text-xs font-semibold">
              My credit balances — {year}
            </span>
          </div>
          {credits.isLoading ? (
            <div className="h-16 flex items-center justify-center text-xs text-gray-500">
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Loading...
            </div>
          ) : (
            <div className="px-3 py-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {(credits.data?.list ?? []).map((c) => (
                <div
                  key={c.category}
                  className="border rounded-md px-2 py-1.5 bg-gray-50"
                >
                  <div className="text-[10px] text-gray-500 truncate">
                    {c.label}
                  </div>
                  <div className="text-sm font-semibold text-blue-700">
                    {c.balance}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* List */}
        <div>
          {isLoading ? (
            <div className="h-40 flex items-center justify-center text-xs text-gray-500">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...
            </div>
          ) : rows.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-center">
              <Inbox className="h-6 w-6 text-gray-300 mb-2" />
              <div className="text-xs font-medium text-gray-700">
                No leave applications yet
              </div>
              <div className="text-[10px] text-gray-500">
                Click <span className="font-semibold">Apply for leave</span> to file one.
              </div>
            </div>
          ) : (
            <div className="border rounded-lg bg-white overflow-hidden divide-y">
              {rows.map((r: LeaveItem) => {
                const s = STATUS[r.status] ?? STATUS.pending;
                return (
                  <div
                    key={r.id}
                    className="px-3 py-2 flex items-center gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium">
                          {r.category}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] h-5 px-1.5 ${s.cls}`}
                        >
                          {s.label}
                        </Badge>
                        {!r.withPay ? (
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                            Unpaid
                          </Badge>
                        ) : null}
                      </div>
                      <div className="mt-0.5 text-[10px] text-gray-500 flex items-center gap-3 flex-wrap">
                        <span>
                          {new Date(r.startDate).toLocaleDateString()} →{" "}
                          {new Date(r.endDate).toLocaleDateString()}
                        </span>
                        <span>{r.days} day{r.days === 1 ? "" : "s"}</span>
                        {r.reason ? (
                          <span className="truncate max-w-xs">
                            "{r.reason}"
                          </span>
                        ) : null}
                        {r.decisionRemark ? (
                          <span className="text-gray-400">
                            — decision: "{r.decisionRemark}"
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {r.status === "pending" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-rose-600 hover:bg-rose-50"
                        onClick={() => cancelMu.mutate(r.id)}
                      >
                        Cancel
                      </Button>
                    ) : null}
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

      <ApplyModal
        open={onOpen}
        onClose={() => setOnOpen(false)}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["leaves", "mine", auth.userId] });
          qc.invalidateQueries({
            queryKey: ["leave-credits", auth.userId, year],
          });
        }}
      />
    </div>
  );
};

export default MyLeaves;

const ApplyModal = ({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const auth = useAuth();
  const { lineId } = useParams();
  const { data: cat } = useQuery({
    queryKey: ["leave-catalogue"],
    queryFn: () => leaveCatalogue(auth.token as string),
    enabled: !!auth.token && open,
  });

  const [category, setCategory] = useState("vacation");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");
  const reset = () => {
    setCategory("vacation");
    setStart("");
    setEnd("");
    setReason("");
  };

  const mu = useMutation({
    mutationFn: () =>
      applyLeave(auth.token as string, {
        userId: auth.userId as string,
        lineId: lineId as string,
        category,
        startDate: start,
        endDate: end,
        reason: reason || undefined,
      }),
    onSuccess: () => {
      onSaved();
      reset();
      onClose();
    },
    onError: (e) => alert(surfaceErr(e)),
  });

  return (
    <Modal
      title="Apply for leave"
      onOpen={open}
      setOnOpen={() => {
        reset();
        onClose();
      }}
      footer={true}
      yesTitle="Submit"
      loading={mu.isPending}
      onFunction={() => mu.mutate()}
      className=""
    >
      <div className="space-y-2">
        <div>
          <label className="text-[10px] font-semibold uppercase text-gray-600">
            Category
          </label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(cat?.list ?? []).map((c: LeaveCatalogueItem) => (
                <SelectItem key={c.key} value={c.key} className="text-xs">
                  {c.label} {c.withPay ? "" : "(Unpaid)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-semibold uppercase text-gray-600">
              Start
            </label>
            <Input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase text-gray-600">
              End
            </label>
            <Input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-semibold uppercase text-gray-600">
            Reason
          </label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="text-xs min-h-[80px]"
            placeholder="Optional"
          />
        </div>
        <div className="text-[10px] text-gray-500">
          Weekends are excluded from the day count.
        </div>
      </div>
    </Modal>
  );
};
