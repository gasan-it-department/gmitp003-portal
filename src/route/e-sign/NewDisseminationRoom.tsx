import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
import { useRoom } from "@/provider/DocumentRoomProvider";
//
import {
  disseminationDetail,
  finalizeDissemination,
  setDisseminationSignatories,
  setDisseminationTargets,
  signatoryCandidates,
  targetRoomCandidates,
  type SignatoryCandidate,
  type TargetRoomCandidate,
} from "@/db/statements/document";
import PlacementEditor from "@/layout/e-sign/PlacementEditor";
//
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Search,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  Building2,
  Users,
  FileText,
  Send,
  PenLine,
} from "lucide-react";

const surfaceErr = (err: unknown, fallback = "Something went wrong") => {
  const anyErr = err as any;
  return (
    anyErr?.response?.data?.message ||
    anyErr?.response?.data?.error ||
    anyErr?.message ||
    fallback
  );
};

const StepBadge = ({
  n,
  active,
  done,
  label,
}: {
  n: number;
  active: boolean;
  done: boolean;
  label: string;
}) => (
  <div className="flex items-center gap-1.5">
    <div
      className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-semibold border ${
        done
          ? "bg-emerald-500 text-white border-emerald-500"
          : active
            ? "bg-blue-600 text-white border-blue-600"
            : "bg-white text-gray-500 border-gray-300"
      }`}
    >
      {done ? <CheckCircle2 className="h-3 w-3" /> : n}
    </div>
    <span
      className={`text-xs ${active ? "font-semibold text-gray-900" : "text-gray-500"}`}
    >
      {label}
    </span>
  </div>
);

const NewDisseminationRoom = () => {
  const auth = useAuth();
  const { newRoomId: roomId } = useParams(); // queueRoom id
  const nav = useNavigate();
  const qc = useQueryClient();
  const { room } = useRoom();

  const { data, isFetching } = useQuery({
    queryKey: ["dissemination", "detail", roomId],
    queryFn: () =>
      disseminationDetail(auth.token as string, roomId as string),
    enabled: !!auth.token && !!roomId,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const [step, setStep] = useState(0);

  // ── selections (initialised from server) ──────────────────────────
  const [targets, setTargets] = useState<TargetRoomCandidate[]>([]);
  /**
   * Which of the chosen rooms are COPY FURNISHED rather than addressed.
   *
   * Held as a set of ids over the one `targets` list, not a second list, so
   * a room is addressed or copy furnished but never somehow both — the same
   * rule the server enforces.
   */
  const [ccIds, setCcIds] = useState<string[]>([]);
  const [signatories, setSignatories] = useState<SignatoryCandidate[]>([]);
  const [tQuery, setTQuery] = useState("");
  const [sQuery, setSQuery] = useState("");
  /** Max slot # used across placements — drives the minimum number of
   *  signatories the user must pick in the Signatories step. */
  const [maxSlot, setMaxSlot] = useState(0);

  useEffect(() => {
    if (!data) return;
    // Hydrate targets
    if (Array.isArray(data.targetRooms)) {
      setTargets(
        data.targetRooms.map((t: any) => ({
          id: t.roomReceiver?.id,
          code: t.roomReceiver?.code,
          address: t.roomReceiver?.address,
          status: 1,
        })),
      );
      setCcIds(
        data.targetRooms
          .filter((t: any) => t.copyFurnished)
          .map((t: any) => t.roomReceiver?.id)
          .filter(Boolean),
      );
    }
    // We can't hydrate signatories without a join, but the controller stores
    // index/status — keep them empty; user re-picks if they need changes.
  }, [data]);

  // ── candidate queries (loaded once, filtered client-side) ─────────
  const lineId = room?.lineId || data?.fromRoom?.lineId;
  const tCands = useQuery({
    queryKey: ["dissemination", "target-cands", lineId, room?.id],
    queryFn: () =>
      targetRoomCandidates(
        auth.token as string,
        lineId as string,
        room?.id,
        "",
      ),
    enabled: !!auth.token && !!lineId,
    // Always refetch so a recently-reset recipient's new room shows up
    // immediately, and rooms that lost their members disappear.
    refetchOnMount: "always",
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  });

  const sCands = useQuery({
    queryKey: ["dissemination", "sig-cands", lineId],
    queryFn: () =>
      signatoryCandidates(auth.token as string, lineId as string, ""),
    enabled: !!auth.token && !!lineId,
    refetchOnMount: "always",
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  });

  const filteredTargets = useMemo(() => {
    const list = tCands.data?.list ?? [];
    const q = tQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        (c.code ?? "").toLowerCase().includes(q) ||
        (c.address ?? "").toLowerCase().includes(q),
    );
  }, [tCands.data, tQuery]);

  const filteredSignatories = useMemo(() => {
    const list = sCands.data?.list ?? [];
    const q = sQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => {
      const fn = (c.user?.firstName ?? "").toLowerCase();
      const ln = (c.user?.lastName ?? "").toLowerCase();
      const un = (c.user?.username ?? "").toLowerCase();
      const pos = (c.user?.Position?.name ?? "").toLowerCase();
      const room = (c.receivingRoom?.code ?? "").toLowerCase();
      return (
        fn.includes(q) ||
        ln.includes(q) ||
        un.includes(q) ||
        `${fn} ${ln}`.includes(q) ||
        pos.includes(q) ||
        room.includes(q)
      );
    });
  }, [sCands.data, sQuery]);

  // ── mutations ─────────────────────────────────────────────────────
  const saveTargets = useMutation({
    mutationFn: () =>
      setDisseminationTargets(auth.token as string, {
        queueRoomId: roomId as string,
        targetRoomIds: addressed.map((t) => t.id),
        copyFurnishedRoomIds: furnished.map((t) => t.id),
        userId: auth.userId as string,
        lineId: lineId as string,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dissemination", "detail", roomId] });
      setStep(1);
    },
    onError: (e) => alert(surfaceErr(e)),
  });

  const saveSignatories = useMutation({
    mutationFn: () =>
      setDisseminationSignatories(auth.token as string, {
        queueRoomId: roomId as string,
        signatories: signatories.map((s) => ({ roomAuthorizedUserId: s.id })),
        userId: auth.userId as string,
        lineId: lineId as string,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dissemination", "detail", roomId] });
      setStep(2);
    },
    onError: (e) => alert(surfaceErr(e)),
  });

  const finalize = useMutation({
    mutationFn: () =>
      finalizeDissemination(auth.token as string, {
        queueRoomId: roomId as string,
        userId: auth.userId as string,
        lineId: lineId as string,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dissemination", "outbox"] });
      nav("..");
    },
    onError: (e) => alert(surfaceErr(e)),
  });

  // ── helpers ───────────────────────────────────────────────────────
  const isCc = useMemo(() => new Set(ccIds), [ccIds]);
  const addressed = useMemo(
    () => targets.filter((t) => !isCc.has(t.id)),
    [targets, isCc],
  );
  const furnished = useMemo(
    () => targets.filter((t) => isCc.has(t.id)),
    [targets, isCc],
  );

  const toggleTarget = (c: TargetRoomCandidate) => {
    setTargets((prev) =>
      prev.some((t) => t.id === c.id)
        ? prev.filter((t) => t.id !== c.id)
        : [...prev, c],
    );
    // Dropping a room drops its copy-furnished mark with it, so re-picking
    // it later starts from the ordinary case.
    setCcIds((prev) => prev.filter((id) => id !== c.id));
  };
  const setDelivery = (id: string, cc: boolean) =>
    setCcIds((prev) =>
      cc ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((x) => x !== id),
    );
  const addSignatory = (c: SignatoryCandidate) => {
    setSignatories((prev) =>
      prev.some((s) => s.id === c.id) ? prev : [...prev, c],
    );
  };
  const removeSignatory = (id: string) =>
    setSignatories((p) => p.filter((s) => s.id !== id));
  const moveSig = (idx: number, dir: -1 | 1) => {
    setSignatories((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  };

  const docCount = data?.documents?.length ?? 0;

  if (isFetching && !data) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading dissemination...
      </div>
    );
  }
  if (!data) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
        Dissemination not found.
      </div>
    );
  }

  return (
    <main className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => nav("..")}
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
        </Button>
        <div className="leading-tight min-w-0">
          <div className="text-xs font-semibold text-gray-900 truncate">
            {data.title || "(no subject)"}
          </div>
          <div className="text-[10px] text-gray-500 flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              From {data.fromRoom?.code || "—"}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {docCount} doc{docCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <StepBadge n={1} active={step === 0} done={step > 0} label="Targets" />
          <span className="text-gray-300">›</span>
          <StepBadge n={2} active={step === 1} done={step > 1} label="Signatories" />
          <span className="text-gray-300">›</span>
          <StepBadge n={3} active={step === 2} done={step > 2} label="Documents" />
          <span className="text-gray-300">›</span>
          <StepBadge n={4} active={step === 3} done={false} label="Review" />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        {step === 0 ? (
          <TargetsStep
            query={tQuery}
            setQuery={setTQuery}
            candidates={filteredTargets}
            total={tCands.data?.list?.length ?? 0}
            needMembers={tCands.data?.summary?.needMembers ?? 0}
            loading={tCands.isLoading}
            selected={targets}
            toggle={toggleTarget}
            isCc={isCc}
            setDelivery={setDelivery}
          />
        ) : step === 1 ? (
          <SignatoriesStep
            query={sQuery}
            setQuery={setSQuery}
            candidates={filteredSignatories}
            total={sCands.data?.list?.length ?? 0}
            loading={sCands.isLoading}
            selected={signatories}
            requiredSlots={maxSlot}
            add={addSignatory}
            remove={removeSignatory}
            move={moveSig}
          />
        ) : step === 2 ? (
          <PlacementEditor
            queueRoomId={roomId as string}
            token={auth.token as string}
            userId={auth.userId as string}
            lineId={lineId as string}
            onMaxSlotChange={setMaxSlot}
          />
        ) : (
          <ReviewStep
            targets={addressed}
            furnished={furnished}
            signatories={signatories}
            docCount={docCount}
            onSetupDocs={() => nav("file")}
          />
        )}
      </div>

      {/* Footer actions */}
      <div className="px-3 py-2 border-t bg-white flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => (step === 0 ? nav("..") : setStep(step - 1))}
          disabled={
            saveTargets.isPending || saveSignatories.isPending || finalize.isPending
          }
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          {step === 0 ? "Cancel" : "Previous"}
        </Button>
        <div className="text-[10px] text-gray-500">
          Step {step + 1} of 4
        </div>
        {step === 0 ? (
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={() => saveTargets.mutate()}
            disabled={addressed.length === 0 || saveTargets.isPending}
          >
            {saveTargets.isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : null}
            Next
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        ) : step === 1 ? (
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={() => saveSignatories.mutate()}
            disabled={
              saveSignatories.isPending || signatories.length === 0
            }
          >
            {saveSignatories.isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : null}
            Next
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        ) : step === 2 ? (
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={() => setStep(3)}
            disabled={docCount === 0}
            title={
              docCount === 0
                ? "Upload at least one document and place its signature boxes."
                : undefined
            }
          >
            Next
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        ) : (
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={() => finalize.mutate()}
            disabled={finalize.isPending}
          >
            {finalize.isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5 mr-1" />
            )}
            Dispatch
          </Button>
        )}
      </div>
    </main>
  );
};

export default NewDisseminationRoom;

// ─── Targets step ────────────────────────────────────────────────────
const TargetsStep = ({
  query,
  setQuery,
  candidates,
  total,
  needMembers,
  loading,
  selected,
  toggle,
  isCc,
  setDelivery,
}: {
  query: string;
  setQuery: (v: string) => void;
  candidates: TargetRoomCandidate[];
  total: number;
  /** How many offices exist but have nobody in them yet. */
  needMembers: number;
  loading: boolean;
  selected: TargetRoomCandidate[];
  toggle: (c: TargetRoomCandidate) => void;
  isCc: Set<string>;
  setDelivery: (id: string, cc: boolean) => void;
}) => {
  const selectedIds = useMemo(
    () => new Set(selected.map((s) => s.id)),
    [selected],
  );
  return (
    <div className="h-full grid grid-cols-2">
      {/* Candidates */}
      <div className="border-r flex flex-col">
        <div className="px-3 py-2 border-b bg-gray-50 space-y-1.5">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Browse or search rooms by code / address..."
              className="h-7 pl-7 pr-7 text-xs"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </button>
            ) : null}
          </div>
          <div className="text-[10px] text-gray-500">
            Showing {candidates.length} of {total} room{total === 1 ? "" : "s"}
            {needMembers > 0 ? (
              <>
                {" · "}
                <span className="text-amber-700">
                  {needMembers} {needMembers === 1 ? "office has" : "offices have"}{" "}
                  nobody in {needMembers === 1 ? "it" : "them"} yet and cannot
                  receive anything — add a member in Document Rooms.
                </span>
              </>
            ) : null}
          </div>
        </div>
        <div className="flex-1 overflow-auto p-3">
          {loading ? (
            <div className="h-32 flex items-center justify-center text-xs text-gray-500">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading...
            </div>
          ) : candidates.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-xs text-gray-500">
              {total === 0 ? "No rooms available." : "No rooms match your search."}
            </div>
          ) : (
            <div className="border rounded-lg bg-white overflow-hidden divide-y">
              {candidates.map((c) => {
                const on = selectedIds.has(c.id);
                // An office with nobody in it is shown, not hidden — it is
                // still their office and its absence read as a lost record.
                // It just cannot be picked: a document sent there lands
                // where no one can open it.
                const empty = c.receivable === false;
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={empty}
                    title={
                      empty
                        ? "Nobody has been added to this office yet, so it cannot receive anything. Add a member in Document Rooms."
                        : undefined
                    }
                    onClick={() => toggle(c)}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2 ${
                      empty
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:bg-gray-50"
                    } ${on ? "bg-blue-50/40" : ""}`}
                  >
                    <div
                      className={`h-4 w-4 rounded border flex items-center justify-center ${
                        empty
                          ? "border-gray-200 bg-gray-100"
                          : on
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "border-gray-300"
                      }`}
                    >
                      {on ? <CheckCircle2 className="h-3 w-3" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-gray-900 truncate flex items-center gap-1.5">
                        {c.code}
                        <span className="text-[9px] text-gray-400 font-mono">
                          · {c.id.slice(0, 6)}
                        </span>
                        {on && isCc.has(c.id) ? (
                          <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded px-1 py-px">
                            Copy furnished
                          </span>
                        ) : null}
                        {empty ? (
                          <span className="text-[9px] font-semibold text-gray-600 bg-gray-100 border border-gray-200 rounded px-1 py-px">
                            No members yet
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate">
                        {c.address || "—"}
                        {empty ? (
                          <span className="ml-1 text-gray-500">· no members</span>
                        ) : c.memberCount != null ? (
                          <span className="ml-1 text-gray-400">
                            · {c.memberCount} member
                            {c.memberCount === 1 ? "" : "s"}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {/* Selected */}
      <div className="flex flex-col">
        <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-gray-600" />
            <span className="text-xs font-semibold">Recipients</span>
          </div>
          <Badge variant="outline" className="text-[10px] h-5 px-1.5">
            {selected.length}
          </Badge>
        </div>
        <div className="flex-1 overflow-auto p-3 space-y-3">
          {selected.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-xs text-gray-500">
              Pick one or more rooms from the left.
            </div>
          ) : (
            <>
              <div className="border rounded-lg bg-white overflow-hidden divide-y">
                {selected.map((s) => {
                  const cc = isCc.has(s.id);
                  return (
                    // Wraps rather than squeezes: the room code is the one
                    // thing that must stay readable, and on a narrow panel
                    // the two-button control would otherwise truncate it to
                    // an ellipsis.
                    <div
                      key={s.id}
                      className="px-3 py-2 flex items-center gap-2 flex-wrap"
                    >
                      <div className="min-w-[8rem] flex-1">
                        <div className="text-xs font-medium truncate">
                          {s.code}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">
                          {s.address || "—"}
                        </div>
                      </div>
                      {/* Addressed to, or copy furnished. One or the other. */}
                      <div className="flex items-center rounded-md border overflow-hidden shrink-0 ml-auto">
                        <button
                          type="button"
                          onClick={() => setDelivery(s.id, false)}
                          title="Receives it as soon as it is dispatched"
                          className={`h-6 px-2 text-[10px] font-medium ${
                            cc
                              ? "bg-white text-gray-500 hover:bg-gray-50"
                              : "bg-blue-600 text-white"
                          }`}
                        >
                          Addressed
                        </button>
                        <button
                          type="button"
                          onClick={() => setDelivery(s.id, true)}
                          title="Receives it only once every signature is in"
                          className={`h-6 px-2 text-[10px] font-medium border-l ${
                            cc
                              ? "bg-amber-500 text-white"
                              : "bg-white text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          Copy furnished
                        </button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => toggle(s)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] leading-relaxed text-gray-500">
                <span className="font-semibold text-gray-700">Addressed</span>{" "}
                rooms get the document the moment it is dispatched, signatures
                still pending.{" "}
                <span className="font-semibold text-amber-700">
                  Copy furnished
                </span>{" "}
                rooms see nothing until every signature is in, then it is sent
                to them automatically.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Signatories step ────────────────────────────────────────────────
const SignatoriesStep = ({
  query,
  setQuery,
  candidates,
  total,
  loading,
  selected,
  requiredSlots,
  add,
  remove,
  move,
}: {
  query: string;
  setQuery: (v: string) => void;
  candidates: SignatoryCandidate[];
  total: number;
  loading: boolean;
  selected: SignatoryCandidate[];
  requiredSlots: number;
  add: (c: SignatoryCandidate) => void;
  remove: (id: string) => void;
  move: (idx: number, dir: -1 | 1) => void;
}) => {
  const selectedIds = useMemo(
    () => new Set(selected.map((s) => s.id)),
    [selected],
  );
  const name = (c: SignatoryCandidate) =>
    `${c.user?.firstName ?? ""} ${c.user?.lastName ?? ""}`.trim() ||
    c.user?.username ||
    "Unknown";

  return (
    <div className="h-full grid grid-cols-2">
      {/* Candidates */}
      <div className="border-r flex flex-col">
        <div className="px-3 py-2 border-b bg-gray-50 space-y-1.5">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Browse or search by name, position, room..."
              className="h-7 pl-7 pr-7 text-xs"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </button>
            ) : null}
          </div>
          <div className="text-[10px] text-gray-500">
            Showing {candidates.length} of {total} signator
            {total === 1 ? "y" : "ies"}
          </div>
        </div>
        <div className="flex-1 overflow-auto p-3">
          {loading ? (
            <div className="h-32 flex items-center justify-center text-xs text-gray-500">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading...
            </div>
          ) : candidates.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-xs text-gray-500">
              {total === 0
                ? "No signatories available."
                : "No signatories match your search."}
            </div>
          ) : (
            <div className="border rounded-lg bg-white overflow-hidden divide-y">
              {candidates.map((c) => {
                const on = selectedIds.has(c.id);
                return (
                  <div
                    key={c.id}
                    className="px-3 py-2 flex items-center gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium truncate">
                        {name(c)}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate">
                        {c.user?.Position?.name || "—"} ·{" "}
                        {c.receivingRoom?.code || "—"}
                      </div>
                    </div>
                    <Button
                      variant={on ? "outline" : "default"}
                      size="sm"
                      className="h-6 px-2 text-[10px]"
                      onClick={() => add(c)}
                      disabled={on}
                    >
                      {on ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Added
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3 mr-1" /> Add
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {/* Ordered selected */}
      <div className="flex flex-col">
        <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-gray-600" />
            <span className="text-xs font-semibold">Signing order</span>
          </div>
          <div className="flex items-center gap-1.5">
            {requiredSlots > 0 ? (
              <Badge
                variant="outline"
                className={`text-[10px] h-5 px-1.5 ${
                  selected.length >= requiredSlots
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {selected.length}/{requiredSlots} required
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                {selected.length}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-auto p-3">
          {requiredSlots > 0 && selected.length < requiredSlots ? (
            <div className="mb-2 px-2 py-1.5 rounded border border-amber-200 bg-amber-50 text-[10px] text-amber-800">
              Your documents use {requiredSlots} signatory slot
              {requiredSlots === 1 ? "" : "s"}. Pick at least{" "}
              {requiredSlots} signator
              {requiredSlots === 1 ? "y" : "ies"} so every box has someone to
              sign it.
            </div>
          ) : null}
          {selected.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-xs text-gray-500 text-center px-6">
              Add signatories from the left. Use the arrows to set the order
              in which they sign.
            </div>
          ) : (
            <div className="border rounded-lg bg-white overflow-hidden divide-y">
              {selected.map((s, i) => (
                <div
                  key={s.id}
                  className="px-2 py-2 flex items-center gap-2"
                >
                  <div className="h-5 w-5 rounded-full bg-blue-600 text-white text-[10px] font-semibold flex items-center justify-center shrink-0">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate">
                      {name(s)}
                    </div>
                    <div className="text-[10px] text-gray-500 truncate">
                      {s.user?.Position?.name || "—"} ·{" "}
                      {s.receivingRoom?.code || "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => move(i, 1)}
                      disabled={i === selected.length - 1}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-rose-600"
                      onClick={() => remove(s.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Review step ─────────────────────────────────────────────────────
const ReviewStep = ({
  targets,
  furnished,
  signatories,
  docCount,
  onSetupDocs,
}: {
  targets: TargetRoomCandidate[];
  furnished: TargetRoomCandidate[];
  signatories: SignatoryCandidate[];
  docCount: number;
  onSetupDocs: () => void;
}) => {
  const name = (c: SignatoryCandidate) =>
    `${c.user?.firstName ?? ""} ${c.user?.lastName ?? ""}`.trim() ||
    c.user?.username ||
    "Unknown";
  return (
    <div className="h-full overflow-auto p-4">
      <div className="max-w-3xl mx-auto space-y-3">
        {/* Targets */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-gray-600" />
              <span className="text-xs font-semibold">Addressed to</span>
            </div>
            <Badge variant="outline" className="text-[10px] h-5 px-1.5">
              {targets.length}
            </Badge>
          </div>
          <div className="divide-y">
            {targets.length === 0 ? (
              <div className="px-3 py-4 text-xs text-gray-500 text-center">
                No targets selected.
              </div>
            ) : (
              targets.map((t) => (
                <div key={t.id} className="px-3 py-2">
                  <div className="text-xs font-medium">{t.code}</div>
                  <div className="text-[10px] text-gray-500 truncate">
                    {t.address || "—"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Copy furnished — held back until it is fully signed */}
        {furnished.length > 0 ? (
          <div className="border border-amber-200 rounded-lg bg-white overflow-hidden">
            <div className="px-3 py-2 border-b border-amber-200 bg-amber-50 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-amber-700" />
                <span className="text-xs font-semibold text-amber-900">
                  Copy furnished
                </span>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] h-5 px-1.5 border-amber-300 text-amber-800"
              >
                {furnished.length}
              </Badge>
            </div>
            <div className="divide-y">
              {furnished.map((t) => (
                <div key={t.id} className="px-3 py-2">
                  <div className="text-xs font-medium">{t.code}</div>
                  <div className="text-[10px] text-gray-500 truncate">
                    {t.address || "—"}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-3 py-2 border-t bg-amber-50/50 text-[10px] text-amber-800">
              Sent automatically once every signature is in. Until then these
              offices see nothing.
            </div>
          </div>
        ) : null}

        {/* Signatories */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-gray-600" />
              <span className="text-xs font-semibold">Signing order</span>
            </div>
            <Badge variant="outline" className="text-[10px] h-5 px-1.5">
              {signatories.length}
            </Badge>
          </div>
          <div className="divide-y">
            {signatories.length === 0 ? (
              <div className="px-3 py-4 text-xs text-gray-500 text-center">
                No signatories — documents will be routed without e-sign.
              </div>
            ) : (
              signatories.map((s, i) => (
                <div
                  key={s.id}
                  className="px-3 py-2 flex items-center gap-2"
                >
                  <div className="h-5 w-5 rounded-full bg-blue-600 text-white text-[10px] font-semibold flex items-center justify-center">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate">
                      {name(s)}
                    </div>
                    <div className="text-[10px] text-gray-500 truncate">
                      {s.user?.Position?.name || "—"} ·{" "}
                      {s.receivingRoom?.code || "—"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Documents */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-gray-600" />
              <span className="text-xs font-semibold">Documents</span>
            </div>
            <Badge
              variant="outline"
              className={`text-[10px] h-5 px-1.5 ${
                docCount === 0
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : ""
              }`}
            >
              {docCount}
            </Badge>
          </div>
          <div className="px-3 py-3 flex items-center justify-between gap-2">
            <div className="text-[10px] text-gray-500">
              {docCount === 0
                ? "Attach at least one document before dispatching."
                : "Optionally place e-signature boxes on the documents."}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={onSetupDocs}
              disabled={docCount === 0}
            >
              <PenLine className="h-3.5 w-3.5 mr-1" />
              Place signatures
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
