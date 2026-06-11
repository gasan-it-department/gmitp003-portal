import { useMemo, useState } from "react";
import zod from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { useInView } from "react-intersection-observer";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "@/db/axios";
//
import {
  cancelDispatchedDissemination,
  disseminationOutbox,
  removeDissemination,
} from "@/db/statements/document";
import { Textarea } from "@/components/ui/textarea";

const surfaceErr = (err: unknown, fallback = "Something went wrong") => {
  const anyErr = err as any;
  return (
    anyErr?.response?.data?.message ||
    anyErr?.response?.data?.error ||
    anyErr?.message ||
    fallback
  );
};
//
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Modal from "@/components/custom/Modal";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  FileText,
  Users,
  Send,
  Trash2,
  Loader2,
  Inbox,
  Ban,
} from "lucide-react";

const NewSchema = zod.object({
  roomName: zod.string().min(2, "Subject must be at least 2 characters"),
});
type NewForm = zod.infer<typeof NewSchema>;

interface Props {
  roomId: string;
  userId: string;
  token: string;
  lineId: string;
}

const STATUS: Record<number, { label: string; cls: string }> = {
  0: { label: "Draft", cls: "bg-gray-100 text-gray-700 border-gray-200" },
  1: { label: "Active", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  2: {
    label: "Completed",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  3: { label: "Cancelled", cls: "bg-rose-50 text-rose-700 border-rose-200" },
};

const LIMIT = "20";

const DisseminationOutbox = ({ roomId, userId, token, lineId }: Props) => {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [onOpen, setOnOpen] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<{ id: string; title: string } | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const { ref } = useInView({
    onChange(inView) {
      if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
  });

  const {
    data,
    isFetching,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["dissemination", "outbox", roomId, query, status],
    queryFn: ({ pageParam }) =>
      disseminationOutbox(token, roomId, pageParam, LIMIT, query, status),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => (last.hasMore ? last.lastCursor : undefined),
    enabled: !!token && !!roomId,
    refetchOnMount: "always",
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  });

  const rows = useMemo(
    () => (data?.pages ?? []).flatMap((p) => p.list as any[]),
    [data],
  );

  const form = useForm<NewForm>({
    resolver: zodResolver(NewSchema),
    defaultValues: { roomName: "" },
  });

  const createMu = useMutation({
    mutationFn: async (body: NewForm) => {
      const res = await axios.post(
        "/document/route",
        {
          roomName: body.roomName,
          roomId,
          userId,
          lineId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
        },
      );
      return res.data as { id: string };
    },
    onSuccess: (d) => {
      setOnOpen(0);
      form.reset();
      qc.invalidateQueries({ queryKey: ["dissemination", "outbox", roomId] });
      nav(`set-up/${d.id}`);
    },
    onError: (e) => alert(surfaceErr(e)),
  });

  const removeMu = useMutation({
    mutationFn: (id: string) =>
      removeDissemination(token, id, userId, lineId),
    onSuccess: () => {
      setRemoveId(null);
      qc.invalidateQueries({ queryKey: ["dissemination", "outbox", roomId] });
    },
    onError: (e) => alert(surfaceErr(e)),
  });

  const cancelMu = useMutation({
    mutationFn: (b: { queueRoomId: string; reason?: string }) =>
      cancelDispatchedDissemination(token, {
        queueRoomId: b.queueRoomId,
        userId,
        reason: b.reason,
      }),
    onSuccess: (r) => {
      setCancelTarget(null);
      setCancelReason("");
      qc.invalidateQueries({ queryKey: ["dissemination", "outbox", roomId] });
      qc.invalidateQueries({ queryKey: ["dissemination", "inbox"] });
      alert(
        `Cancelled — ${r.recipientsNotified} signator${r.recipientsNotified === 1 ? "y" : "ies"}/recipient${r.recipientsNotified === 1 ? "" : "s"} notified.`,
      );
    },
    onError: (e) => alert(surfaceErr(e)),
  });

  return (
    <div className="w-full h-full flex flex-col">
      {/* Toolbar */}
      <div className="px-3 py-2 border-b bg-white flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by subject..."
            className="h-7 pl-7 text-xs"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-7 text-xs w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All status
            </SelectItem>
            <SelectItem value="draft" className="text-xs">
              Draft
            </SelectItem>
            <SelectItem value="active" className="text-xs">
              Active
            </SelectItem>
            <SelectItem value="completed" className="text-xs">
              Completed
            </SelectItem>
            <SelectItem value="cancelled" className="text-xs">
              Cancelled
            </SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={() => setOnOpen(1)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Initiate
          </Button>
        </div>
      </div>

      {/* DIAGNOSTIC: confirm the sender's room id matches what we expect */}
      <div className="px-3 py-1 border-b bg-amber-50/40 text-[10px] text-gray-500 font-mono">
        From room id: <span className="select-all">{roomId || "(missing)"}</span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto p-3">
        {isLoading ? (
          <div className="h-40 flex items-center justify-center text-xs text-gray-500">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...
          </div>
        ) : rows.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center">
            <Inbox className="h-6 w-6 text-gray-300 mb-2" />
            <div className="text-xs font-medium text-gray-700">
              No disseminations yet
            </div>
            <div className="text-[10px] text-gray-500">
              Click <span className="font-semibold">Initiate</span> to start a
              new dissemination.
            </div>
          </div>
        ) : (
          <div className="border rounded-lg bg-white overflow-hidden divide-y">
            {rows.map((r) => {
              const s = STATUS[r.status] ?? STATUS[0];
              const docs = r._count?.documents ?? 0;
              const sigs = r._count?.signatotyArrangement ?? 0;
              const tgts = r._count?.targetRooms ?? 0;
              return (
                <div
                  key={r.id}
                  className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-3"
                  onClick={() =>
                    r.status === 0
                      ? nav(`set-up/${r.id}`) // draft → continue wizard
                      : nav(`view/${r.id}`)   // dispatched/active/done → detail
                  }
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-900 truncate">
                        {r.title || "(no subject)"}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] h-5 px-1.5 ${s.cls}`}
                      >
                        {s.label}
                      </Badge>
                    </div>
                    <div className="mt-0.5 text-[10px] text-gray-500 flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Send className="h-3 w-3" />
                        {tgts} target{tgts === 1 ? "" : "s"}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {docs} doc{docs === 1 ? "" : "s"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {sigs} signator{sigs === 1 ? "y" : "ies"}
                      </span>
                      <span className="text-gray-400">
                        {new Date(r.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {r.status === 0 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRemoveId(r.id);
                      }}
                      title="Remove draft"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  ) : r.status === 1 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCancelTarget({
                          id: r.id,
                          title: r.title ?? "(no subject)",
                        });
                      }}
                      title="Cancel and notify signatories"
                    >
                      <Ban className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </div>
              );
            })}
            <div ref={ref} className="h-6 flex items-center justify-center">
              {isFetchingNextPage ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
              ) : null}
            </div>
          </div>
        )}
        {isFetching && !isLoading ? null : null}
      </div>

      {/* Initiate modal */}
      <Modal
        title="New Dissemination"
        onOpen={onOpen === 1}
        setOnOpen={() => setOnOpen(0)}
        onFunction={form.handleSubmit((d) => createMu.mutate(d))}
        footer={true}
        loading={createMu.isPending}
        yesTitle="Create"
        className=""
      >
        <Form {...form}>
          <FormField
            control={form.control}
            name="roomName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Subject</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter dissemination subject"
                    className="h-8 text-xs"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />
        </Form>
      </Modal>

      {/* Remove confirm */}
      <Modal
        title="Remove draft dissemination?"
        onOpen={!!removeId}
        setOnOpen={() => setRemoveId(null)}
        onFunction={() => removeId && removeMu.mutate(removeId)}
        footer={true}
        loading={removeMu.isPending}
        yesTitle="Remove"
        className=""
      >
        <p className="text-xs text-gray-600">
          This draft will be permanently deleted. Only drafts can be removed.
        </p>
      </Modal>

      {/* Cancel confirm — for dispatched (active) queues. Notifies every
          signatory and member of the targeted rooms. */}
      <Modal
        title="Cancel this dissemination?"
        onOpen={!!cancelTarget}
        setOnOpen={() => {
          setCancelTarget(null);
          setCancelReason("");
        }}
        onFunction={() =>
          cancelTarget &&
          cancelMu.mutate({
            queueRoomId: cancelTarget.id,
            reason: cancelReason.trim() || undefined,
          })
        }
        footer={true}
        loading={cancelMu.isPending}
        yesTitle="Cancel dissemination"
        className=""
      >
        <div className="space-y-2 text-xs text-gray-700">
          <div className="px-2 py-1.5 rounded border border-amber-200 bg-amber-50 text-[11px]">
            Cancelling{" "}
            <span className="font-semibold">
              "{cancelTarget?.title ?? ""}"
            </span>{" "}
            will:
            <ul className="list-disc pl-4 mt-1 space-y-0.5">
              <li>Mark the queue and all target rows as cancelled.</li>
              <li>
                Send a real-time notification to every signatory and member
                of each targeted room.
              </li>
              <li>
                Stop accepting new signatures — existing signatures stay
                on record for audit.
              </li>
            </ul>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase text-gray-600">
              Reason (optional, shown in the notification)
            </label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Wrong document attached"
              className="text-xs min-h-[60px]"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DisseminationOutbox;
