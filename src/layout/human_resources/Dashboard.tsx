import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";

import { useAuth } from "@/provider/ProtectedRoute";
import { humanResourcesDashboard } from "@/db/statements/dashboard";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Users,
  FileText,
  Briefcase,
  Building,
  Megaphone,
  FileEdit,
  ArrowUp,
  ArrowDown,
  Minus,
  LayoutDashboard,
  RefreshCw,
  AlertCircle,
  Loader2,
  ChevronRight,
  Activity,
} from "lucide-react";

import type { HumanResourcesDashboardProps } from "@/interface/data";

const Dashboard = () => {
  const { lineId } = useParams();
  const auth = useAuth();
  const nav = useNavigate();

  const { data, isFetching, isError, error, refetch, dataUpdatedAt } =
    useQuery<HumanResourcesDashboardProps>({
      queryKey: ["human-resources", lineId],
      queryFn: () =>
        humanResourcesDashboard(auth.token as string, lineId as string),
      enabled: !!lineId && !!auth.token,
      refetchInterval: 30_000, // auto-pulse
      refetchOnWindowFocus: false,
    });

  // ── Loading (first paint) ─────────────────────────────────────────
  if (isFetching && !data) return <DashboardSkeleton lineId={lineId} />;

  // ── Error ─────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-3">
        <div className="border rounded-lg bg-white p-6 text-center max-w-sm w-full">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <h3 className="text-xs font-semibold text-gray-900 mb-1">
            Failed to load dashboard
          </h3>
          <p className="text-[10px] text-gray-500 mb-3">
            {(error as any)?.message ?? "Try again later."}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[10px] gap-1.5"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const tiles: Tile[] = [
    {
      title: "Employees",
      value: data.employees,
      icon: <Users className="h-3 w-3 text-white" />,
      accent: "from-blue-500 to-blue-600",
      hoverBorder: "hover:border-blue-300",
      desc: "Active in this line",
      trend: data.trends?.employees,
      onClick: () => nav(`/${lineId}/human-resources/employee`),
    },
    {
      title: "Applications",
      value: data.applications,
      icon: <FileText className="h-3 w-3 text-white" />,
      accent: "from-emerald-500 to-emerald-600",
      hoverBorder: "hover:border-emerald-300",
      desc: "Pending review",
      trend: data.trends?.applications,
      onClick: () => nav(`/${lineId}/human-resources/application`),
    },
    {
      title: "Posted Jobs",
      value: data.postedJobs,
      icon: <Briefcase className="h-3 w-3 text-white" />,
      accent: "from-purple-500 to-purple-600",
      hoverBorder: "hover:border-purple-300",
      desc: "Currently published",
      trend: data.trends?.postedJobs,
      onClick: () => nav(`/${lineId}/human-resources/application/post`),
    },
    {
      title: "Vacancies",
      value: data.vacancies,
      icon: <Building className="h-3 w-3 text-white" />,
      accent: "from-amber-500 to-amber-600",
      hoverBorder: "hover:border-amber-300",
      desc: "Open position slots",
    },
    {
      title: "Live Announcements",
      value: data.announcementsLive,
      icon: <Megaphone className="h-3 w-3 text-white" />,
      accent: "from-teal-500 to-teal-600",
      hoverBorder: "hover:border-teal-300",
      desc: "Published & visible",
      trend: data.trends?.announcements,
      onClick: () => nav(`/${lineId}/human-resources/announcement`),
    },
    {
      title: "Draft Announcements",
      value: data.announcementDraft,
      icon: <FileEdit className="h-3 w-3 text-white" />,
      accent: "from-slate-500 to-slate-600",
      hoverBorder: "hover:border-slate-300",
      desc: "Not yet published",
      onClick: () => nav(`/${lineId}/human-resources/announcement`),
    },
  ];

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b flex-shrink-0">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-blue-600 rounded-md flex-shrink-0">
              <LayoutDashboard className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-semibold text-gray-900 truncate">
                HR Dashboard
              </h1>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                Auto-refresh every 30 s · last updated {lastUpdated}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              Line {lineId?.slice(-6).toUpperCase()}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px] gap-1.5"
              disabled={isFetching}
              onClick={() => refetch()}
            >
              {isFetching ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-auto p-3">
        <div className="max-w-6xl mx-auto space-y-3">

          {/* Tile grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {tiles.map((t) => (
              <TileCard key={t.title} tile={t} />
            ))}
          </div>

          {/* Activity feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <ActivityCard
              title="Recent Applications"
              icon={<FileText className="h-3 w-3 text-blue-500" />}
              empty="No applications yet."
              onSeeAll={() => nav(`/${lineId}/human-resources/application`)}
              items={(data.recent?.applications ?? []).map((a) => ({
                id: a.id,
                primary:
                  `${a.firstname ?? ""} ${a.lastname ?? ""}`.trim() ||
                  "Unnamed",
                secondary: a.forPosition?.name ?? "—",
                ts: a.timestamp,
                badge: appStatusBadge(a.status),
                onClick: () =>
                  nav(`/${lineId}/human-resources/application/${a.id}`),
              }))}
            />

            <ActivityCard
              title="Recent Job Posts"
              icon={<Briefcase className="h-3 w-3 text-blue-500" />}
              empty="No job posts yet."
              onSeeAll={() =>
                nav(`/${lineId}/human-resources/application/post`)
              }
              items={(data.recent?.jobs ?? []).map((j) => ({
                id: j.id,
                primary: j.position?.name ?? "—",
                secondary:
                  j.status === 1
                    ? "Published"
                    : j.status === 0
                      ? "Draft"
                      : j.status === 3
                        ? "Paused"
                        : "Unknown",
                ts: j.timestamp,
                badge: jobStatusBadge(j.status),
              }))}
            />

            <ActivityCard
              title="Recent Announcements"
              icon={<Megaphone className="h-3 w-3 text-blue-500" />}
              empty="No announcements yet."
              onSeeAll={() => nav(`/${lineId}/human-resources/announcement`)}
              items={(data.recent?.announcements ?? []).map((a) => ({
                id: a.id,
                primary: a.title || "Untitled",
                secondary: a.status === 1 ? "Live" : "Draft",
                ts: a.createdAt,
                badge:
                  a.status === 1
                    ? {
                        label: "Live",
                        cls:
                          "bg-emerald-50 text-emerald-700 border-emerald-200",
                      }
                    : {
                        label: "Draft",
                        cls: "bg-gray-50 text-gray-600 border-gray-200",
                      },
                onClick: () =>
                  nav(
                    `/${lineId}/human-resources/announcement/${a.id}`,
                  ),
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────

interface Tile {
  title: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
  hoverBorder: string;
  desc: string;
  trend?: number;
  onClick?: () => void;
}

const TileCard = ({ tile }: { tile: Tile }) => {
  const trend = tile.trend;
  const trendIcon =
    trend === undefined ? null : trend > 0 ? (
      <ArrowUp className="h-2.5 w-2.5" />
    ) : trend < 0 ? (
      <ArrowDown className="h-2.5 w-2.5" />
    ) : (
      <Minus className="h-2.5 w-2.5" />
    );
  const trendCls =
    trend === undefined
      ? ""
      : trend > 0
        ? "text-emerald-600"
        : trend < 0
          ? "text-red-600"
          : "text-gray-500";

  return (
    <button
      type="button"
      onClick={tile.onClick}
      disabled={!tile.onClick}
      className={`text-left border rounded-md bg-white p-2 transition-colors overflow-hidden ${
        tile.onClick ? `cursor-pointer ${tile.hoverBorder}` : "cursor-default"
      }`}
    >
      <div
        className={`h-0.5 bg-gradient-to-r ${tile.accent} rounded-full mb-1.5`}
      />
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-medium text-gray-600 truncate">
          {tile.title}
        </p>
        <div className={`p-1 rounded bg-gradient-to-br ${tile.accent}`}>
          {tile.icon}
        </div>
      </div>
      <p className="text-base font-bold text-gray-900 leading-none">
        {tile.value}
      </p>
      <div className="flex items-center justify-between mt-1">
        <p className="text-[10px] text-gray-400 truncate">{tile.desc}</p>
        {trend !== undefined && (
          <span
            className={`flex items-center gap-0.5 text-[10px] font-medium ${trendCls}`}
            title="Week-over-week change"
          >
            {trendIcon}
            {Math.abs(trend)}
          </span>
        )}
      </div>
    </button>
  );
};

interface ActivityItem {
  id: string;
  primary: string;
  secondary?: string;
  ts: string | Date;
  badge?: { label: string; cls: string };
  onClick?: () => void;
}

const ActivityCard = ({
  title,
  icon,
  items,
  empty,
  onSeeAll,
}: {
  title: string;
  icon: React.ReactNode;
  items: ActivityItem[];
  empty: string;
  onSeeAll?: () => void;
}) => (
  <div className="border rounded-lg bg-white overflow-hidden">
    <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5">
        <Activity className="h-3 w-3 text-blue-500" />
        <h3 className="text-xs font-semibold text-gray-800">{title}</h3>
      </div>
      {onSeeAll && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-1.5 text-[10px] gap-0.5 text-blue-600 hover:bg-blue-50"
          onClick={onSeeAll}
        >
          See all
          <ChevronRight className="h-2.5 w-2.5" />
        </Button>
      )}
    </div>
    <div>
      {items.length === 0 ? (
        <div className="p-3 text-center">
          <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-gray-100 flex items-center justify-center">
            {icon}
          </div>
          <p className="text-[10px] text-gray-500">{empty}</p>
        </div>
      ) : (
        <ul className="divide-y">
          {items.map((it) => (
            <li
              key={it.id}
              className={`px-3 py-2 flex items-start justify-between gap-2 ${
                it.onClick ? "hover:bg-blue-50/40 cursor-pointer" : ""
              }`}
              onClick={it.onClick}
            >
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-gray-900 truncate">
                  {it.primary}
                </p>
                {it.secondary && (
                  <p className="text-[10px] text-gray-500 truncate">
                    {it.secondary}
                  </p>
                )}
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {formatRelative(it.ts)}
                </p>
              </div>
              {it.badge && (
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${it.badge.cls}`}
                >
                  {it.badge.label}
                </Badge>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);

const appStatusBadge = (s: number) => {
  if (s === 0)
    return {
      label: "Pending",
      cls: "bg-amber-50 text-amber-700 border-amber-200",
    };
  if (s === 1)
    return {
      label: "Viewed",
      cls: "bg-blue-50 text-blue-700 border-blue-200",
    };
  return {
    label: "Concluded",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
};

const jobStatusBadge = (s: number) => {
  if (s === 1)
    return {
      label: "Live",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  if (s === 3)
    return {
      label: "Paused",
      cls: "bg-orange-50 text-orange-700 border-orange-200",
    };
  return {
    label: "Draft",
    cls: "bg-gray-50 text-gray-600 border-gray-200",
  };
};

const formatRelative = (input: string | Date) => {
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const sec = Math.round(diffMs / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  if (sec < 60) return `${sec}s ago`;
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
};

const DashboardSkeleton = ({ lineId }: { lineId?: string }) => (
  <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
    <div className="bg-white border-b flex-shrink-0">
      <div className="px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-md" />
          <div>
            <Skeleton className="h-3 w-32 mb-1" />
            <Skeleton className="h-2.5 w-44" />
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {lineId ? `Line ${lineId.slice(-6).toUpperCase()}` : "—"}
        </Badge>
      </div>
    </div>
    <div className="flex-1 overflow-auto p-3">
      <div className="max-w-6xl mx-auto space-y-3">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="border rounded-md bg-white p-2 overflow-hidden"
            >
              <Skeleton className="h-0.5 w-full rounded-full mb-1.5" />
              <div className="flex items-center justify-between mb-1">
                <Skeleton className="h-2.5 w-20" />
                <Skeleton className="h-5 w-5 rounded" />
              </div>
              <Skeleton className="h-5 w-12 mb-1" />
              <Skeleton className="h-2.5 w-28" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="border rounded-lg bg-white overflow-hidden"
            >
              <Skeleton className="h-8 w-full" />
              <div className="p-3 space-y-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-10 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default Dashboard;
