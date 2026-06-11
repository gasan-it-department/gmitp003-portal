import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
import { positionRecords } from "@/db/statements/position";
//tabs
import Application from "@/layout/human_resources/position/Application";
import SlotHistory from "@/layout/human_resources/position/SlotHistory";

//
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
//icons
import {
  Briefcase,
  Building2,
  Hash,
  Calendar,
  Users,
  FileText,
  GraduationCap,
  Banknote,
  History,
  Layers,
} from "lucide-react";

interface PositionDetailData {
  id: string;
  designation?: string | null;
  itemNumber?: string | null;
  plantilla?: boolean;
  fixToUnit?: boolean;
  timestamp?: string;
  position?: {
    id: string;
    name: string;
    /** Prisma exposes the relation as PascalCase on the Position model. */
    SalaryGrade?: { grade: number; amount: number } | null;
  } | null;
  unit?: { id: string; name: string } | null;
  line?: { id: string; name: string } | null;
  occupiedSlots?: number;
  totalSlots?: number;
  _count?: {
    slot?: number;
    submittedApplications?: number;
    unitPositionHistories?: number;
  };
}

const PositionDetail = () => {
  const { positionId } = useParams();
  const auth = useAuth();

  const { data, isFetching } = useQuery<PositionDetailData>({
    queryKey: ["position-data", positionId],
    queryFn: () => positionRecords(auth.token as string, positionId as string),
    enabled: !!positionId,
    refetchOnWindowFocus: false,
  });

  if (isFetching && !data) {
    return (
      <div className="w-full h-full p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const totalSlots = data?.totalSlots ?? data?._count?.slot ?? 0;
  const occupiedSlots = data?.occupiedSlots ?? 0;
  const vacantSlots = Math.max(0, totalSlots - occupiedSlots);
  const apps = data?._count?.submittedApplications ?? 0;
  const histCount = data?._count?.unitPositionHistories ?? 0;

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* ── Sticky header ───────────────────────────────────────────── */}
      <div className="flex-none border-b bg-white">
        <div className="px-4 py-3">
          {/* Title row */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-gray-900 truncate">
                  {data?.position?.name || "Position"}
                </h1>
                <Badge
                  variant="outline"
                  className={
                    data?.plantilla
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0"
                      : "text-[10px] px-1.5 py-0"
                  }
                >
                  {data?.plantilla ? "Plantilla" : "Non-Plantilla"}
                </Badge>
                {data?.fixToUnit && (
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0"
                  >
                    Fixed to Unit
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                {data?.unit?.name || "—"}
                <span className="text-gray-300">·</span>
                {data?.line?.name || "—"}
              </p>
            </div>

            {/* Slot fill counter */}
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="px-2 py-1 bg-white gap-1.5 text-[10px]"
              >
                <Users className="w-3 h-3 text-gray-500" />
                <span className="font-semibold">
                  {occupiedSlots}/{totalSlots}
                </span>
                <span className="text-gray-500">slots filled</span>
              </Badge>
              {vacantSlots > 0 && (
                <Badge
                  variant="outline"
                  className="px-2 py-1 bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
                >
                  {vacantSlots} vacant
                </Badge>
              )}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
            <StatCard
              icon={Briefcase}
              tone="blue"
              label="Designation"
              value={data?.designation || "—"}
            />
            <StatCard
              icon={Hash}
              tone="purple"
              label="Item No."
              value={data?.itemNumber || "—"}
            />
            <StatCard
              icon={GraduationCap}
              tone="emerald"
              label="Salary Grade"
              value={
                data?.position?.SalaryGrade
                  ? `SG ${data.position.SalaryGrade.grade}`
                  : "—"
              }
              subValue={
                data?.position?.SalaryGrade
                  ? `₱${data.position.SalaryGrade.amount.toLocaleString()}`
                  : undefined
              }
              subIcon={Banknote}
            />
            <StatCard
              icon={Calendar}
              tone="amber"
              label="Created"
              value={
                data?.timestamp
                  ? new Date(data.timestamp).toLocaleDateString()
                  : "—"
              }
            />
          </div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 px-4 py-3 flex flex-col">
        <Tabs defaultValue="history" className="w-full h-full flex flex-col">
          <div className="flex-none">
            <TabsList className="bg-white border shadow-sm p-1 w-full sm:w-auto justify-start h-8">
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-primary data-[state=active]:text-white px-3 h-6 text-[11px] gap-1.5"
              >
                <History className="w-3.5 h-3.5" />
                Slot History
                {histCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="h-4 px-1 text-[9px] leading-none ml-1"
                  >
                    {histCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="application"
                className="data-[state=active]:bg-primary data-[state=active]:text-white px-3 h-6 text-[11px] gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                Applications
                {apps > 0 && (
                  <Badge
                    variant="secondary"
                    className="h-4 px-1 text-[9px] leading-none ml-1"
                  >
                    {apps}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 mt-3 min-h-0">
            <TabsContent
              value="history"
              className="h-full mt-0 data-[state=active]:flex data-[state=active]:flex-col"
            >
              <Card className="h-full border shadow-sm overflow-hidden flex flex-col">
                <CardContent className="p-0 h-full min-h-0 flex-1 flex flex-col">
                  <SlotHistory
                    unitPositionId={positionId as string}
                    token={auth.token as string}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent
              value="application"
              className="h-full mt-0 data-[state=active]:flex data-[state=active]:flex-col"
            >
              <Card className="h-full border shadow-sm overflow-hidden flex flex-col">
                <CardContent className="p-0 h-full min-h-0 flex-1 flex flex-col">
                  <Application
                    unitPositionId={positionId as string}
                    token={auth.token as string}
                    userId={auth.userId as string}
                    lineId={data?.line?.id ?? ""}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

// ── helpers ─────────────────────────────────────────────────────────────
type Tone = "blue" | "purple" | "amber" | "emerald";

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  tone: Tone;
  label: string;
  value: string;
  subValue?: string;
  subIcon?: React.ComponentType<{ className?: string }>;
}

const StatCard = ({
  icon: Icon,
  tone,
  label,
  value,
  subValue,
  subIcon: SubIcon,
}: StatCardProps) => {
  const palette: Record<Tone, { bg: string; fg: string }> = {
    blue: { bg: "bg-blue-100", fg: "text-blue-700" },
    purple: { bg: "bg-purple-100", fg: "text-purple-700" },
    amber: { bg: "bg-amber-100", fg: "text-amber-700" },
    emerald: { bg: "bg-emerald-100", fg: "text-emerald-700" },
  };
  const c = palette[tone];
  return (
    <Card className="bg-gray-50/80 border-0 shadow-none">
      <CardContent className="p-2 flex items-center gap-2">
        <div className={`p-1.5 ${c.bg} rounded-md flex-shrink-0`}>
          <Icon className={`w-3.5 h-3.5 ${c.fg}`} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-gray-500 leading-none">{label}</p>
          <p className="text-xs font-semibold text-gray-900 truncate mt-0.5">
            {value}
          </p>
          {subValue && (
            <p className="text-[10px] text-gray-500 flex items-center gap-0.5 mt-0.5">
              {SubIcon && <SubIcon className="w-2.5 h-2.5" />}
              {subValue}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PositionDetail;
