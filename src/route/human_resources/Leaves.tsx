import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router";
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
  adjustLeaveCredit,
  applyLeave,
  decideLeave,
  leaveCatalogue,
  listLeaveCredits,
  listLeaveLedger,
  listLeaves,
  listLineUsers,
  type LeaveCatalogueItem,
  type LeaveItem,
  type LineUser,
} from "@/db/statements/leave";
//
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Modal from "@/components/custom/Modal";
import {
  CalendarDays,
  Plus,
  Search,
  Loader2,
  Check,
  X,
  Pencil,
  PiggyBank,
  History,
  Inbox,
  User,
  Users,
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

const fullName = (u?: {
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
} | null) =>
  `${u?.firstName ?? ""} ${u?.lastName ?? ""}`.trim() || u?.username || "—";

const Leaves = () => {
  const { lineId } = useParams();
  const auth = useAuth();
  const [params, setParams] = useSearchParams({ tab: "applications" });
  const tab = params.get("tab") || "applications";

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-2">
        <div className="h-7 w-7 rounded-md bg-white border flex items-center justify-center">
          <CalendarDays className="h-3.5 w-3.5 text-gray-700" />
        </div>
        <div>
          <div className="text-xs font-semibold">Leave Management</div>
          <div className="text-[10px] text-gray-500">
            Manage all leave applications from this line's employees.
          </div>
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) =>
          setParams(
            (p) => {
              p.set("tab", v);
              return p;
            },
            { replace: true },
          )
        }
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="px-3 pt-2 border-b">
          <TabsList className="bg-gray-100 p-0.5 h-8">
            <TabsTrigger value="applications" className="h-7 px-2.5 text-xs">
              Applications
            </TabsTrigger>
            <TabsTrigger value="credits" className="h-7 px-2.5 text-xs">
              Credits
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="applications" className="flex-1 min-h-0 m-0">
          <Applications
            token={auth.token as string}
            approverId={auth.userId as string}
            lineId={lineId as string}
          />
        </TabsContent>
        <TabsContent value="credits" className="flex-1 min-h-0 m-0">
          <Credits
            token={auth.token as string}
            byUserId={auth.userId as string}
            lineId={lineId as string}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Leaves;

// ─── Applications (line-wide, filterable, inline approve/deny) ────────
const Applications = ({
  token,
  approverId,
  lineId,
}: {
  token: string;
  approverId: string;
  lineId: string;
}) => {
  const qc = useQueryClient();
  const [status, setStatus] = useState("pending");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [decideTarget, setDecideTarget] = useState<{
    leave: LeaveItem;
    decision: "approved" | "denied";
  } | null>(null);
  const [remark, setRemark] = useState("");

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
    queryKey: ["leaves", "line", lineId, status, category],
    queryFn: ({ pageParam }) =>
      listLeaves(token, {
        lineId,
        status,
        category: category === "all" ? undefined : category,
        lastCursor: pageParam,
        limit: "20",
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (l) => (l.hasMore ? l.lastCursor : undefined),
    enabled: !!token && !!lineId,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
  const rows = useMemo(
    () => (data?.pages ?? []).flatMap((p) => p.list),
    [data],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const name = fullName(r.user).toLowerCase();
      return (
        name.includes(q) ||
        r.category.toLowerCase().includes(q) ||
        (r.reason ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, query]);

  const decideMu = useMutation({
    mutationFn: (b: { leaveId: string; decision: "approved" | "denied"; remark: string }) =>
      decideLeave(token, {
        leaveId: b.leaveId,
        approverId,
        decision: b.decision,
        remark: b.remark || undefined,
      }),
    onSuccess: () => {
      setDecideTarget(null);
      setRemark("");
      qc.invalidateQueries({ queryKey: ["leaves", "line", lineId] });
    },
    onError: (e) => alert(surfaceErr(e)),
  });

  const { data: cat } = useQuery({
    queryKey: ["leave-catalogue"],
    queryFn: () => leaveCatalogue(token),
    enabled: !!token,
  });

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="px-3 py-2 border-b flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search employee, category, reason..."
            className="h-7 pl-7 text-xs"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-7 text-xs w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All status</SelectItem>
            <SelectItem value="pending" className="text-xs">Pending</SelectItem>
            <SelectItem value="approved" className="text-xs">Approved</SelectItem>
            <SelectItem value="denied" className="text-xs">Denied</SelectItem>
            <SelectItem value="cancelled" className="text-xs">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-7 text-xs w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All categories</SelectItem>
            {(cat?.list ?? []).map((c: LeaveCatalogueItem) => (
              <SelectItem key={c.key} value={c.key} className="text-xs">
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          className="h-7 text-xs ml-auto"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> File on behalf
        </Button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto p-3">
        {isLoading ? (
          <div className="h-40 flex items-center justify-center text-xs text-gray-500">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center">
            <Inbox className="h-6 w-6 text-gray-300 mb-2" />
            <div className="text-xs font-medium text-gray-700">
              No matching leave applications
            </div>
            <div className="text-[10px] text-gray-500">
              Try widening the status filter.
            </div>
          </div>
        ) : (
          <div className="border rounded-lg bg-white overflow-hidden divide-y">
            {filtered.map((r) => {
              const s = STATUS[r.status] ?? STATUS.pending;
              return (
                <div
                  key={r.id}
                  className="px-3 py-2 flex items-center gap-3"
                >
                  <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold flex items-center justify-center shrink-0">
                    {(r.user?.firstName?.[0] ?? "") +
                      (r.user?.lastName?.[0] ?? "")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium truncate">
                        {fullName(r.user)}
                      </span>
                      {r.user?.Position?.name ? (
                        <span className="text-[10px] text-gray-500">
                          · {r.user.Position.name}
                        </span>
                      ) : null}
                      <Badge
                        variant="outline"
                        className={`text-[10px] h-5 px-1.5 ${s.cls}`}
                      >
                        {s.label}
                      </Badge>
                      {!r.withPay ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] h-5 px-1.5"
                        >
                          Unpaid
                        </Badge>
                      ) : null}
                    </div>
                    <div className="mt-0.5 text-[10px] text-gray-500 flex items-center gap-3 flex-wrap">
                      <span className="font-medium text-gray-700">
                        {r.category}
                      </span>
                      <span>
                        {new Date(r.startDate).toLocaleDateString()} →{" "}
                        {new Date(r.endDate).toLocaleDateString()}
                      </span>
                      <span>
                        {r.days} day{r.days === 1 ? "" : "s"}
                      </span>
                      {r.reason ? (
                        <span className="truncate max-w-xs">
                          "{r.reason}"
                        </span>
                      ) : null}
                      {r.approver && r.decidedAt ? (
                        <span className="text-gray-400">
                          · decided by {fullName(r.approver)} on{" "}
                          {new Date(r.decidedAt).toLocaleDateString()}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {r.status === "pending" ? (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        onClick={() =>
                          setDecideTarget({ leave: r, decision: "approved" })
                        }
                      >
                        <Check className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-rose-200 text-rose-700 hover:bg-rose-50"
                        onClick={() =>
                          setDecideTarget({ leave: r, decision: "denied" })
                        }
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> Deny
                      </Button>
                    </div>
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

      {/* Decide modal */}
      <Modal
        title={
          decideTarget?.decision === "approved"
            ? "Approve leave?"
            : "Deny leave?"
        }
        onOpen={!!decideTarget}
        setOnOpen={() => {
          setDecideTarget(null);
          setRemark("");
        }}
        footer={true}
        yesTitle={decideTarget?.decision === "approved" ? "Approve" : "Deny"}
        loading={decideMu.isPending}
        onFunction={() =>
          decideTarget &&
          decideMu.mutate({
            leaveId: decideTarget.leave.id,
            decision: decideTarget.decision,
            remark,
          })
        }
        className=""
      >
        <div className="space-y-2">
          {decideTarget ? (
            <div className="text-xs text-gray-600">
              <span className="font-semibold">
                {fullName(decideTarget.leave.user)}
              </span>{" "}
              — {decideTarget.leave.category}, {decideTarget.leave.days} day(s)
            </div>
          ) : null}
          <div>
            <label className="text-[10px] font-semibold uppercase text-gray-600">
              Remark (optional)
            </label>
            <Textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="text-xs min-h-[60px]"
            />
          </div>
          {decideTarget?.decision === "approved" &&
          decideTarget.leave.withPay ? (
            <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
              Approving will debit {decideTarget.leave.days} day(s) from{" "}
              {fullName(decideTarget.leave.user)}'s{" "}
              <span className="font-semibold">{decideTarget.leave.category}</span>{" "}
              credit bucket.
            </div>
          ) : null}
        </div>
      </Modal>

      {/* File-on-behalf modal */}
      <FileOnBehalfModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        token={token}
        lineId={lineId}
        onSaved={() =>
          qc.invalidateQueries({ queryKey: ["leaves", "line", lineId] })
        }
      />
    </div>
  );
};

// ─── File on behalf of an employee ────────────────────────────────────
const FileOnBehalfModal = ({
  open,
  onClose,
  token,
  lineId,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  token: string;
  lineId: string;
  onSaved: () => void;
}) => {
  const [employee, setEmployee] = useState<LineUser | null>(null);
  const [category, setCategory] = useState("vacation");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");

  const reset = () => {
    setEmployee(null);
    setCategory("vacation");
    setStart("");
    setEnd("");
    setReason("");
  };

  const { data: cat } = useQuery({
    queryKey: ["leave-catalogue"],
    queryFn: () => leaveCatalogue(token),
    enabled: !!token && open,
  });

  const mu = useMutation({
    mutationFn: () =>
      applyLeave(token, {
        userId: employee!.id,
        lineId,
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
      title="File leave on behalf"
      onOpen={open}
      setOnOpen={() => {
        reset();
        onClose();
      }}
      footer={true}
      yesTitle="Submit"
      loading={mu.isPending}
      onFunction={() => employee && mu.mutate()}
      className=""
    >
      <div className="space-y-2">
        <div>
          <label className="text-[10px] font-semibold uppercase text-gray-600">
            Employee
          </label>
          <EmployeePicker
            token={token}
            lineId={lineId}
            value={employee}
            onChange={setEmployee}
          />
        </div>
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
              Start date
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
              End date
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
            className="text-xs min-h-[60px]"
            placeholder="Optional"
          />
        </div>
        <div className="text-[10px] text-gray-500">
          Weekends are excluded from the day count. Approval still required.
        </div>
      </div>
    </Modal>
  );
};

// ─── Employee picker (used in modal + credits) ───────────────────────
const EmployeePicker = ({
  token,
  lineId,
  value,
  onChange,
}: {
  token: string;
  lineId: string;
  value: LineUser | null;
  onChange: (u: LineUser | null) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { data, isFetching } = useQuery({
    queryKey: ["line-users", lineId, q],
    queryFn: () => listLineUsers(token, lineId, q),
    enabled: !!token && !!lineId && open,
  });

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-8 text-xs text-left px-2 border rounded-md bg-white hover:bg-gray-50 flex items-center gap-2"
      >
        <User className="h-3.5 w-3.5 text-gray-500" />
        {value ? (
          <span className="truncate">
            {fullName(value)}
            {value.Position?.name ? (
              <span className="text-gray-500"> · {value.Position.name}</span>
            ) : null}
          </span>
        ) : (
          <span className="text-gray-400">Pick an employee...</span>
        )}
      </button>
      {open ? (
        <div className="absolute z-20 left-0 right-0 mt-1 border rounded-md bg-white shadow-md">
          <div className="p-1.5 border-b">
            <div className="relative">
              <Search className="h-3 w-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name..."
                className="h-7 pl-6 text-xs"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-auto">
            {isFetching ? (
              <div className="px-3 py-3 text-xs text-gray-500 flex items-center justify-center">
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Loading...
              </div>
            ) : (data?.list ?? []).length === 0 ? (
              <div className="px-3 py-3 text-xs text-gray-500 text-center">
                No matches
              </div>
            ) : (
              <div className="divide-y">
                {(data?.list ?? []).map((u) => (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => {
                      onChange(u);
                      setOpen(false);
                    }}
                    className="w-full text-left px-2 py-1.5 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold flex items-center justify-center shrink-0">
                      {(u.firstName?.[0] ?? "") + (u.lastName?.[0] ?? "")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium truncate">
                        {fullName(u)}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate">
                        {u.Position?.name ?? "—"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

// ─── Credits (per-employee) ───────────────────────────────────────────
const Credits = ({
  token,
  byUserId,
  lineId,
}: {
  token: string;
  byUserId: string;
  lineId: string;
}) => {
  const qc = useQueryClient();
  const [employee, setEmployee] = useState<LineUser | null>(null);
  const year = new Date().getFullYear();
  const userId = employee?.id;

  const credits = useQuery({
    queryKey: ["leave-credits", userId, year],
    queryFn: () => listLeaveCredits(token, userId as string, year),
    enabled: !!token && !!userId,
    refetchOnMount: "always",
  });
  const ledger = useQuery({
    queryKey: ["leave-ledger", userId, year],
    queryFn: () => listLeaveLedger(token, userId as string, year),
    enabled: !!token && !!userId,
    refetchOnMount: "always",
  });

  const [adjust, setAdjust] = useState<{
    category: string;
    label: string;
  } | null>(null);
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");

  const adjustMu = useMutation({
    mutationFn: () =>
      adjustLeaveCredit(token, {
        userId: userId as string,
        byUserId,
        category: adjust!.category,
        delta: parseFloat(delta) || 0,
        note: note || undefined,
        year,
      }),
    onSuccess: () => {
      setAdjust(null);
      setDelta("");
      setNote("");
      qc.invalidateQueries({ queryKey: ["leave-credits", userId, year] });
      qc.invalidateQueries({ queryKey: ["leave-ledger", userId, year] });
    },
    onError: (e) => alert(surfaceErr(e)),
  });

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b flex items-center gap-2">
        <Users className="h-3.5 w-3.5 text-gray-500" />
        <span className="text-[10px] text-gray-500">Employee:</span>
        <div className="w-64">
          <EmployeePicker
            token={token}
            lineId={lineId}
            value={employee}
            onChange={setEmployee}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
        {!employee ? (
          <div className="h-32 flex flex-col items-center justify-center text-center">
            <PiggyBank className="h-6 w-6 text-gray-300 mb-2" />
            <div className="text-xs text-gray-700 font-medium">
              Pick an employee
            </div>
            <div className="text-[10px] text-gray-500">
              View and adjust their leave credit balances.
            </div>
          </div>
        ) : (
          <>
            {/* Credit balances */}
            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-2">
                <PiggyBank className="h-3.5 w-3.5 text-gray-600" />
                <span className="text-xs font-semibold">
                  Leave credits — {fullName(employee)} · {year}
                </span>
              </div>
              {credits.isLoading ? (
                <div className="h-24 flex items-center justify-center text-xs text-gray-500">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...
                </div>
              ) : (
                <div className="divide-y">
                  {(credits.data?.list ?? []).map((c) => (
                    <div
                      key={c.category}
                      className="px-3 py-2 grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-center"
                    >
                      <div>
                        <div className="text-xs font-medium">{c.label}</div>
                        <div className="text-[10px] text-gray-500">
                          {c.withPay ? "Paid" : "Unpaid"}
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-500">
                        Accrued{" "}
                        <span className="font-semibold text-gray-700">
                          {c.accrued}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500">
                        Used{" "}
                        <span className="font-semibold text-gray-700">
                          {c.used}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-blue-700">
                        Balance {c.balance}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px]"
                        onClick={() =>
                          setAdjust({ category: c.category, label: c.label })
                        }
                      >
                        <Pencil className="h-3 w-3 mr-1" /> Adjust
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ledger */}
            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-2">
                <History className="h-3.5 w-3.5 text-gray-600" />
                <span className="text-xs font-semibold">
                  Credit ledger — {year}
                </span>
              </div>
              {ledger.isLoading ? (
                <div className="h-24 flex items-center justify-center text-xs text-gray-500">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...
                </div>
              ) : (ledger.data?.list ?? []).length === 0 ? (
                <div className="h-16 flex items-center justify-center text-xs text-gray-500">
                  No credit movements yet.
                </div>
              ) : (
                <div className="divide-y">
                  {(ledger.data?.list ?? []).map((row) => (
                    <div
                      key={row.id}
                      className="px-3 py-2 flex items-center gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs">
                          <span className="font-medium">{row.category}</span>{" "}
                          <span className="text-gray-500">· {row.kind}</span>
                          {row.note ? (
                            <span className="text-gray-500"> — "{row.note}"</span>
                          ) : null}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {new Date(row.at).toLocaleString()}
                          {row.by ? (
                            <>
                              {" "}· by {fullName(row.by)}
                            </>
                          ) : null}
                        </div>
                      </div>
                      <div
                        className={`text-xs font-semibold ${
                          row.delta < 0 ? "text-rose-700" : "text-emerald-700"
                        }`}
                      >
                        {row.delta > 0 ? "+" : ""}
                        {row.delta}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Modal
        title={`Adjust ${adjust?.label ?? ""}`}
        onOpen={!!adjust}
        setOnOpen={() => {
          setAdjust(null);
          setDelta("");
          setNote("");
        }}
        footer={true}
        yesTitle="Apply"
        loading={adjustMu.isPending}
        onFunction={() => adjustMu.mutate()}
        className=""
      >
        <div className="space-y-2">
          <div className="text-[10px] text-gray-500">
            Employee:{" "}
            <span className="font-semibold text-gray-700">
              {fullName(employee)}
            </span>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase text-gray-600">
              Delta (positive to credit, negative to debit)
            </label>
            <Input
              type="number"
              step="0.5"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase text-gray-600">
              Note (audit trail)
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="text-xs min-h-[60px]"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
