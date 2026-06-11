import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";

import { medicineOverview } from "@/db/statements/medicine";

import {
  Package,
  Pill,
  CalendarClock,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import type { MedicineOverviewProps } from "@/interface/data";

interface Props {
  token: string;
  lineId: string;
}

interface Tile {
  label: string;
  value: number;
  hint: string;
  hintIcon?: React.ReactNode;
  icon: React.ReactNode;
  accent: string;
  hoverBorder: string;
  onClick?: () => void;
}

const MedicineDashboard = ({ token, lineId }: Props) => {
  const nav = useNavigate();
  const { lineId: paramLineId } = useParams();
  const activeLineId = paramLineId ?? lineId;

  const { data, isFetching, error, refetch } = useQuery<MedicineOverviewProps>({
    enabled: !!token && !!lineId,
    queryKey: ["medicine-overview", lineId],
    queryFn: () => medicineOverview(token, lineId),
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  if (isFetching && !data) {
    return (
      <div className="border-t bg-white">
        <div className="px-3 py-2 flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
          <span className="text-[10px] text-gray-500">
            Loading overview...
          </span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="border-t bg-white">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-red-600">
            <AlertCircle className="h-3 w-3" />
            <span className="text-[10px] font-medium">
              Failed to load overview
            </span>
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="h-6 text-[10px] gap-1"
          >
            <RefreshCw className="h-2.5 w-2.5" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const tiles: Tile[] = [
    {
      label: "Storage",
      value: data.storage || 0,
      hint: "Active locations",
      icon: <Package className="h-3 w-3 text-white" />,
      accent: "from-blue-500 to-blue-600",
      hoverBorder: "hover:border-blue-300",
      onClick: activeLineId ? () => nav(`/${activeLineId}/medicine`) : undefined,
    },
    {
      label: "Inventory",
      value: data.medicines?.total || 0,
      hint: `${data.medicines?.lowStock || 0} low stock`,
      hintIcon: <TrendingUp className="h-2.5 w-2.5 text-amber-500" />,
      icon: <Pill className="h-3 w-3 text-white" />,
      accent: "from-green-500 to-green-600",
      hoverBorder: "hover:border-green-300",
    },
    {
      label: "Expiring Soon",
      value: data.nearExpiration || 0,
      hint: data.nearExpirationUnits
        ? `${data.nearExpirationUnits} units${
            data.nearExpirationByQuality?.length
              ? " — " +
                data.nearExpirationByQuality
                  .slice(0, 2)
                  .map((q) => `${q.units} ${q.quality}`)
                  .join(", ")
              : ""
          }`
        : "Within 6 months",
      icon: <CalendarClock className="h-3 w-3 text-white" />,
      accent: "from-amber-500 to-amber-600",
      hoverBorder: "hover:border-amber-300",
      onClick: activeLineId
        ? () => nav(`/${activeLineId}/medicine/expiration?mode=soon`)
        : undefined,
    },
    {
      label: "Expired",
      value: data.expired || 0,
      hint: data.expiredUnits
        ? `${data.expiredUnits} units${
            data.expiredByQuality?.length
              ? " — " +
                data.expiredByQuality
                  .slice(0, 2)
                  .map((q) => `${q.units} ${q.quality}`)
                  .join(", ")
              : ""
          }`
        : "Past expiration",
      icon: <CalendarClock className="h-3 w-3 text-white" />,
      accent: "from-red-500 to-red-600",
      hoverBorder: "hover:border-red-300",
      onClick: activeLineId
        ? () => nav(`/${activeLineId}/medicine/expiration?mode=expired`)
        : undefined,
    },
  ];

  return (
    <div className="border-t bg-white">
      <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-semibold text-gray-800">
            Medicine Overview
          </h4>
          <p className="text-[10px] text-gray-500 leading-none mt-0.5">
            At-a-glance pharmaceutical inventory
          </p>
        </div>
      </div>
      <div className="p-2 grid grid-cols-2 lg:grid-cols-4 gap-2">
        {tiles.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={t.onClick}
            disabled={!t.onClick}
            className={`text-left border rounded-md bg-white p-2 transition-colors overflow-hidden ${
              t.onClick ? `cursor-pointer ${t.hoverBorder}` : "cursor-default"
            }`}
          >
            <div className={`h-0.5 bg-gradient-to-r ${t.accent} rounded-full mb-1.5`} />
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-medium text-gray-600">
                {t.label}
              </p>
              <div className={`p-1 rounded bg-gradient-to-br ${t.accent}`}>
                {t.icon}
              </div>
            </div>
            <p className="text-base font-bold text-gray-900 leading-none">
              {t.value}
            </p>
            <div className="flex items-center gap-1 mt-1">
              {t.hintIcon}
              <p className="text-[10px] text-gray-400">{t.hint}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MedicineDashboard;
