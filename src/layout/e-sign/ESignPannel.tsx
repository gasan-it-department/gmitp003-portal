import { useMemo } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
import { useRoom } from "@/provider/DocumentRoomProvider";
//
import { documentOverview } from "@/db/statements/document";
//
import { Badge } from "@/components/ui/badge";
import {
  Archive,
  Send,
  PenLine,
  Inbox,
  ExternalLink,
  Loader2,
  Clock,
  CheckCircle2,
  FileText,
  Building2,
  type LucideIcon,
} from "lucide-react";

// Working modules only — anything that doesn't have a real backend path
// gets pruned. Each tile uses the live overview counts where it makes
// sense, otherwise a static blurb. No more mock / "Soon" placeholders.
interface Tile {
  name: string;
  description: string;
  Icon: LucideIcon;
  path: string;
  badge?: (o: OverviewLike) => string | null;
  accent?: string;
}

interface OverviewLike {
  archive: { total: number };
  dissemination: { draft: number; active: number; completed: number };
  myRoom: { id: string | null; inbox: number; outbox: number };
  signatures: { mine: number; pendingForMe: number };
}

const TILES: Tile[] = [
  {
    name: "Document Archive",
    description: "Search, browse and preview archived municipal documents.",
    Icon: Archive,
    path: "archive",
    badge: (o) => (o.archive.total ? `${o.archive.total} archived` : null),
  },
  {
    name: "Upload to Archive",
    description: "Upload a new document and tag it for long-term retention.",
    Icon: FileText,
    path: "archive/new",
  },
  {
    name: "Dissemination",
    description: "Route documents to other rooms and request e-signatures.",
    Icon: Send,
    path: "dissemination",
    badge: (o) =>
      o.dissemination.active
        ? `${o.dissemination.active} active`
        : o.dissemination.draft
          ? `${o.dissemination.draft} draft`
          : null,
    accent: "blue",
  },
  {
    name: "Signature Management",
    description:
      "Manage your e-sign images: upload, activate and remove.",
    Icon: PenLine,
    path: "manage-signature",
    badge: (o) =>
      o.signatures.mine ? `${o.signatures.mine} on file` : null,
  },
  {
    name: "Self Sign",
    description:
      "Upload your own PDF, drop signature boxes, sign every field in one click.",
    Icon: PenLine,
    path: "self-sign",
  },
];

const ESignPannel = () => {
  const nav = useNavigate();
  const auth = useAuth();
  const { room } = useRoom();
  const lineId = room?.lineId;

  const { data, isLoading } = useQuery({
    queryKey: ["document-overview", lineId, auth.userId],
    queryFn: () =>
      documentOverview(
        auth.token as string,
        lineId as string,
        auth.userId as string,
      ),
    enabled: !!auth.token && !!lineId,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });

  const overview: OverviewLike = useMemo(
    () =>
      data ?? {
        archive: { total: 0 },
        dissemination: { draft: 0, active: 0, completed: 0 },
        myRoom: { id: room?.id ?? null, inbox: 0, outbox: 0 },
        signatures: { mine: 0, pendingForMe: 0 },
      },
    [data, room?.id],
  );

  const stats = [
    {
      label: "Archive total",
      value: overview.archive.total,
      Icon: Archive,
      bg: "bg-blue-50",
      fg: "text-blue-600",
    },
    {
      label: "Active disseminations",
      value: overview.dissemination.active,
      Icon: Send,
      bg: "bg-violet-50",
      fg: "text-violet-600",
      hint: `${overview.dissemination.draft} draft · ${overview.dissemination.completed} done`,
    },
    {
      label: "Inbox",
      value: overview.myRoom.inbox,
      Icon: Inbox,
      bg: "bg-emerald-50",
      fg: "text-emerald-600",
      hint: room?.code ? `Room ${room.code}` : "No room assigned",
    },
    {
      label: "Pending my signature",
      value: overview.signatures.pendingForMe,
      Icon: Clock,
      bg: "bg-amber-50",
      fg: "text-amber-600",
    },
  ];

  return (
    <div className="w-full p-3 space-y-3">
      {/* Room context strip */}
      <div className="border rounded-lg bg-white px-3 py-2 flex items-center gap-2">
        <Building2 className="h-3.5 w-3.5 text-gray-500" />
        <span className="text-xs text-gray-700">
          Operating room:{" "}
          {room?.code ? (
            <span className="font-semibold">{room.code}</span>
          ) : (
            <span className="text-gray-400">— not set —</span>
          )}
        </span>
        {room?.address ? (
          <span className="text-[10px] text-gray-500 truncate">
            · {room.address}
          </span>
        ) : null}
        <Badge variant="outline" className="ml-auto text-[10px] h-5 px-1.5">
          <CheckCircle2 className="h-2.5 w-2.5 mr-1 text-emerald-600" />
          Operational
        </Badge>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="border rounded-lg bg-white overflow-hidden"
          >
            <div className="px-3 py-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide truncate">
                  {s.label}
                </p>
                <p className="text-base font-bold text-gray-900 mt-0.5">
                  {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-300" />
                  ) : (
                    s.value.toLocaleString()
                  )}
                </p>
              </div>
              <div className={`p-1.5 rounded-md flex-shrink-0 ${s.bg}`}>
                <s.Icon className={`h-3.5 w-3.5 ${s.fg}`} />
              </div>
            </div>
            {s.hint ? (
              <div className="px-3 py-1 border-t bg-gray-50">
                <p className="text-[10px] text-gray-500 truncate">{s.hint}</p>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {/* Modules */}
      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-gray-800">
              Document tools
            </h3>
            <p className="text-[10px] text-gray-500 leading-none mt-0.5">
              {TILES.length} working modules · scoped to your room
            </p>
          </div>
        </div>
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {TILES.map((t) => {
            const badge = t.badge?.(overview);
            return (
              <button
                key={t.path}
                type="button"
                onClick={() => nav(t.path)}
                className="group text-left border rounded-lg bg-white overflow-hidden hover:border-blue-300 hover:shadow-sm transition"
              >
                <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <t.Icon className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                    <span className="text-xs font-semibold text-gray-800 truncate">
                      {t.name}
                    </span>
                  </div>
                  {badge ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] h-5 px-1.5"
                    >
                      {badge}
                    </Badge>
                  ) : null}
                </div>
                <div className="px-3 py-2">
                  <p className="text-[10px] text-gray-600 leading-relaxed line-clamp-2">
                    {t.description}
                  </p>
                </div>
                <div className="px-3 py-1.5 border-t bg-gray-50 flex items-center justify-end">
                  <ExternalLink className="h-3 w-3 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ESignPannel;
