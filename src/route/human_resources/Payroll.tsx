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
  computePayrollPeriod,
  createPayrollPeriod,
  listPayrollPeriods,
  listPayslips,
  releasePayrollPeriod,
  removePayrollPeriod,
  type PayrollPeriodRow,
  type PayslipRow,
} from "@/db/statements/leave";
//
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import Modal from "@/components/custom/Modal";
import {
  Wallet,
  Plus,
  Loader2,
  Trash2,
  Play,
  Send,
  Inbox,
  FileText,
  Calculator,
} from "lucide-react";

const surfaceErr = (err: unknown, fallback = "Something went wrong") => {
  const e = err as any;
  return e?.response?.data?.message || e?.response?.data?.error || e?.message || fallback;
};
const peso = (n: number) =>
  n.toLocaleString("en-PH", { style: "currency", currency: "PHP" });

const PSTATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-gray-100 text-gray-700 border-gray-200" },
  computed: { label: "Computed", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  released: { label: "Released", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const Payroll = () => {
  const { lineId } = useParams();
  const auth = useAuth();
  const [params, setParams] = useSearchParams({ tab: "periods" });
  const tab = params.get("tab") || "periods";
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);

  const openPayslips = (id: string) => {
    setSelectedPeriodId(id);
    setParams(
      (p) => {
        p.set("tab", "payslips");
        return p;
      },
      { replace: true },
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-2">
        <div className="h-7 w-7 rounded-md bg-white border flex items-center justify-center">
          <Wallet className="h-3.5 w-3.5 text-gray-700" />
        </div>
        <div>
          <div className="text-xs font-semibold">Payroll</div>
          <div className="text-[10px] text-gray-500">
            Periods, salary calculation, payslips (PH SSS + PhilHealth + Pag-IBIG + BIR)
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
            <TabsTrigger value="periods" className="h-7 px-2.5 text-xs">
              Periods
            </TabsTrigger>
            <TabsTrigger value="payslips" className="h-7 px-2.5 text-xs">
              Payslips
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="periods" className="flex-1 min-h-0 m-0">
          <Periods
            token={auth.token as string}
            userId={auth.userId as string}
            lineId={lineId as string}
            onOpenPayslips={openPayslips}
          />
        </TabsContent>
        <TabsContent value="payslips" className="flex-1 min-h-0 m-0">
          <Payslips
            token={auth.token as string}
            lineId={lineId as string}
            periodId={selectedPeriodId}
            onPickPeriod={setSelectedPeriodId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Payroll;

// ─── Periods ──────────────────────────────────────────────────────────
const Periods = ({
  token,
  userId,
  lineId,
  onOpenPayslips,
}: {
  token: string;
  userId: string;
  lineId: string;
  onOpenPayslips: (id: string) => void;
}) => {
  const qc = useQueryClient();
  const [onOpen, setOnOpen] = useState(false);
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
    queryKey: ["payroll-periods", lineId],
    queryFn: ({ pageParam }) =>
      listPayrollPeriods(token, { lineId, lastCursor: pageParam, limit: "20" }),
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

  const computeMu = useMutation({
    mutationFn: (id: string) => computePayrollPeriod(token, id),
    onSuccess: (d) => {
      alert(`Computed ${d.computed} payslip(s).`);
      qc.invalidateQueries({ queryKey: ["payroll-periods", lineId] });
    },
    onError: (e) => alert(surfaceErr(e)),
  });
  const releaseMu = useMutation({
    mutationFn: (id: string) => releasePayrollPeriod(token, id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["payroll-periods", lineId] }),
    onError: (e) => alert(surfaceErr(e)),
  });
  const removeMu = useMutation({
    mutationFn: (id: string) => removePayrollPeriod(token, id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["payroll-periods", lineId] }),
    onError: (e) => alert(surfaceErr(e)),
  });

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <div className="text-[10px] text-gray-500">
          Payroll periods for this line
        </div>
        <Button size="sm" className="h-7 text-xs" onClick={() => setOnOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> New period
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-3">
        {isLoading ? (
          <div className="h-32 flex items-center justify-center text-xs text-gray-500">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...
          </div>
        ) : rows.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center text-center">
            <Inbox className="h-6 w-6 text-gray-300 mb-2" />
            <div className="text-xs font-medium text-gray-700">
              No payroll periods yet
            </div>
          </div>
        ) : (
          <div className="border rounded-lg bg-white overflow-hidden divide-y">
            {rows.map((r: PayrollPeriodRow) => {
              const s = PSTATUS[r.status] ?? PSTATUS.draft;
              return (
                <div
                  key={r.id}
                  className="px-3 py-2 flex items-center gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium truncate">
                        {r.label}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] h-5 px-1.5 ${s.cls}`}
                      >
                        {s.label}
                      </Badge>
                    </div>
                    <div className="mt-0.5 text-[10px] text-gray-500">
                      {new Date(r.periodStart).toLocaleDateString()} →{" "}
                      {new Date(r.periodEnd).toLocaleDateString()}
                      {r._count?.payslips ? (
                        <>
                          {" "}· <FileText className="inline h-3 w-3" />{" "}
                          {r._count.payslips} payslip
                          {r._count.payslips === 1 ? "" : "s"}
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {r.status !== "released" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => computeMu.mutate(r.id)}
                        disabled={computeMu.isPending}
                      >
                        <Calculator className="h-3.5 w-3.5 mr-1" /> Compute
                      </Button>
                    ) : null}
                    {r.status === "computed" ? (
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => releaseMu.mutate(r.id)}
                        disabled={releaseMu.isPending}
                      >
                        <Send className="h-3.5 w-3.5 mr-1" /> Release
                      </Button>
                    ) : null}
                    {(r._count?.payslips ?? 0) > 0 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => onOpenPayslips(r.id)}
                      >
                        <Play className="h-3.5 w-3.5 mr-1" /> View
                      </Button>
                    ) : null}
                    {r.status === "draft" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50"
                        onClick={() => removeMu.mutate(r.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                  </div>
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

      <NewPeriodModal
        open={onOpen}
        onClose={() => setOnOpen(false)}
        token={token}
        userId={userId}
        lineId={lineId}
        onSaved={() =>
          qc.invalidateQueries({ queryKey: ["payroll-periods", lineId] })
        }
      />
    </div>
  );
};

const NewPeriodModal = ({
  open,
  onClose,
  token,
  userId,
  lineId,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  token: string;
  userId: string;
  lineId: string;
  onSaved: () => void;
}) => {
  const [label, setLabel] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const mu = useMutation({
    mutationFn: () =>
      createPayrollPeriod(token, {
        lineId,
        userId,
        label,
        periodStart: start,
        periodEnd: end,
      }),
    onSuccess: () => {
      onSaved();
      setLabel("");
      setStart("");
      setEnd("");
      onClose();
    },
    onError: (e) => alert(surfaceErr(e)),
  });
  return (
    <Modal
      title="New payroll period"
      onOpen={open}
      setOnOpen={onClose}
      footer={true}
      yesTitle="Create"
      loading={mu.isPending}
      onFunction={() => mu.mutate()}
      className=""
    >
      <div className="space-y-2">
        <div>
          <label className="text-[10px] font-semibold uppercase text-gray-600">
            Label
          </label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="h-8 text-xs"
            placeholder="e.g. January 2026 — 1st half"
          />
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
      </div>
    </Modal>
  );
};

// ─── Payslips ─────────────────────────────────────────────────────────
const Payslips = ({
  token,
  lineId,
  periodId,
  onPickPeriod,
}: {
  token: string;
  lineId: string;
  periodId: string | null;
  onPickPeriod: (id: string) => void;
}) => {
  const periods = useQuery({
    queryKey: ["payroll-periods-min", lineId],
    queryFn: () =>
      listPayrollPeriods(token, { lineId, limit: "50" }),
    enabled: !!token && !!lineId,
    refetchOnMount: "always",
  });

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
    queryKey: ["payslips", periodId],
    queryFn: ({ pageParam }) =>
      listPayslips(token, {
        periodId: periodId as string,
        lastCursor: pageParam,
        limit: "30",
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (l) => (l.hasMore ? l.lastCursor : undefined),
    enabled: !!token && !!periodId,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
  const rows = useMemo(
    () => (data?.pages ?? []).flatMap((p) => p.list),
    [data],
  );
  const [open, setOpen] = useState<PayslipRow | null>(null);

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 border-b flex items-center gap-2">
        <span className="text-[10px] text-gray-500">Period:</span>
        <select
          value={periodId ?? ""}
          onChange={(e) => onPickPeriod(e.target.value)}
          className="h-7 text-xs border rounded px-2 bg-white"
        >
          <option value="">— pick a period —</option>
          {(periods.data?.list ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.label} ({p.status})
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1 overflow-auto p-3">
        {!periodId ? (
          <div className="h-32 flex flex-col items-center justify-center text-center">
            <FileText className="h-6 w-6 text-gray-300 mb-2" />
            <div className="text-xs text-gray-600">
              Pick a period to view its payslips.
            </div>
          </div>
        ) : isLoading ? (
          <div className="h-32 flex items-center justify-center text-xs text-gray-500">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...
          </div>
        ) : rows.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center text-center">
            <Inbox className="h-6 w-6 text-gray-300 mb-2" />
            <div className="text-xs text-gray-700 font-medium">
              No payslips for this period
            </div>
            <div className="text-[10px] text-gray-500">
              Compute the period to generate them.
            </div>
          </div>
        ) : (
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="px-3 py-2 border-b bg-gray-50 grid grid-cols-[1fr_120px_120px_120px_120px_140px_60px] text-[10px] uppercase tracking-wide text-gray-500 font-semibold">
              <span>Employee</span>
              <span className="text-right">Basic</span>
              <span className="text-right">Gross</span>
              <span className="text-right">Contributions</span>
              <span className="text-right">Tax</span>
              <span className="text-right">Net pay</span>
              <span></span>
            </div>
            <div className="divide-y">
              {rows.map((r) => {
                const contrib = r.sssEE + r.philhealthEE + r.pagibigEE;
                const name = `${r.user?.firstName ?? ""} ${r.user?.lastName ?? ""}`.trim();
                return (
                  <div
                    key={r.id}
                    className="px-3 py-2 grid grid-cols-[1fr_120px_120px_120px_120px_140px_60px] text-xs items-center"
                  >
                    <span className="font-medium truncate">{name}</span>
                    <span className="text-right text-gray-700">{peso(r.basicMonthly)}</span>
                    <span className="text-right text-gray-700">{peso(r.grossPay)}</span>
                    <span className="text-right text-gray-700">{peso(contrib)}</span>
                    <span className="text-right text-gray-700">{peso(r.withholdingTax)}</span>
                    <span className="text-right font-semibold text-emerald-700">
                      {peso(r.netPay)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px]"
                      onClick={() => setOpen(r)}
                    >
                      View
                    </Button>
                  </div>
                );
              })}
              <div ref={ref} className="h-6 flex items-center justify-center">
                {isFetchingNextPage ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal
        title={
          open
            ? `Payslip — ${open.user?.firstName ?? ""} ${open.user?.lastName ?? ""}`.trim()
            : ""
        }
        onOpen={!!open}
        setOnOpen={() => setOpen(null)}
        footer={false}
        cancelTitle="Close"
        className=""
      >
        {open ? (
          <div className="text-xs space-y-2">
            <div className="border rounded-md p-2 bg-gray-50">
              <Row k="Period" v={open.period?.label ?? ""} />
              <Row
                k="Working days"
                v={`${open.workingDays} (paid-leave ${open.paidLeaveDays}, unpaid-leave ${open.unpaidLeaveDays})`}
              />
              <Row k="Basic monthly" v={peso(open.basicMonthly)} />
            </div>
            <div className="border rounded-md p-2">
              <Row k="Gross pay" v={peso(open.grossPay)} bold />
              <Row k="SSS (EE)" v={`- ${peso(open.sssEE)}`} />
              <Row k="PhilHealth (EE)" v={`- ${peso(open.philhealthEE)}`} />
              <Row k="Pag-IBIG (EE)" v={`- ${peso(open.pagibigEE)}`} />
              <Row k="Withholding tax" v={`- ${peso(open.withholdingTax)}`} />
              <Row
                k="Other deductions"
                v={`- ${peso(open.otherDeductions)}`}
              />
              <div className="border-t mt-1 pt-1">
                <Row k="NET PAY" v={peso(open.netPay)} bold accent />
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

const Row = ({
  k,
  v,
  bold,
  accent,
}: {
  k: string;
  v: string;
  bold?: boolean;
  accent?: boolean;
}) => (
  <div className="flex items-center justify-between py-0.5">
    <span className={`text-gray-600 ${bold ? "font-semibold" : ""}`}>{k}</span>
    <span
      className={`${bold ? "font-semibold" : ""} ${
        accent ? "text-emerald-700" : "text-gray-800"
      }`}
    >
      {v}
    </span>
  </div>
);
