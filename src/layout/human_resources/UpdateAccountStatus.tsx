import { type Dispatch, type SetStateAction, useMemo } from "react";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { vacantPosition } from "@/db/statements/position";
//
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import Modal from "@/components/custom/Modal";
import { ArrowRight, Minus, AlertCircle, UserX } from "lucide-react";

import type { PositionSlotProps } from "@/interface/data";

const VacateSchema = z.object({
  slotId: z.string().min(1, "Select an occupied slot"),
  action: z.string().min(1, "Action is required"),
});
type VacateValues = z.infer<typeof VacateSchema>;

interface Props {
  /** True when there are NO occupied slots — i.e. nothing to vacate. */
  isAvailable: boolean;
  isOpen: number;
  setOnOpen: Dispatch<SetStateAction<number>>;
  token: string;
  /** Department/unit id used for cache invalidation. */
  departmentId: string;
  lineId: string;
  userId: string;
  /** All slots of this UnitPosition (occupied ones are selectable). */
  slots: PositionSlotProps[];
}

const surfaceErr = (err: unknown, fallback: string) =>
  isAxiosError(err)
    ? (err.response?.data?.message ?? err.message)
    : err instanceof Error
      ? err.message
      : fallback;

const UpdateAccountStatus = ({
  isOpen,
  isAvailable,
  setOnOpen,
  token,
  departmentId,
  lineId,
  userId,
  slots,
}: Props) => {
  const queryClient = useQueryClient();

  // Is this slot occupied by the *current* HR officer? They can't vacate
  // their own seat (that would strip their own position / lock them out) —
  // only another administrator may do it.
  const isSelf = (slot: PositionSlotProps) =>
    (slot.user?.id ?? slot.userId ?? null) === userId;

  // Occupied slots are the only ones we can vacate. Pair each with its
  // stable 1-based index so the dropdown reads "Slot #2 — Jane Doe".
  const occupiedSlots = useMemo(
    () =>
      slots
        .map((slot, i) => ({ slot, number: i + 1 }))
        .filter((p) => p.slot.occupied),
    [slots],
  );

  // Slots someone *else* occupies — the only ones this user may vacate.
  const vacatableSlots = useMemo(
    () => occupiedSlots.filter((p) => !isSelf(p.slot)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [occupiedSlots, userId],
  );

  // True when the position has occupants but every one of them is the
  // current user — i.e. there is nothing they're allowed to vacate.
  const onlySelfOccupies =
    occupiedSlots.length > 0 && vacatableSlots.length === 0;

  const form = useForm<VacateValues>({
    resolver: zodResolver(VacateSchema),
    defaultValues: {
      slotId: vacatableSlots.length === 1 ? vacatableSlots[0].slot.id : "",
      action: "0",
    },
  });
  const {
    handleSubmit,
    control,
    watch,
    formState: { errors },
    setError,
    reset,
  } = form;

  const action = watch("action");

  const vacateMut = useMutation({
    mutationFn: (data: VacateValues) =>
      vacantPosition(token, {
        slotId: data.slotId,
        lineId,
        userId,
        action: Number(data.action),
      }),
    onSuccess: () => {
      toast.success(
        action === "1" ? "Slot vacated & access disabled" : "Slot vacated",
      );
      queryClient.invalidateQueries({
        queryKey: ["postions", departmentId],
        refetchType: "active",
      });
      reset();
      setOnOpen(0);
    },
    onError: (err) =>
      setError("root", { message: surfaceErr(err, "Failed to vacate slot") }),
  });

  const onSubmit = (data: VacateValues) => {
    // Defensive client-side mirror of the backend guard: never let the
    // officer vacate their own seat.
    const chosen = occupiedSlots.find((p) => p.slot.id === data.slotId);
    if (chosen && isSelf(chosen.slot)) {
      setError("slotId", {
        message:
          "You can't vacate your own seat. Ask another administrator to do this for you.",
      });
      return;
    }
    return vacateMut.mutateAsync(data);
  };

  const handleClose = () => {
    if (vacateMut.isPending) return;
    reset();
    setOnOpen(0);
  };

  const occupantName = (slot: PositionSlotProps) => {
    const n = [slot.user?.firstName, slot.user?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    return n || "Occupied";
  };

  return (
    <>
      {/* Vacant Position trigger */}
      <Button
        variant="outline"
        size="sm"
        className="w-full h-7 justify-start gap-1.5 text-[11px] hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-colors"
        disabled={isAvailable}
        onClick={() => setOnOpen(3)}
        title={
          isAvailable
            ? "No occupied slots to vacate"
            : "Vacate an occupied slot"
        }
      >
        <Minus className="h-3 w-3" />
        <span>Vacant Position</span>
        <ArrowRight className="h-2.5 w-2.5 ml-auto" />
      </Button>

      {/* Vacant Position modal */}
      <Modal
        title={undefined}
        onFunction={handleSubmit(onSubmit)}
        children={
          <div className="space-y-5 p-1">
            {/* Header */}
            <div className="flex items-center gap-3 pb-3 border-b">
              <div className="p-2 bg-amber-100 rounded-lg">
                <UserX className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  Vacate Position Slot
                </h3>
                <p className="text-xs text-gray-500">
                  Free up an occupied slot and choose what happens to the
                  occupant.
                </p>
              </div>
            </div>

            <Form {...form}>
              <div className="space-y-4">
                {errors.root && (
                  <div className="p-2 rounded-md bg-red-50 border border-red-200">
                    <p className="text-xs text-red-600 text-center">
                      {errors.root.message}
                    </p>
                  </div>
                )}

                {/* Nothing this user is allowed to vacate (they're the
                    sole occupant). Explain why instead of a dead form. */}
                {onlySelfOccupies && (
                  <div className="p-2.5 rounded-md bg-blue-50 border border-blue-200">
                    <p className="text-xs text-blue-700 text-center">
                      You're the only occupant of this position. You can't
                      vacate your own seat — another administrator must do this
                      for you.
                    </p>
                  </div>
                )}

                {/* Occupied slot picker */}
                <FormField
                  control={control}
                  name="slotId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">
                        Occupied slot *
                      </FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Select the slot to vacate" />
                          </SelectTrigger>
                          <SelectContent>
                            {occupiedSlots.length === 0 ? (
                              <div className="px-3 py-4 text-center text-xs text-gray-500">
                                No occupied slots.
                              </div>
                            ) : (
                              occupiedSlots.map(({ slot, number }) => {
                                const self = isSelf(slot);
                                return (
                                  <SelectItem
                                    key={slot.id}
                                    value={slot.id}
                                    disabled={self}
                                    className="text-sm cursor-pointer"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] px-1.5 py-0"
                                      >
                                        Slot #{number}
                                      </Badge>
                                      <span>{occupantName(slot)}</span>
                                      {self && (
                                        <span className="text-[10px] text-gray-400">
                                          (You — another admin must do this)
                                        </span>
                                      )}
                                    </div>
                                  </SelectItem>
                                );
                              })
                            )}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Action */}
                <FormField
                  control={control}
                  name="action"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">
                        Action *
                      </FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Select an action" />
                          </SelectTrigger>
                          <SelectContent>
                            {["Remove from position", "Disable Access"].map(
                              (item, i) => (
                                <SelectItem
                                  key={i}
                                  value={i.toString()}
                                  className="text-sm cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        i === 0 ? "bg-amber-500" : "bg-red-500"
                                      }`}
                                    />
                                    {item}
                                  </div>
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500 mt-1.5">
                        {field.value === "1"
                          ? "Slot is freed AND the occupant's account is suspended (they can't sign in). Their data is retained."
                          : "Slot is freed and the occupant is unassigned from the position. Their account stays active."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Form>

            {/* Notice */}
            <div className="rounded-md bg-amber-50 p-3 border border-amber-200">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-amber-800 mb-0.5">
                    Important
                  </p>
                  <p className="text-xs text-amber-700">
                    This affects the current occupant and is logged. The user
                    will be notified.
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
        onOpen={isOpen === 3}
        className="max-w-md"
        setOnOpen={handleClose}
        footer={true}
        yesTitle={action === "1" ? "Vacate & disable" : "Vacate slot"}
        loading={vacateMut.isPending}
      />
    </>
  );
};

export default UpdateAccountStatus;
