import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";

import { useAuth } from "@/provider/ProtectedRoute";
import { archivedPersonnel, restorePersonnel } from "@/db/statement";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import Modal from "@/components/custom/Modal";
import {
  Archive,
  ArchiveRestore,
  Loader2,
  Search,
  UserCircle,
} from "lucide-react";

interface Page<T> {
  list: T[];
  hasMore: boolean;
  lastCursor: string | null;
}
interface Archived {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  username?: string | null;
  status: string;
  term?: string | null;
  archivedAt?: string | null;
  archiveReason?: string | null;
  userProfilePictures?: { file_url: string } | null;
  PositionSlot?: { pos?: { name?: string | null } | null } | null;
  Position?: { name?: string | null } | null;
  department?: { name?: string | null } | null;
}

const initials = (u: Archived) =>
  `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.toUpperCase() || "?";

const Archived = () => {
  const { lineId } = useParams();
  const nav = useNavigate();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const token = auth.token as string;

  const [text, setText] = useState("");
  const [query] = useDebounce(text, 500);
  const [restoreFor, setRestoreFor] = useState<Archived | null>(null);
  const [restoring, setRestoring] = useState(false);

  const q = useInfiniteQuery<Page<Archived>>({
    queryKey: ["archived-personnel", lineId, query],
    queryFn: ({ pageParam }) =>
      archivedPersonnel(
        token,
        lineId as string,
        pageParam as string | null,
        "20",
        query,
      ),
    initialPageParam: null,
    getNextPageParam: (last) => (last.hasMore ? last.lastCursor : undefined),
    enabled: !!token && !!lineId,
    refetchOnWindowFocus: false,
  });
  const people = q.data?.pages.flatMap((p) => p.list) ?? [];
  const { ref } = useInView({
    threshold: 0.5,
    onChange: (v) => {
      if (v && q.hasNextPage && !q.isFetchingNextPage) q.fetchNextPage();
    },
  });

  const submitRestore = async () => {
    if (!restoreFor) return;
    setRestoring(true);
    try {
      await restorePersonnel(token, {
        userId: restoreFor.id,
        lineId: lineId as string,
        actorId: auth.userId as string,
      });
      toast.success(
        `${restoreFor.firstName} ${restoreFor.lastName} restored — account re-enabled`,
      );
      setRestoreFor(null);
      queryClient.invalidateQueries({ queryKey: ["archived-personnel"] });
    } catch (e) {
      toast.error("Failed to restore", { description: `${e}` });
    } finally {
      setRestoring(false);
    }
  };

  const fmt = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString() : "—";

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex-none bg-white border-b px-4 py-3 flex items-center gap-2">
        <div className="p-1.5 bg-slate-600 rounded-md">
          <Archive className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-gray-900">Archived</h1>
          <p className="text-[11px] text-gray-500 leading-none mt-0.5">
            Concluded personnel — separated, contract ended, or vacated &amp;
            disabled (plantilla &amp; non-plantilla)
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-3 flex flex-col">
        <div className="flex items-center gap-2 mb-2 flex-none">
          <InputGroup className="bg-white flex-1 min-w-[200px] max-w-md">
            <InputGroupAddon>
              <Search className="h-3 w-3 text-gray-400" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search archived personnel..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="h-7 text-[11px]"
            />
          </InputGroup>
        </div>

        <div className="flex-1 min-h-0 overflow-auto space-y-2">
          {q.isFetching && people.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : people.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xs font-medium text-gray-700">
                No archived personnel
              </p>
              <p className="text-[10px] text-gray-500 mt-1">
                When an engagement ends or someone is vacated with access
                disabled, they'll appear here.
              </p>
            </div>
          ) : (
            people.map((u) => (
              <div
                key={u.id}
                className="border rounded-lg bg-white p-3 flex items-center gap-3"
              >
                <Avatar className="h-8 w-8 flex-none">
                  {u.userProfilePictures && (
                    <AvatarImage src={u.userProfilePictures.file_url} />
                  )}
                  <AvatarFallback className="text-[10px] bg-slate-100 text-slate-600">
                    {initials(u)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-900 truncate">
                    {u.lastName}, {u.firstName}
                    {u.middleName ? ` ${u.middleName[0]}.` : ""}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate">
                    {u.department?.name ?? "No unit"}
                    {" · "}
                    {u.PositionSlot?.pos?.name ?? u.Position?.name ?? "No position"}
                  </p>
                  {u.archiveReason && (
                    <p className="text-[10px] text-slate-500 italic truncate mt-0.5">
                      {u.archiveReason}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-none">
                  <Badge
                    variant="outline"
                    className="text-[10px] px-2 bg-slate-50 text-slate-600 border-slate-200"
                  >
                    {u.status}
                  </Badge>
                  <span className="text-[10px] text-gray-400">
                    Ended {fmt(u.term ?? u.archivedAt)}
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-none">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] gap-1 px-2 bg-white"
                    onClick={() => nav(`../employee/${u.id}`)}
                    title="View profile & platform record"
                  >
                    <UserCircle className="h-3 w-3 text-indigo-600" />
                    Profile
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] gap-1 px-2 bg-white text-emerald-700 hover:bg-emerald-50"
                    onClick={() => setRestoreFor(u)}
                    title="Restore & re-enable account"
                  >
                    <ArchiveRestore className="h-3 w-3" />
                    Restore
                  </Button>
                </div>
              </div>
            ))
          )}
          {q.hasNextPage && (
            <div ref={ref} className="py-2 text-center">
              {q.isFetchingNextPage && (
                <Loader2 className="h-3 w-3 animate-spin inline text-gray-400" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Restore confirm */}
      <Modal
        title={
          <div className="flex items-center gap-1.5 text-xs">
            <ArchiveRestore className="h-3 w-3 text-emerald-600" />
            Restore personnel
          </div>
        }
        onOpen={!!restoreFor}
        className="max-w-md"
        setOnOpen={() => setRestoreFor(null)}
        onFunction={submitRestore}
        loading={restoring}
        yesTitle="Restore"
        cancelTitle="Cancel"
        footer={true}
      >
        {restoreFor && (
          <p className="text-[11px] text-gray-600">
            Restore{" "}
            <span className="font-semibold text-gray-900">
              {restoreFor.firstName} {restoreFor.lastName}
            </span>
            ? They'll return to the active personnel list and their account login
            will be <span className="font-medium text-emerald-700">re-enabled</span>
            . They will not be re-assigned to a position automatically.
          </p>
        )}
      </Modal>
    </div>
  );
};

export default Archived;
