import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/provider/ProtectedRoute";
import { medicineInsights, type InsightRow } from "@/db/statements/medicine";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Activity,
  Pill,
  AlertCircle,
} from "lucide-react";

const WINDOWS = [
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "6 months", days: 180 },
  { label: "1 year", days: 365 },
];

/* Horizontal bar list — readable with long medicine names. */
const BarList = ({
  rows,
  color,
  emptyText,
  valueSuffix = "",
  secondary,
}: {
  rows: InsightRow[];
  color: string;
  emptyText: string;
  valueSuffix?: string;
  secondary?: (r: InsightRow) => string;
}) => {
  const max = Math.max(1, ...rows.map((r) => r.units));
  if (rows.length === 0)
    return <p className="text-[11px] text-gray-400 italic py-6 text-center">{emptyText}</p>;
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.medicineId} className="group">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="text-[11px] font-medium text-gray-800 truncate">
              {r.name}
            </span>
            <span className="text-[11px] font-semibold text-gray-900 tabular-nums flex-shrink-0">
              {r.units.toLocaleString()}
              {valueSuffix}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.max(3, (r.units / max) * 100)}%`, backgroundColor: color }}
            />
          </div>
          {secondary && (
            <p className="text-[9.5px] text-gray-400 mt-0.5">{secondary(r)}</p>
          )}
        </div>
      ))}
    </div>
  );
};

/* Compact SVG area+line trend chart. */
const TrendChart = ({ points }: { points: Array<{ label: string; units: number }> }) => {
  const W = 560;
  const H = 180;
  const padX = 8;
  const padY = 16;
  if (points.length === 0)
    return <p className="text-[11px] text-gray-400 italic py-8 text-center">No dispensing in this period yet.</p>;
  const max = Math.max(1, ...points.map((p) => p.units));
  const n = points.length;
  const x = (i: number) => (n === 1 ? W / 2 : padX + (i * (W - 2 * padX)) / (n - 1));
  const y = (v: number) => padY + (H - 2 * padY) * (1 - v / max);
  const line = points.map((p, i) => `${x(i)},${y(p.units)}`).join(" ");
  const area = `${padX},${H - padY} ${line} ${W - padX},${H - padY}`;
  // show at most ~8 labels to avoid crowding
  const labelEvery = Math.ceil(n / 8);
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H + 22}`} className="w-full min-w-[420px]" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="trendfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#trendfill)" />
        <polyline points={line} fill="none" stroke="#2563eb" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.units)} r={2.5} fill="#2563eb" />
        ))}
        {points.map((p, i) =>
          i % labelEvery === 0 || i === n - 1 ? (
            <text key={`l${i}`} x={x(i)} y={H + 12} textAnchor="middle" className="fill-gray-400" style={{ fontSize: 9 }}>
              {p.label}
            </text>
          ) : null,
        )}
      </svg>
    </div>
  );
};

const Card = ({
  title,
  icon,
  hint,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div className="border rounded-xl bg-white overflow-hidden">
    <div className="px-4 py-2.5 border-b bg-gray-50/70">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-xs font-semibold text-gray-800">{title}</h3>
      </div>
      {hint && <p className="text-[10px] text-gray-500 mt-0.5">{hint}</p>}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const Insights = () => {
  const { lineId } = useParams();
  const auth = useAuth();
  const nav = useNavigate();
  const [days, setDays] = useState(90);

  const { data, isFetching, isError, error } = useQuery({
    queryKey: ["medicine-insights", lineId, days],
    queryFn: () => medicineInsights(auth.token as string, lineId as string, days),
    enabled: !!auth.token && !!lineId,
    refetchOnWindowFocus: false,
  });

  const stat = useMemo(
    () => [
      { label: "Units dispensed", value: data?.totalDispensedUnits ?? 0, icon: <Activity className="h-4 w-4 text-blue-600" /> },
      { label: "Medicines dispensed", value: data?.distinctMedicinesDispensed ?? 0, icon: <Pill className="h-4 w-4 text-violet-600" /> },
      { label: "Need reordering", value: data?.reorder.length ?? 0, icon: <ShoppingCart className="h-4 w-4 text-red-600" /> },
    ],
    [data],
  );

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between gap-2 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => nav(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="p-1.5 bg-blue-600 rounded-md">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Pharmacy Dashboard</h1>
            <p className="text-[11px] text-gray-500 leading-none mt-0.5">
              What to buy more of — based on what's actually being dispensed
            </p>
          </div>
        </div>
        <div className="flex p-0.5 bg-gray-100 rounded-lg">
          {WINDOWS.map((w) => (
            <button
              key={w.days}
              onClick={() => setDays(w.days)}
              className={`h-7 px-2.5 text-[10px] font-medium rounded-md transition ${
                days === w.days ? "bg-white shadow-sm text-blue-700" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-w-5xl w-full mx-auto space-y-4">
        {isFetching && !data ? (
          <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
            <Spinner className="w-5 h-5" />
            <span className="text-sm">Crunching dispensing data…</span>
          </div>
        ) : isError ? (
          <div className="text-center py-16">
            <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-red-600">Could not load the dashboard</p>
            <p className="text-xs text-gray-500 mt-1">
              {(error as any)?.response?.data?.message ?? "Try again later."}
            </p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              {stat.map((s) => (
                <div key={s.label} className="border rounded-xl bg-white p-3">
                  <div className="flex items-center gap-1.5">
                    {s.icon}
                    <span className="text-[10px] text-gray-500 uppercase tracking-wide">{s.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">
                    {s.value.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            {/* Reorder priority — most actionable, up top */}
            <Card
              title="Reorder priority — demand is outrunning stock"
              icon={<ShoppingCart className="h-3.5 w-3.5 text-red-600" />}
              hint="Dispensed more in this period than you currently have on hand. Buy these first."
            >
              {(data?.reorder.length ?? 0) === 0 ? (
                <p className="text-[11px] text-gray-400 italic py-4 text-center">
                  Nothing urgent — current stock covers recent demand.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {data!.reorder.map((r) => (
                    <div key={r.medicineId} className="flex items-center justify-between gap-2 border rounded-lg px-3 py-2 bg-red-50/40 border-red-100">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-gray-900 truncate">{r.name}</p>
                        <p className="text-[10px] text-gray-500">
                          Dispensed <strong>{r.units.toLocaleString()}</strong> · on hand{" "}
                          <strong>{r.onHand.toLocaleString()}</strong>
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 border-red-200 flex-shrink-0">
                        short {(r.shortfall ?? 0).toLocaleString()}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card
                title="Fast-moving (high demand)"
                icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-600" />}
                hint="Most dispensed — keep these well stocked."
              >
                <BarList
                  rows={data?.top ?? []}
                  color="#059669"
                  valueSuffix=" units"
                  emptyText="No dispensing recorded yet."
                  secondary={(r) => `on hand: ${r.onHand.toLocaleString()}`}
                />
              </Card>

              <Card
                title="Slow-moving (low demand)"
                icon={<TrendingDown className="h-3.5 w-3.5 text-amber-600" />}
                hint="In stock but barely dispensed — review before buying more."
              >
                <BarList
                  rows={data?.slow ?? []}
                  color="#d97706"
                  valueSuffix=" units"
                  emptyText="No slow-moving stock."
                  secondary={(r) => `on hand: ${r.onHand.toLocaleString()}`}
                />
              </Card>
            </div>

            <Card
              title="Dispensing trend"
              icon={<Activity className="h-3.5 w-3.5 text-blue-600" />}
              hint="Total units dispensed over time — spot rising or falling demand."
            >
              <TrendChart points={data?.trend ?? []} />
            </Card>

            <p className="text-[10px] text-gray-400 text-center">
              Based on prescription and direct dispenses in the selected period. Use alongside expiry
              and current stock when planning purchases.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Insights;
