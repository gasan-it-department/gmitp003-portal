import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/db/axios";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Modal from "@/components/custom/Modal";
import {
  Form,
  FormControl,
  FormItem,
  FormMessage,
  FormLabel,
  FormField,
  FormDescription,
} from "@/components/ui/form";

import SearchUnit from "../SearchUnit";
import SearchUser from "../SearchUser";
import {
  Edit2,
  AlertTriangle,
  Pencil,
  ArrowRightLeft,
  User as UserIcon,
  Building2,
} from "lucide-react";

import type {
  SupplyDispenseRecordProps,
  UpdateTransactionProps,
} from "@/interface/data";
import { UpdateTransactionSchema } from "@/interface/zod";

interface Props {
  item: SupplyDispenseRecordProps;
  userId: string;
  token: string;
  lineId: string;
  onSuccess?: () => void;
}

type Mode = "adjust" | "transfer";

const UpdateTransaction = ({
  item,
  userId,
  token,
  lineId,
  onSuccess,
}: Props) => {
  const [onOpen, setOnOpen] = useState(0);
  const [mode, setMode] = useState<Mode>("adjust");

  // ── Adjust-mode form (existing fields) ──────────────────────────────
  const form = useForm<UpdateTransactionProps>({
    resolver: zodResolver(UpdateTransactionSchema),
    defaultValues: {
      unitId: item.departmentId || "",
      userId: item.userId || "",
      quantity: item.quantity ?? "0",
      toAccount: !!(item.departmentId || item.userId),
      forUnit: !!item.departmentId,
      address: item.departmentId ? "unit" : "user",
    },
  });

  const {
    formState: { isSubmitting: isAdjusting, errors },
    handleSubmit,
    setError,
    control,
    watch,
    reset,
  } = form;

  useEffect(() => {
    reset({
      unitId: item.departmentId || "",
      userId: item.userId || "",
      quantity: item.quantity ?? "0",
      toAccount: !!(item.departmentId || item.userId),
      forUnit: !!item.departmentId,
      address: item.departmentId ? "unit" : "user",
    });
  }, [item.id, item.quantity, item.userId, item.departmentId, reset]);

  const toAccount = watch("toAccount");
  const address = watch("address");
  const currentQty = parseInt(item.quantity || "0", 10);

  // ── Transfer-mode local state ───────────────────────────────────────
  const [transferQty, setTransferQty] = useState<string>("1");
  const [transferAddress, setTransferAddress] = useState<"user" | "unit">(
    "user",
  );
  const [transferUserId, setTransferUserId] = useState<string>("");
  const [transferUnitId, setTransferUnitId] = useState<string>("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  // Reset transfer fields whenever the modal opens fresh
  useEffect(() => {
    if (onOpen !== 1) return;
    setMode("adjust");
    setTransferQty("1");
    setTransferAddress("user");
    setTransferUserId("");
    setTransferUnitId("");
    setTransferError(null);
  }, [onOpen, item.id]);

  // ── Adjust submit ───────────────────────────────────────────────────
  const onAdjustSubmit = async (data: UpdateTransactionProps) => {
    try {
      const payload: any = { id: item.id, currUserId: userId, mode: "adjust" };

      if (data.toAccount) {
        if (data.address === "unit") {
          if (!data.unitId) throw new Error("Select a unit for the recipient.");
          if (data.unitId !== item.departmentId) payload.unitId = data.unitId;
        } else {
          if (!data.userId) throw new Error("Select a user for the recipient.");
          if (data.userId !== item.userId) payload.userId = data.userId;
        }
      } else {
        if (item.userId) payload.userId = null;
        if (item.departmentId) payload.unitId = null;
      }

      if (data.quantity && data.quantity !== item.quantity) {
        const n = parseInt(data.quantity, 10);
        if (isNaN(n) || n < 0)
          throw new Error("Quantity must be a non-negative number.");
        payload.quantity = data.quantity;
      }

      const diffKeys = Object.keys(payload).filter(
        (k) => k !== "id" && k !== "currUserId" && k !== "mode",
      );
      if (diffKeys.length === 0) throw new Error("Nothing to update.");

      const response = await axios.patch(
        "/supply/transaction/update",
        payload,
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

      if (response.status !== 200) {
        throw new Error(response.data?.message ?? "Failed to update.");
      }

      toast.success("Transaction adjustment recorded");
      onSuccess?.();
      setOnOpen(0);
    } catch (err: any) {
      const apiMsg = err?.response?.data?.message;
      const msg = apiMsg || err.message || "Failed to update.";
      setError("root", { message: msg });
      toast.error(msg);
    }
  };

  // ── Transfer submit ─────────────────────────────────────────────────
  const onTransferSubmit = async () => {
    setTransferError(null);
    const qty = parseInt(transferQty, 10);
    if (Number.isNaN(qty) || qty <= 0) {
      setTransferError("Transfer quantity must be greater than 0.");
      return;
    }
    if (qty > currentQty) {
      setTransferError(
        `Cannot transfer ${qty} units — original transaction only has ${currentQty}.`,
      );
      return;
    }

    if (transferAddress === "user" && !transferUserId) {
      setTransferError("Select a destination user.");
      return;
    }
    if (transferAddress === "unit" && !transferUnitId) {
      setTransferError("Select a destination unit.");
      return;
    }

    // Don't transfer back to the same recipient
    if (
      (transferAddress === "user" && transferUserId === item.userId) ||
      (transferAddress === "unit" && transferUnitId === item.departmentId)
    ) {
      setTransferError(
        "Destination must be different from the original recipient.",
      );
      return;
    }

    setIsTransferring(true);
    try {
      const response = await axios.patch(
        "/supply/transaction/update",
        {
          id: item.id,
          currUserId: userId,
          mode: "transfer",
          transferQuantity: String(qty),
          toUserId: transferAddress === "user" ? transferUserId : null,
          toUnitId: transferAddress === "unit" ? transferUnitId : null,
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

      if (response.status !== 200) {
        throw new Error(response.data?.message ?? "Failed to transfer.");
      }

      toast.success(`Transferred ${qty} unit${qty === 1 ? "" : "s"}`);
      onSuccess?.();
      setOnOpen(0);
    } catch (err: any) {
      const apiMsg = err?.response?.data?.message;
      const msg = apiMsg || err.message || "Failed to transfer.";
      setTransferError(msg);
      toast.error(msg);
    } finally {
      setIsTransferring(false);
    }
  };

  const isBusy = isAdjusting || isTransferring;
  const remainingAfterTransfer = Math.max(
    0,
    currentQty - (parseInt(transferQty, 10) || 0),
  );

  return (
    <>
      <Button
        onClick={() => setOnOpen(1)}
        size="sm"
        className="h-7 text-xs gap-1.5"
      >
        <Edit2 className="h-3 w-3" />
        Edit
      </Button>

      <Modal
        // Adjust mode uses Modal's footer; transfer has its own
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded-md">
              <Edit2 className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Edit Transaction</h3>
              <p className="text-[10px] text-gray-500">
                Saving creates a new transaction; the original is preserved
              </p>
            </div>
          </div>
        }
        onOpen={onOpen === 1}
        className="max-w-md w-[95vw] max-h-[98vh] overflow-auto"
        setOnOpen={() => {
          if (isBusy) return;
          setOnOpen(0);
        }}
        footer={1}
      >
        <div className="p-1 space-y-3">
          {/* Mode tabs */}
          <div className="grid grid-cols-2 gap-1 p-0.5 bg-gray-100 rounded-md">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => setMode("adjust")}
              className={`flex items-center justify-center gap-1.5 h-7 text-[10px] rounded transition-colors ${
                mode === "adjust"
                  ? "bg-white text-blue-600 font-medium shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Pencil className="h-3 w-3" />
              Adjust
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => setMode("transfer")}
              className={`flex items-center justify-center gap-1.5 h-7 text-[10px] rounded transition-colors ${
                mode === "transfer"
                  ? "bg-white text-blue-600 font-medium shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <ArrowRightLeft className="h-3 w-3" />
              Transfer
            </button>
          </div>

          {/* ────── ADJUST MODE ────── */}
          {mode === "adjust" && (
            <Form {...form}>
              <div className="space-y-3">
                <FormField
                  control={control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-semibold text-gray-700">
                        Quantity{" "}
                        <span className="font-normal text-gray-400">
                          (current: {currentQty})
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          className="h-8 text-xs"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-[10px] text-gray-500">
                        Increasing this deducts from stock; decreasing returns
                        the difference back to stock.
                      </FormDescription>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  name="toAccount"
                  control={control}
                  render={({ field: { value, onBlur, onChange } }) => (
                    <FormItem className="flex flex-row items-start gap-2 p-2 bg-gray-50 rounded-md">
                      <FormControl>
                        <Checkbox
                          id="toAccount"
                          onBlur={onBlur}
                          checked={value}
                          onCheckedChange={onChange}
                          className="h-3.5 w-3.5 mt-0.5"
                        />
                      </FormControl>
                      <div className="leading-tight">
                        <FormLabel className="text-xs font-medium cursor-pointer">
                          Assigned to recipient
                        </FormLabel>
                        <p className="text-[10px] text-gray-500">
                          Unchecking clears the linked user / unit
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {toAccount && (
                  <div className="space-y-2 pl-2 border-l-2 border-blue-200">
                    <FormField
                      control={control}
                      name="address"
                      render={({ field: { onBlur, onChange, value } }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-[10px] font-semibold text-gray-700">
                            Recipient Type
                          </FormLabel>
                          <FormControl>
                            <RadioGroup
                              className="flex gap-3"
                              onValueChange={onChange}
                              onBlur={onBlur}
                              value={value || "user"}
                            >
                              <div className="flex items-center gap-1.5 cursor-pointer">
                                <RadioGroupItem value="user" id="adj-user" />
                                <FormLabel
                                  htmlFor="adj-user"
                                  className="text-xs cursor-pointer flex items-center gap-1"
                                >
                                  <UserIcon className="h-2.5 w-2.5" />
                                  User
                                </FormLabel>
                              </div>
                              <div className="flex items-center gap-1.5 cursor-pointer">
                                <RadioGroupItem value="unit" id="adj-unit" />
                                <FormLabel
                                  htmlFor="adj-unit"
                                  className="text-xs cursor-pointer flex items-center gap-1"
                                >
                                  <Building2 className="h-2.5 w-2.5" />
                                  Unit
                                </FormLabel>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />

                    {address === "user" ? (
                      <FormField
                        control={control}
                        name="userId"
                        render={({ field: { onChange, value } }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-semibold text-gray-700">
                              Select User
                            </FormLabel>
                            <FormControl>
                              <SearchUser
                                lineId={lineId}
                                token={token}
                                onChange={onChange}
                                value={value ?? ""}
                              />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <FormField
                        control={control}
                        name="unitId"
                        render={({ field: { onChange, value } }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-semibold text-gray-700">
                              Select Unit
                            </FormLabel>
                            <FormControl>
                              <SearchUnit
                                lineId={lineId}
                                token={token}
                                onChange={onChange}
                                value={value ?? ""}
                              />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}

                {errors.root?.message && (
                  <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-100 rounded">
                    <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-[10px] text-red-700">
                      {errors.root.message}
                    </p>
                  </div>
                )}

                <div className="p-2 bg-blue-50 border border-blue-100 rounded text-[10px] text-blue-700">
                  <strong>Note:</strong> Saving creates a <em>new</em> audit
                  transaction. The original transaction is preserved unchanged.
                </div>

                {/* Adjust-mode footer (Modal's footer is hidden via footer={1}) */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={isAdjusting}
                    onClick={() => setOnOpen(0)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700"
                    disabled={isAdjusting}
                    onClick={handleSubmit(onAdjustSubmit)}
                  >
                    {isAdjusting ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </Form>
          )}

          {/* ────── TRANSFER MODE ────── */}
          {mode === "transfer" && (
            <div className="space-y-3">
              {/* Summary card */}
              <div className="border rounded-lg bg-gray-50 p-2.5 space-y-1.5">
                <p className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                  Transfer Summary
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-gray-500">Original</p>
                    <p className="text-xs font-semibold text-gray-900">
                      {currentQty}
                    </p>
                  </div>
                  <div className="border-x">
                    <p className="text-[10px] text-amber-600">Remains</p>
                    <p className="text-xs font-semibold text-amber-700">
                      {remainingAfterTransfer}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-blue-600">Transferred</p>
                    <p className="text-xs font-semibold text-blue-700">
                      {parseInt(transferQty, 10) || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Transfer quantity */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-700">
                  Quantity to Transfer *
                </label>
                <Input
                  type="number"
                  min={1}
                  max={currentQty}
                  value={transferQty}
                  onChange={(e) => setTransferQty(e.target.value)}
                  className="h-8 text-xs"
                />
                <p className="text-[10px] text-gray-500">
                  Up to {currentQty} unit{currentQty === 1 ? "" : "s"} available
                </p>
              </div>

              {/* Destination type */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-700">
                  Destination Type
                </label>
                <RadioGroup
                  className="flex gap-3"
                  value={transferAddress}
                  onValueChange={(v) =>
                    setTransferAddress(v as "user" | "unit")
                  }
                >
                  <div className="flex items-center gap-1.5 cursor-pointer">
                    <RadioGroupItem value="user" id="trans-user" />
                    <label
                      htmlFor="trans-user"
                      className="text-xs cursor-pointer flex items-center gap-1"
                    >
                      <UserIcon className="h-2.5 w-2.5" />
                      User
                    </label>
                  </div>
                  <div className="flex items-center gap-1.5 cursor-pointer">
                    <RadioGroupItem value="unit" id="trans-unit" />
                    <label
                      htmlFor="trans-unit"
                      className="text-xs cursor-pointer flex items-center gap-1"
                    >
                      <Building2 className="h-2.5 w-2.5" />
                      Unit
                    </label>
                  </div>
                </RadioGroup>
              </div>

              {/* Destination picker */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-700">
                  Select Destination *
                </label>
                {transferAddress === "user" ? (
                  <SearchUser
                    lineId={lineId}
                    token={token}
                    onChange={setTransferUserId}
                    value={transferUserId}
                  />
                ) : (
                  <SearchUnit
                    lineId={lineId}
                    token={token}
                    onChange={setTransferUnitId}
                    value={transferUnitId}
                  />
                )}
              </div>

              {transferError && (
                <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-100 rounded">
                  <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-red-700">{transferError}</p>
                </div>
              )}

              <div className="p-2 bg-blue-50 border border-blue-100 rounded text-[10px] text-blue-700">
                <strong>Note:</strong> Two new audit transactions will be
                created — one deducting from the original recipient, and one
                receiving by the new recipient. The original transaction is
                preserved unchanged. Stock totals are not affected.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={isTransferring}
                  onClick={() => setOnOpen(0)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 text-xs bg-blue-600 hover:bg-blue-700 gap-1.5"
                  disabled={isTransferring}
                  onClick={onTransferSubmit}
                >
                  {isTransferring ? (
                    "Transferring..."
                  ) : (
                    <>
                      <ArrowRightLeft className="h-3 w-3" />
                      Transfer
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default UpdateTransaction;
