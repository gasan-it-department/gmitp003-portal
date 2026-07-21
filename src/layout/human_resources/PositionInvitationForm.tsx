import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import axios from "@/db/axios";
import {
  cancelPositionInvitation,
  listPositionInvitations,
  type PositionInvitationRow,
} from "@/db/statements/position";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import SlotSelection from "./SlotSelection";

import {
  AtSign,
  Send,
  X,
  UserPlus,
  MessageSquare,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  Hourglass,
  Trash2,
  Loader2,
  FileText,
  Zap,
} from "lucide-react";

import type {
  PositionInvitationProps,
  PositionSlotProps,
} from "@/interface/data";
import { PositionInvitationSchema } from "@/interface/zod";

interface Props {
  setOnOpen: React.Dispatch<React.SetStateAction<number>>;
  lineId: string;
  token: string;
  userId: string;
  unitPositionId: string;
  slots: PositionSlotProps[];
}

const surfaceErr = (err: unknown, fallback: string) =>
  isAxiosError(err)
    ? err.response?.data?.message ?? err.message
    : err instanceof Error
      ? err.message
      : fallback;

const statusBadgeCls = (status: string, isExpired: boolean) => {
  if (isExpired || status === "expired")
    return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "accepted")
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "cancelled")
    return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-blue-50 text-blue-700 border-blue-200"; // pending
};

const statusIcon = (status: string, isExpired: boolean) => {
  if (isExpired || status === "expired") return <Hourglass className="h-2.5 w-2.5" />;
  if (status === "accepted") return <CheckCircle2 className="h-2.5 w-2.5" />;
  if (status === "cancelled") return <XCircle className="h-2.5 w-2.5" />;
  return <Clock className="h-2.5 w-2.5" />;
};

const PositionInvitationForm = ({
  setOnOpen,
  token,
  lineId,
  userId,
  unitPositionId,
  slots,
}: Props) => {
  const queryClient = useQueryClient();
  // Invite flavor: "full" → candidate completes the full PDS · "quick" →
  // candidate fills only the essentials + photo.
  const [mode, setMode] = React.useState<"full" | "quick">("full");

  const form = useForm({
    resolver: zodResolver(PositionInvitationSchema),
    defaultValues: { mail: "", message: "", slot: "" },
  });
  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
    reset,
  } = form;

  // ── Live list of pending invitations for this position. Surfaces them
  //    inside the form so HR can see who's already been emailed before
  //    sending another invite.
  const invitations = useQuery({
    queryKey: ["position-invitations", unitPositionId, "active"],
    queryFn: () =>
      listPositionInvitations(token, {
        unitPositionId,
        status: "active",
      }),
    refetchOnWindowFocus: false,
  });

  // ── Submit (send invite) ──────────────────────────────────────────────
  const sendMut = useMutation({
    mutationFn: async (data: PositionInvitationProps) => {
      const res = await axios.post(
        "/position/fill-invite",
        {
          lineId,
          userId,
          unitPositionId,
          message: data.message,
          email: data.mail,
          slotId: data.slot,
          mode,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        },
      );
      if (res.status !== 200) throw new Error("Invitation failed");
      return res.data;
    },
    onSuccess: () => {
      toast.success("Invitation sent");
      reset();
      queryClient.invalidateQueries({
        queryKey: ["position-invitations", unitPositionId],
      });
      // The parent position list shows application/slot counts — keep
      // it fresh so the user sees the new pending invite reflected if
      // any badge depends on it.
      queryClient.invalidateQueries({
        queryKey: ["position-data"],
      });
    },
    onError: (err) =>
      toast.error("Couldn't send invitation", {
        description: surfaceErr(err, "Try again."),
      }),
  });

  // ── Cancel a previously-sent invitation ───────────────────────────────
  const cancelMut = useMutation({
    mutationFn: (id: string) =>
      cancelPositionInvitation(token, { id, userId, lineId }),
    onSuccess: () => {
      toast.success("Invitation cancelled");
      queryClient.invalidateQueries({
        queryKey: ["position-invitations", unitPositionId],
      });
    },
    onError: (err) =>
      toast.error("Couldn't cancel invitation", {
        description: surfaceErr(err, "Try again."),
      }),
  });

  const onSubmit = (data: PositionInvitationProps) => sendMut.mutateAsync(data);

  const openSlots = slots.filter((s) => !s.occupied);
  const noOpen = openSlots.length === 0;
  const pendingInvites = invitations.data ?? [];

  return (
    <div className="w-full max-w-2xl space-y-5">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <UserPlus className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Fill Position
            </h3>
            <p className="text-xs text-gray-500">
              Send an invitation email so a candidate can register against an
              open slot.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              noOpen
                ? "bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-2"
                : "bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-2"
            }
          >
            {openSlots.length} open
          </Badge>
          <Badge variant="outline" className="text-[10px] px-2">
            {slots.length} total
          </Badge>
        </div>
      </div>

      <Separator />

      {/* ── Invite type ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMode("full")}
          className={`text-left rounded-lg border p-3 transition ${
            mode === "full"
              ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-900">Full PDS</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 leading-snug">
            Candidate completes the full Personal Data Sheet (CS Form 212).
          </p>
        </button>
        <button
          type="button"
          onClick={() => setMode("quick")}
          className={`text-left rounded-lg border p-3 transition ${
            mode === "quick"
              ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold text-gray-900">
              Quick invite
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 leading-snug">
            Only the essentials — name, birthday, contact, address &amp; photo.
          </p>
        </button>
      </div>

      {/* ── Form ─────────────────────────────────────────────────────── */}
      <Form {...form}>
        <div className="space-y-4">
          {/* Slot */}
          <FormField
            control={control}
            name="slot"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-medium text-gray-900">
                    Slot
                  </FormLabel>
                  <span className="text-[10px] text-gray-500">Required</span>
                </div>
                <FormControl>
                  <SlotSelection
                    slots={slots}
                    onChange={field.onChange}
                    className="w-full"
                    value={field.value}
                    vacantOnly
                  />
                </FormControl>
                <FormDescription className="text-[11px]">
                  Only open slots are shown — occupied ones must be vacated
                  first.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={control}
            name="mail"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-medium text-gray-900">
                    Email
                  </FormLabel>
                  <span className="text-[10px] text-gray-500">Required</span>
                </div>
                <FormControl>
                  <InputGroup className="border rounded-md overflow-hidden">
                    <InputGroupAddon className="pl-3 bg-gray-50">
                      <AtSign className="h-4 w-4 text-gray-500" />
                    </InputGroupAddon>
                    <InputGroupInput
                      placeholder="candidate@example.com"
                      type="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      {...field}
                      className="pl-2 h-9 text-sm"
                    />
                  </InputGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Message */}
          <FormField
            control={control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-medium text-gray-900">
                    Personal message
                  </FormLabel>
                  <span className="text-[10px] text-gray-500">Optional</span>
                </div>
                <FormControl>
                  <div className="border rounded-md overflow-hidden">
                    <InputGroup className="border-0">
                      <InputGroupAddon className="pl-3 bg-gray-50 pt-2.5 self-start">
                        <MessageSquare className="h-4 w-4 text-gray-500" />
                      </InputGroupAddon>
                      <InputGroupTextarea
                        placeholder="Optional note to include with the invitation email…"
                        {...field}
                        className="min-h-[90px] pl-2 border-0 focus-visible:ring-0 text-sm"
                      />
                    </InputGroup>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator className="my-5" />

        {/* ── Actions ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOnOpen(0)}
            className="gap-2 h-9"
            disabled={sendMut.isPending}
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={sendMut.isPending || isSubmitting || noOpen}
            className="gap-2 h-9 bg-blue-600 hover:bg-blue-700"
            title={noOpen ? "No open slots to invite into" : "Send invitation"}
          >
            {sendMut.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Invitation
              </>
            )}
          </Button>
        </div>
      </Form>

      {/* ── Pending invitations (live) ───────────────────────────────── */}
      <div className="space-y-2 pt-2 border-t">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
            Active invitations
          </p>
          <Badge variant="outline" className="text-[10px] px-2">
            {pendingInvites.length}
          </Badge>
        </div>

        {invitations.isLoading ? (
          <div className="flex items-center gap-2 text-[11px] text-gray-500 px-1 py-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading invitations…
          </div>
        ) : pendingInvites.length === 0 ? (
          <p className="text-[11px] text-gray-500 px-1 py-2">
            No active invitations for this position.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {pendingInvites.map((inv) => (
              <InvitationRow
                key={inv.id}
                inv={inv}
                slotNumber={slotNumberFor(inv, slots)}
                onCancel={() => cancelMut.mutate(inv.id)}
                cancelling={cancelMut.isPending && cancelMut.variables === inv.id}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const slotNumberFor = (
  inv: PositionInvitationRow,
  allSlots: PositionSlotProps[],
) => {
  if (!inv.positionSlotId) return null;
  const idx = allSlots.findIndex((s) => s.id === inv.positionSlotId);
  return idx >= 0 ? idx + 1 : null;
};

interface InvitationRowProps {
  inv: PositionInvitationRow;
  slotNumber: number | null;
  onCancel: () => void;
  cancelling: boolean;
}

const InvitationRow = ({
  inv,
  slotNumber,
  onCancel,
  cancelling,
}: InvitationRowProps) => {
  const expiresLabel = inv.expiresAt
    ? new Date(inv.expiresAt).toLocaleDateString()
    : "—";

  return (
    <li className="flex items-center gap-2 border rounded-md px-2.5 py-1.5 bg-white">
      <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-900 truncate">
          {inv.email}
        </p>
        <p className="text-[10px] text-gray-500 truncate">
          Slot #{slotNumber ?? "?"} · expires {expiresLabel}
        </p>
      </div>
      <Badge
        variant="outline"
        className={`text-[10px] px-1.5 py-0 gap-1 ${statusBadgeCls(inv.status, inv.isExpired)}`}
      >
        {statusIcon(inv.status, inv.isExpired)}
        {inv.isExpired ? "expired" : inv.status}
      </Badge>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0 text-rose-600 hover:bg-rose-50"
        onClick={onCancel}
        disabled={cancelling}
        title="Cancel invitation"
      >
        {cancelling ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Trash2 className="h-3 w-3" />
        )}
      </Button>
    </li>
  );
};

export default PositionInvitationForm;
