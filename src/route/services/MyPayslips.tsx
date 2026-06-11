import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useAuth } from "@/provider/ProtectedRoute";
import { listPayslips, type PayslipRow } from "@/db/statements/leave";
//
import { Badge } from "@/components/ui/badge";
import Modal from "@/components/custom/Modal";
import {
  ArrowLeft,
  Wallet,
  Inbox,
  Loader2,
  FileText,
} from "lucide-react";

const peso = (n: number) =>
  n.toLocaleString("en-PH", { style: "currency", currency: "PHP" });

const MyPayslips = () => {
  const { lineId } = useParams();
  const auth = useAuth();
  const [open, setOpen] = useState<PayslipRow | null>(null);

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
    queryKey: ["payslips", "mine", auth.userId],
    queryFn: ({ pageParam }) =>
      listPayslips(auth.token as string, {
        userId: auth.userId as string,
        lastCursor: pageParam,
        limit: "30",
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (l) => (l.hasMore ? l.lastCursor : undefined),
    enabled: !!auth.token && !!auth.userId,
    refetchOnMount: "always",
  });
  const rows = useMemo(
    () => (data?.pages ?? []).flatMap((p) => p.list),
    [data],
  );

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
          <Wallet className="h-3.5 w-3.5 text-gray-700" />
        </div>
        <div>
          <div className="text-xs font-semibold">My Payslips</div>
          <div className="text-[10px] text-gray-500">
            Your computed and released payslips.
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3">
        {isLoading ? (
          <div className="h-40 flex items-center justify-center text-xs text-gray-500">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...
          </div>
        ) : rows.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center">
            <Inbox className="h-6 w-6 text-gray-300 mb-2" />
            <div className="text-xs font-medium text-gray-700">
              No payslips yet
            </div>
            <div className="text-[10px] text-gray-500">
              Released payroll periods will appear here.
            </div>
          </div>
        ) : (
          <div className="border rounded-lg bg-white overflow-hidden divide-y">
            {rows.map((r) => (
              <div
                key={r.id}
                className="px-3 py-2 flex items-center gap-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => setOpen(r)}
              >
                <FileText className="h-4 w-4 text-gray-500" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium truncate">
                      {r.period?.label ?? "Period"}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] h-5 px-1.5 ${
                        r.status === "released"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {r.status}
                    </Badge>
                  </div>
                  <div className="mt-0.5 text-[10px] text-gray-500">
                    {r.period
                      ? `${new Date(r.period.periodStart).toLocaleDateString()} → ${new Date(
                          r.period.periodEnd,
                        ).toLocaleDateString()}`
                      : ""}
                  </div>
                </div>
                <div className="text-xs font-semibold text-emerald-700">
                  {peso(r.netPay)}
                </div>
              </div>
            ))}
            <div ref={ref} className="h-6 flex items-center justify-center">
              {isFetchingNextPage ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
              ) : null}
            </div>
          </div>
        )}
      </div>

      <Modal
        title={open ? `Payslip — ${open.period?.label ?? ""}` : ""}
        onOpen={!!open}
        setOnOpen={() => setOpen(null)}
        footer={false}
        cancelTitle="Close"
        className=""
      >
        {open ? (
          <div className="text-xs space-y-2">
            <div className="border rounded-md p-2 bg-gray-50">
              <Row k="Working days" v={`${open.workingDays}`} />
              <Row k="Paid leave days" v={`${open.paidLeaveDays}`} />
              <Row k="Unpaid leave days" v={`${open.unpaidLeaveDays}`} />
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

export default MyPayslips;

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
