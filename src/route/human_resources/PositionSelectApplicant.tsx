import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";
import { isAxiosError } from "axios";

import { useAuth } from "@/provider/ProtectedRoute";
import { lineApplications } from "@/db/statement";
import {
  inviteFromApplication,
  positionRecords,
} from "@/db/statements/position";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import Modal from "@/components/custom/Modal";
import SlotSelection from "@/layout/human_resources/SlotSelection";

import {
  ArrowLeft,
  Briefcase,
  Building,
  Loader2,
  Mail,
  MessageSquare,
  Search,
  Send,
  UserPlus,
  Users,
} from "lucide-react";

import type {
  SubmittedApplicationProps,
  PositionSlotProps,
} from "@/interface/data";

interface ListProps {
  list: SubmittedApplicationProps[];
  hasMore: boolean;
  lastCursor: string | null;
}

interface PositionDetailLike {
  id: string;
  position?: { name?: string | null } | null;
  unit?: { name?: string | null } | null;
  line?: { id?: string; name?: string | null } | null;
  slot?: PositionSlotProps[];
  designation?: string | null;
}

const surfaceErr = (err: unknown, fallback: string) =>
  isAxiosError(err)
    ? err.response?.data?.message ?? err.message
    : err instanceof Error
      ? err.message
      : fallback;

/**
 * Pick an existing SubmittedApplication and invite that candidate into
 * one of the position's vacant slots. The selected applicant gets the
 * same registration email as the Fill Position flow, only the recipient
 * is resolved from the application's encrypted email instead of typed
 * in by HR.
 *
 * Route: /:lineId/human-resources/units/:officeID/position/:positionId/select-applicant
 */
const PositionSelectApplicant = () => {
  const { positionId, officeID, lineId: routeLineId } = useParams();
  const nav = useNavigate();
  const auth = useAuth();
  const queryClient = useQueryClient();

  const [text, setText] = useState("");
  const [query] = useDebounce(text, 600);

  const [picked, setPicked] = useState<SubmittedApplicationProps | null>(null);
  const [slotId, setSlotId] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  // Provisional hire: when arriving from the Provisional module (?provisional=1)
  // the invite also carries an employment type + contract end date, so the
  // registered user becomes temp/contract instead of regular plantilla.
  const [searchParams] = useSearchParams();
  const isProvisional = searchParams.get("provisional") === "1";
  const [empType, setEmpType] = useState("Contract");
  const [term, setTerm] = useState("");

  // Position context so we know which slots are open + display a clear
  // header — same data the PositionDetail page consumes.
  const position = useQuery<PositionDetailLike>({
    queryKey: ["position-data", positionId],
    queryFn: () => positionRecords(auth.token as string, positionId as string),
    enabled: !!positionId && !!auth.token,
    refetchOnWindowFocus: false,
  });

  const effectiveLineId =
    position.data?.line?.id ?? routeLineId ?? (auth as any).lineId ?? "";

  const slots = position.data?.slot ?? [];
  const openSlots = useMemo(
    () => slots.filter((s) => !s.occupied),
    [slots],
  );

  // Pool of line-wide applications. Filters: search + position (we leave
  // positionId unset so HR can also redirect applications submitted
  // against other positions).
  const apps = useInfiniteQuery<ListProps>({
    queryKey: [
      "applications-pool-for-slot",
      effectiveLineId,
      query,
    ],
    queryFn: ({ pageParam }) =>
      lineApplications(
        auth.token as string,
        effectiveLineId,
        pageParam as string | null,
        "20",
        query,
        [],
        undefined,
        undefined,
        undefined,
        // Server-side strip already-invited / already-registered rows.
        true,
      ),
    initialPageParam: null,
    getNextPageParam: (last) => (last.hasMore ? last.lastCursor : undefined),
    enabled: !!effectiveLineId && !!auth.token,
    refetchOnWindowFocus: false,
  });
  const { ref } = useInView({
    threshold: 0.5,
    onChange: (inView) => {
      if (
        inView &&
        apps.hasNextPage &&
        !apps.isFetching &&
        !apps.isFetchingNextPage
      ) {
        apps.fetchNextPage();
      }
    },
  });
  const items = apps.data?.pages.flatMap((p) => p.list) ?? [];

  // ── Invite mutation ──────────────────────────────────────────────────
  const sendMut = useMutation({
    mutationFn: () => {
      if (!picked || !slotId || !auth.userId || !effectiveLineId || !positionId) {
        throw new Error("Pick an application and a slot first.");
      }
      return inviteFromApplication(auth.token as string, {
        applicationId: picked.id,
        slotId,
        unitPositionId: positionId,
        userId: auth.userId,
        lineId: effectiveLineId,
        message: message.trim() || null,
        empType: isProvisional ? empType : undefined,
        term: isProvisional && term ? term : undefined,
      });
    },
    onSuccess: (data) => {
      toast.success("Invitation sent", {
        description: `Sent to ${data.invitation.applicantName} (${data.invitation.email})`,
      });
      queryClient.invalidateQueries({
        queryKey: ["position-invitations", positionId],
      });
      queryClient.invalidateQueries({ queryKey: ["position-data", positionId] });
      setPicked(null);
      setMessage("");
      // Navigate back to the position detail so the user can see the
      // invitation reflected in the Applications / History tabs.
      if (officeID && positionId) {
        nav(`/${effectiveLineId}/human-resources/units/${officeID}/position/${positionId}`);
      } else {
        nav(-1);
      }
    },
    onError: (err) =>
      toast.error("Couldn't send invitation", {
        description: surfaceErr(err, "Try again."),
      }),
  });

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex-none bg-white border-b px-4 py-3 flex items-center gap-3 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5"
          onClick={() => nav(-1)}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="text-xs">Back</span>
        </Button>

        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-semibold text-gray-900 truncate">
            Select an applicant
          </h1>
          <p className="text-[11px] text-gray-500 truncate flex items-center gap-1">
            <Briefcase className="h-2.5 w-2.5" />
            {position.data?.position?.name ?? "Position"}
            {position.data?.unit?.name ? (
              <>
                <span className="text-gray-300">·</span>
                <Building className="h-2.5 w-2.5" />
                {position.data.unit.name}
              </>
            ) : null}
          </p>
        </div>

        <Badge
          variant="outline"
          className={
            openSlots.length === 0
              ? "bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-2"
              : "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-2"
          }
        >
          <Users className="h-2.5 w-2.5 mr-1" />
          {openSlots.length} open / {slots.length} total
        </Badge>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b px-4 py-2 flex items-center gap-2 flex-wrap">
        <InputGroup className="bg-white flex-1 min-w-[200px] max-w-md">
          <InputGroupAddon>
            <Search className="h-3 w-3 text-gray-400" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search applicant name or email..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-7 text-[11px]"
          />
        </InputGroup>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {items.length} loaded
        </Badge>
        {/* Hint: clarify that the picker hides already-handled rows. */}
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200"
          title="Already-registered, already-accepted, and currently-invited applicants are hidden from this list."
        >
          Eligible only
        </Badge>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto p-3">
        <div className="border rounded-lg bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-10 text-[10px] font-semibold text-gray-700">
                  No
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[180px]">
                  Applicant
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[160px]">
                  Filed for
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 w-28">
                  Date
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 w-24 text-center">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apps.isFetching && items.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5} className="py-2">
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <p className="text-xs font-medium text-gray-700">
                      No eligible applicants
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">
                      {query
                        ? "Try a different search term."
                        : "Everyone here has already been invited, accepted, or registered."}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((it, i) => (
                  <TableRow
                    key={it.id}
                    className="hover:bg-blue-50/40 cursor-pointer"
                    onClick={() => setPicked(it)}
                  >
                    <TableCell className="text-[10px] text-gray-500">
                      {i + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-blue-50 flex-shrink-0">
                          <UserPlus className="h-3 w-3 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {it.firstname} {it.lastname}
                          </p>
                          <p className="text-[10px] text-gray-500 truncate flex items-center gap-1">
                            <Mail className="h-2.5 w-2.5" />
                            {/* email is encrypted client-side, so we just
                                 show a placeholder hint here */}
                            email on file
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[11px] text-gray-700 truncate">
                        {(it as any).forPosition?.name ??
                          (it as any).positionName ??
                          "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[11px] text-gray-500">
                        {it.timestamp
                          ? new Date(it.timestamp).toLocaleDateString()
                          : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        className="h-6 text-[10px] gap-1 bg-blue-600 hover:bg-blue-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPicked(it);
                        }}
                      >
                        <Send className="h-3 w-3" />
                        Pick
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {apps.hasNextPage && (
                <TableRow ref={ref}>
                  <TableCell colSpan={5} className="text-center py-2">
                    {apps.isFetchingNextPage ? (
                      <div className="inline-flex items-center gap-1.5 text-gray-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-[10px]">Loading…</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400">
                        Scroll to load more
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Confirm modal ───────────────────────────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-1.5 text-xs">
            <Send className="h-3 w-3 text-blue-500" />
            Send invitation
          </div>
        }
        onOpen={!!picked}
        className="max-w-lg"
        setOnOpen={() => {
          if (!sendMut.isPending) setPicked(null);
        }}
        footer={true}
        yesTitle={sendMut.isPending ? "Sending…" : "Send invitation"}
        cancelTitle="Cancel"
        loading={sendMut.isPending}
        onFunction={() => sendMut.mutateAsync()}
      >
        {picked ? (
          <div className="space-y-3">
            <div className="border rounded-md p-3 bg-blue-50/40 border-blue-100">
              <p className="text-xs font-semibold text-gray-900">
                {picked.firstname} {picked.lastname}
              </p>
              <p className="text-[11px] text-gray-600 mt-0.5">
                Application filed{" "}
                {picked.timestamp
                  ? new Date(picked.timestamp).toLocaleDateString()
                  : "—"}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-700">
                Slot *
              </label>
              <SlotSelection
                slots={slots}
                onChange={setSlotId}
                value={slotId}
                vacantOnly
                className="w-full"
              />
              <p className="text-[10px] text-gray-500">
                Only open slots are shown.
              </p>
            </div>

            {isProvisional && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-700">
                    Employment type *
                  </label>
                  <select
                    value={empType}
                    onChange={(e) => setEmpType(e.target.value)}
                    className="w-full h-8 text-xs border rounded-md px-2 bg-white"
                  >
                    <option value="Contract">Contract</option>
                    <option value="Casual">Casual</option>
                    <option value="Job Order">Job Order</option>
                    <option value="Temporary">Temporary</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-700">
                    Contract end date
                  </label>
                  <input
                    type="date"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="w-full h-8 text-xs border rounded-md px-2 bg-white"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-gray-700">
                Personal message (optional)
              </label>
              <InputGroup className="border rounded-md overflow-hidden">
                <InputGroupAddon className="pl-3 bg-gray-50 pt-2.5 self-start">
                  <MessageSquare className="h-3.5 w-3.5 text-gray-500" />
                </InputGroupAddon>
                <InputGroupTextarea
                  placeholder="Optional note included in the invitation email…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[80px] pl-2 border-0 focus-visible:ring-0 text-xs"
                />
              </InputGroup>
            </div>

            <div className="text-[10px] text-gray-500">
              The applicant's email is read from their submitted application
              (encrypted on disk) and used as the invitation recipient.
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default PositionSelectApplicant;
