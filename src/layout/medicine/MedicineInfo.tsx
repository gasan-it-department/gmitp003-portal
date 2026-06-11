import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { removeStorage } from "@/db/statements/storage";
import { formatDate } from "@/utils/date";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Modal from "@/components/custom/Modal";
import ConfirmDelete from "../ConfirmDelete";

import {
  Package,
  Calendar,
  Hash,
  AlertTriangle,
  Trash2,
  Building2,
  Network,
  Pill,
  Users,
  TrendingDown,
  CalendarClock,
  Loader2,
} from "lucide-react";

import type { MedicineStorage } from "@/interface/data";

interface StorageStats {
  medicineCount: number;
  totalStockUnits: number;
  lowStockCount: number;
  expiringSoonCount: number;
  accessCount: number;
}

interface StorageWithStats extends MedicineStorage {
  stats?: StorageStats;
  status?: number;
}

interface Props {
  item: StorageWithStats;
  token: string;
  lineId: string;
  userId: string;
}

const MedicineInfo = ({ item, token, lineId, userId }: Props) => {
  const [isOpen, setIsOpen] = useState(0);
  const nav = useNavigate();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: () => removeStorage(token, item.id, userId, lineId),
    onSuccess: () => {
      toast.success("Storage removed");
      nav(-1);
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ??
        (err instanceof Error ? err.message : "Failed to remove storage");
      toast.error(msg);
    },
  });

  const stats = item.stats;

  const statTiles: {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    accent: string;
    hint?: string;
  }[] = [
    {
      label: "Medicines",
      value: stats?.medicineCount ?? 0,
      icon: <Pill className="h-3 w-3 text-white" />,
      accent: "from-blue-500 to-blue-600",
      hint: "Distinct items",
    },
    {
      label: "Total Units",
      value: stats?.totalStockUnits ?? 0,
      icon: <Package className="h-3 w-3 text-white" />,
      accent: "from-emerald-500 to-emerald-600",
      hint: "On-hand stock",
    },
    {
      label: "Low Stock",
      value: stats?.lowStockCount ?? 0,
      icon: <TrendingDown className="h-3 w-3 text-white" />,
      accent: "from-amber-500 to-amber-600",
      hint: "Below threshold",
    },
    {
      label: "Expiring",
      value: stats?.expiringSoonCount ?? 0,
      icon: <CalendarClock className="h-3 w-3 text-white" />,
      accent: "from-red-500 to-red-600",
      hint: "Within 6 months",
    },
  ];

  return (
    <div className="p-3 space-y-3">

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {statTiles.map((t) => (
          <div
            key={t.label}
            className="border rounded-md bg-white p-2 overflow-hidden"
          >
            <div
              className={`h-0.5 bg-gradient-to-r ${t.accent} rounded-full mb-1.5`}
            />
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-medium text-gray-600">{t.label}</p>
              <div className={`p-1 rounded bg-gradient-to-br ${t.accent}`}>
                {t.icon}
              </div>
            </div>
            <p className="text-base font-bold text-gray-900 leading-none">
              {t.value}
            </p>
            {t.hint && (
              <p className="text-[10px] text-gray-400 mt-0.5">{t.hint}</p>
            )}
          </div>
        ))}
      </div>

      {/* Overview card */}
      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Package className="h-3 w-3 text-blue-500" />
            <h4 className="text-xs font-semibold text-gray-800">
              Storage Overview
            </h4>
          </div>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
            {item.refNumber}
          </Badge>
        </div>
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">
              Storage Name
            </p>
            <p className="text-xs font-medium text-gray-900 mt-1">
              {item.name}
            </p>
          </div>

          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <Hash className="h-2.5 w-2.5" /> Reference
            </p>
            <p className="text-xs font-mono text-gray-700 mt-1 break-all">
              {item.refNumber}
            </p>
          </div>

          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <Calendar className="h-2.5 w-2.5" /> Created
            </p>
            <p className="text-xs text-gray-700 mt-1">
              {formatDate(item.timestamp)}
            </p>
          </div>

          {item.unit && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide flex items-center gap-1">
                <Building2 className="h-2.5 w-2.5" /> Department
              </p>
              <p className="text-xs text-gray-700 mt-1">
                {item.unit.name ?? "—"}
              </p>
            </div>
          )}

          {item.line && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide flex items-center gap-1">
                <Network className="h-2.5 w-2.5" /> Line
              </p>
              <p className="text-xs text-gray-700 mt-1">
                {item.line.name ?? item.lineId ?? "—"}
              </p>
            </div>
          )}

          {typeof stats?.accessCount === "number" && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide flex items-center gap-1">
                <Users className="h-2.5 w-2.5" /> Authorized Users
              </p>
              <p className="text-xs text-gray-700 mt-1">
                {stats.accessCount}
              </p>
            </div>
          )}

          {item.desc && (
            <div className="sm:col-span-2">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                Description
              </p>
              <p className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded border whitespace-pre-wrap">
                {item.desc}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Danger zone */}
      <div className="border border-red-200 rounded-lg bg-white overflow-hidden">
        <div className="px-3 py-2 border-b border-red-100 bg-red-50 flex items-center gap-1.5">
          <AlertTriangle className="h-3 w-3 text-red-600" />
          <div>
            <h4 className="text-xs font-semibold text-red-900">Danger Zone</h4>
            <p className="text-[10px] text-red-700 leading-none mt-0.5">
              Irreversible actions
            </p>
          </div>
        </div>
        <div className="p-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2.5 bg-red-50 rounded-md border border-red-100">
            <div className="min-w-0">
              <p className="text-xs font-medium text-red-800">
                Remove Storage Location
              </p>
              <p className="text-[10px] text-red-600 mt-0.5">
                Soft-delete this location. Stock must be zero or transferred
                first — the audit trail is preserved.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="h-7 text-[10px] gap-1.5 bg-red-600 hover:bg-red-700 flex-shrink-0"
              disabled={isPending}
              onClick={() => setIsOpen(1)}
            >
              {isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              Remove Storage
            </Button>
          </div>
        </div>
      </div>

      <Modal
        title={undefined}
        children={
          <ConfirmDelete
            title="Removal"
            confirmation={"confirm"}
            setOnOpen={() => {
              if (isPending) return;
              setIsOpen(0);
            }}
            onFunction={() => {
              if (!isPending) mutateAsync();
            }}
            isLoading={isPending}
          />
        }
        onOpen={isOpen === 1}
        className=""
        footer={1}
        setOnOpen={() => {
          if (isPending) return;
          setIsOpen(0);
        }}
      />
    </div>
  );
};

export default MedicineInfo;
