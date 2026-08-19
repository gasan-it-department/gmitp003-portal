import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
//
import {
  roomConfig,
  roomCandidates,
  updateRoomConfig,
  addRoomMembers,
  updateRoomMember,
  removeRoomMember,
  type RoomMember,
  type RoomMemberType,
} from "@/db/statements/document";
//
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Modal from "@/components/custom/Modal";
import { toast } from "sonner";
import {
  Building2,
  Loader2,
  Save,
  UserPlus,
  UserRound,
  Search,
  X,
  ShieldCheck,
  Inbox,
  Crown,
  MailCheck,
} from "lucide-react";

const surfaceErr = (err: unknown, fallback = "Something went wrong") => {
  const e = err as any;
  return (
    e?.response?.data?.message ||
    e?.response?.data?.error ||
    e?.message ||
    fallback
  );
};

const ROLES: { value: RoomMemberType; label: string; hint: string }[] = [
  { value: 1, label: "Signatory", hint: "Can sign documents in this room" },
  { value: 2, label: "Receiver", hint: "Can receive and act on documents" },
  { value: 0, label: "Owner", hint: "Full control, including this page" },
];

const roleIcon = (t: RoomMemberType) =>
  t === 0 ? Crown : t === 2 ? Inbox : ShieldCheck;

const roleTone = (t: RoomMemberType) =>
  t === 0
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : t === 2
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";

/**
 * Document room configuration: its name and address, and who is a signatory,
 * receiver or owner.
 *
 * Everything destructive is guarded server-side too — the last owner cannot be
 * demoted or removed, and removal is soft so past signatures stay
 * attributable. The UI mirrors those rules rather than being the only place
 * they exist.
 */
const RoomConfig = ({ roomId }: { roomId: string }) => {
  const auth = useAuth();
  const token = auth.token as string;
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Record<string, true>>({});
  const [addRole, setAddRole] = useState<RoomMemberType>(1);
  const [confirmRemove, setConfirmRemove] = useState<RoomMember | null>(null);

  const cfg = useQuery({
    queryKey: ["room-config", roomId],
    queryFn: () => roomConfig(token, roomId),
    enabled: !!token && !!roomId,
  });

  // Seed the editable fields once, and re-seed if the room itself changes.
  useEffect(() => {
    if (!cfg.data?.room) return;
    setName(cfg.data.room.code ?? "");
    setAddress(cfg.data.room.address ?? "");
  }, [cfg.data?.room?.id, cfg.data?.room?.code, cfg.data?.room?.address]);

  const candidates = useQuery({
    queryKey: ["room-candidates", roomId, query],
    queryFn: () => roomCandidates(token, roomId, query || undefined),
    enabled: addOpen && !!token,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["room-config", roomId] });
    qc.invalidateQueries({ queryKey: ["room", roomId] });
  };

  const saveDetails = useMutation({
    mutationFn: () =>
      updateRoomConfig(token, { roomId, code: name.trim(), address }),
    onSuccess: () => {
      toast.success("Room details saved");
      refresh();
    },
    onError: (e) => toast.error(surfaceErr(e, "Could not save the room")),
  });

  const add = useMutation({
    mutationFn: () =>
      addRoomMembers(token, {
        roomId,
        userIds: Object.keys(picked),
        type: addRole,
      }),
    onSuccess: (r) => {
      toast.success(
        `${r.added} added — ${r.notified} notified by app and email.`,
      );
      setAddOpen(false);
      setPicked({});
      setQuery("");
      refresh();
    },
    onError: (e) => toast.error(surfaceErr(e, "Could not add them")),
  });

  const changeRole = useMutation({
    mutationFn: (v: { memberId: string; type: RoomMemberType }) =>
      updateRoomMember(token, { roomId, ...v }),
    onSuccess: () => {
      toast.success("Role updated — they have been notified");
      refresh();
    },
    onError: (e) => toast.error(surfaceErr(e, "Could not change that role")),
  });

  const remove = useMutation({
    mutationFn: (memberId: string) => removeRoomMember(token, roomId, memberId),
    onSuccess: () => {
      toast.success("Removed from the room — they have been notified");
      setConfirmRemove(null);
      refresh();
    },
    onError: (e) => toast.error(surfaceErr(e, "Could not remove them")),
  });

  const room = cfg.data?.room;
  const members = cfg.data?.members ?? [];
  const owners = members.filter((m) => m.type === 0).length;
  const dirty =
    !!room && (name.trim() !== room.code || address !== (room.address ?? ""));
  const chosen = Object.keys(picked).length;

  if (cfg.isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }
  if (cfg.isError || !room) {
    return (
      <div className="p-4 text-sm text-red-700">
        {surfaceErr(cfg.error, "Could not load this room's configuration.")}
      </div>
    );
  }

  return (
    <div className="p-3 max-w-4xl mx-auto space-y-3">
      {/* ── Name + address ─────────────────────────────────────────────── */}
      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
          <Building2 className="h-3 w-3 text-blue-500" />
          <h3 className="text-xs font-semibold text-gray-800">Room details</h3>
        </div>
        <div className="p-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-medium text-gray-600">
                Room name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mayor's Office Receiving"
                className="h-9 mt-1"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Must be unique across all document rooms.
              </p>
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-600">
                Address
              </label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Where this room physically is"
                className="h-9 mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              className="gap-1.5 bg-blue-600 hover:bg-blue-700"
              disabled={!dirty || !name.trim() || saveDetails.isPending}
              onClick={() => saveDetails.mutate()}
            >
              {saveDetails.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save changes
            </Button>
          </div>
        </div>
      </div>

      {/* ── Members ────────────────────────────────────────────────────── */}
      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-blue-500" />
            <h3 className="text-xs font-semibold text-gray-800">
              Signatories &amp; receivers
            </h3>
            <span className="text-[10px] text-gray-500 tabular-nums">
              {members.length}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[10px] gap-1.5"
            onClick={() => setAddOpen(true)}
          >
            <UserPlus className="h-3 w-3" />
            Add people
          </Button>
        </div>

        <div className="px-3 py-2 border-b bg-blue-50/40 flex items-start gap-2">
          <MailCheck className="h-3.5 w-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-blue-900">
            Anyone added, removed, or given a different role is notified
            automatically — in the portal and by email.
          </p>
        </div>

        {members.length === 0 ? (
          <div className="p-8 text-center">
            <UserRound
              className="h-10 w-10 mx-auto text-gray-300"
              strokeWidth={1.5}
            />
            <p className="text-xs text-gray-500 mt-2 font-medium">
              Nobody in this room yet
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Add a signatory or a receiver to start routing documents here.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {members.map((m) => {
              const Icon = roleIcon(m.type);
              const lastOwner = m.type === 0 && owners <= 1;
              return (
                <div key={m.id} className="px-3 py-2.5 flex items-center gap-2.5">
                  {m.profilePicture ? (
                    <img
                      src={m.profilePicture}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover border flex-shrink-0"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-100 border flex items-center justify-center flex-shrink-0">
                      <UserRound className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {m.name}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">
                      {m.position ?? "—"}
                      {m.office ? ` · ${m.office}` : ""}
                    </p>
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-[10px] px-2 gap-1 ${roleTone(m.type)}`}
                  >
                    <Icon className="h-2.5 w-2.5" />
                    {m.role}
                  </Badge>

                  <Select
                    value={String(m.type)}
                    disabled={lastOwner || changeRole.isPending}
                    onValueChange={(v) =>
                      changeRole.mutate({
                        memberId: m.id,
                        type: Number(v) as RoomMemberType,
                      })
                    }
                  >
                    <SelectTrigger className="h-7 w-[120px] text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r.value} value={String(r.value)}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-gray-400 hover:text-destructive hover:bg-destructive/10"
                    disabled={lastOwner}
                    title={
                      lastOwner
                        ? "The room's only owner — promote someone else first"
                        : "Remove from this room"
                    }
                    onClick={() => setConfirmRemove(m)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add people ─────────────────────────────────────────────────── */}
      <Modal
        title="Add to this room"
        onOpen={addOpen}
        setOnOpen={() => setAddOpen(false)}
        className="sm:max-w-2xl"
        footer={true}
        loading={add.isPending}
        yesTitle={chosen ? `Add ${chosen}` : "Add"}
        onFunction={() => {
          if (!chosen) {
            toast.error("Pick at least one person");
            return;
          }
          add.mutate();
        }}
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Select
              value={String(addRole)}
              onValueChange={(v) => setAddRole(Number(v) as RoomMemberType)}
            >
              <SelectTrigger className="h-9 w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={String(r.value)}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, position or office…"
                className="pl-9 h-9"
              />
            </div>
          </div>
          <p className="text-[11px] text-gray-500">
            {ROLES.find((r) => r.value === addRole)?.hint}
          </p>

          <div className="border rounded-lg divide-y max-h-[45vh] overflow-y-auto">
            {candidates.isLoading ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : (candidates.data?.candidates ?? []).length === 0 ? (
              <p className="py-10 text-sm text-center text-gray-500">
                Nobody matches that search.
              </p>
            ) : (
              (candidates.data?.candidates ?? []).map((c) => {
                const on = !!picked[c.id];
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={c.added}
                    onClick={() =>
                      setPicked((p) => {
                        if (p[c.id]) {
                          const { [c.id]: _drop, ...rest } = p;
                          return rest;
                        }
                        return { ...p, [c.id]: true };
                      })
                    }
                    className={`w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors ${
                      c.added
                        ? "bg-gray-50 cursor-not-allowed"
                        : on
                          ? "bg-blue-50/70"
                          : "hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      readOnly
                      disabled={c.added}
                      checked={on || c.added}
                      className="h-4 w-4 accent-blue-600 flex-shrink-0"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {c.name}
                        </span>
                        {c.added && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-200 text-gray-600">
                            Already in the room
                          </span>
                        )}
                      </span>
                      <span className="block text-xs text-gray-500 truncate">
                        {c.position ?? "—"}
                        {c.office ? ` · ${c.office}` : ""}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </Modal>

      {/* ── Confirm removal ────────────────────────────────────────────── */}
      <Modal
        title="Remove from this room?"
        onOpen={!!confirmRemove}
        setOnOpen={() => setConfirmRemove(null)}
        className="sm:max-w-md"
        footer={true}
        loading={remove.isPending}
        yesTitle="Remove"
        onFunction={() => {
          if (confirmRemove) remove.mutate(confirmRemove.id);
        }}
      >
        <div className="text-sm text-gray-600 space-y-2">
          <p>
            <strong className="text-gray-900">{confirmRemove?.name}</strong>{" "}
            will lose access to this document room, and will be notified.
          </p>
          <p className="text-xs text-gray-500">
            Anything they already signed or received stays on the record — they
            are removed from the room, not erased from its history.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default RoomConfig;
