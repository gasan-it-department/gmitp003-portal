import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/db/axios";
import { toast } from "sonner";
//
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
import { Edit2, AlertTriangle } from "lucide-react";

//
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

const UpdateTransaction = ({ item, userId, token, lineId, onSuccess }: Props) => {
  const [onOpen, setOnOpen] = useState(0);

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
    formState: { isSubmitting, errors },
    handleSubmit,
    setError,
    control,
    watch,
    reset,
  } = form;

  // Re-sync defaults when the parent item changes (after invalidation)
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

  const onSubmit = async (data: UpdateTransactionProps) => {
    try {
      const payload: any = { id: item.id, currUserId: userId };

      // ── Recipient: only one of {userId, departmentId} may be set ──────
      if (data.toAccount) {
        if (data.address === "unit") {
          if (!data.unitId)
            throw new Error("Select a unit for the recipient.");
          if (data.unitId !== item.departmentId) payload.unitId = data.unitId;
        } else {
          if (!data.userId)
            throw new Error("Select a user for the recipient.");
          if (data.userId !== item.userId) payload.userId = data.userId;
        }
      } else {
        // toAccount disabled → clear recipient
        if (item.userId) payload.userId = null;
        if (item.departmentId) payload.unitId = null;
      }

      // ── Quantity ───────────────────────────────────────────────────────
      if (data.quantity && data.quantity !== item.quantity) {
        const n = parseInt(data.quantity, 10);
        if (isNaN(n) || n < 0)
          throw new Error("Quantity must be a non-negative number.");
        payload.quantity = data.quantity;
      }

      // No-op guard
      const keys = Object.keys(payload).filter((k) => k !== "id");
      if (keys.length === 0) throw new Error("Nothing to update.");

      const response = await axios.patch("/supply/transaction/update", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });

      if (response.status !== 200) {
        throw new Error(response.data?.message ?? "Failed to update.");
      }

      toast.success("Transaction updated");
      onSuccess?.();
      setOnOpen(0);
    } catch (err: any) {
      const apiMsg = err?.response?.data?.message;
      const msg = apiMsg || err.message || "Failed to update.";
      setError("root", { message: msg });
      toast.error(msg);
    }
  };

  return (
    <>
      <Button onClick={() => setOnOpen(1)} size="sm" className="h-7 text-xs gap-1.5">
        <Edit2 className="h-3 w-3" />
        Edit
      </Button>
      <Modal
        onFunction={handleSubmit(onSubmit)}
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded-md">
              <Edit2 className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Edit Transaction</h3>
              <p className="text-[10px] text-gray-500">
                Adjust recipient or quantity. Stock will auto-balance.
              </p>
            </div>
          </div>
        }
        onOpen={onOpen === 1}
        className="max-w-md w-[95vw]"
        setOnOpen={() => {
          if (isSubmitting) return;
          setOnOpen(0);
        }}
        loading={isSubmitting}
        yesTitle="Save Changes"
        footer={true}
      >
        <div className="p-1 space-y-3">
          <Form {...form}>
            <div className="space-y-3">

              {/* Quantity */}
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
                      Increasing this deducts from stock; decreasing returns the
                      difference back to stock.
                    </FormDescription>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              {/* To Account toggle */}
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
                        Assigned to Recipient
                      </FormLabel>
                      <p className="text-[10px] text-gray-500">
                        Unchecking will clear the linked user / unit.
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              {/* Recipient details */}
              {toAccount && (
                <div className="space-y-3 pl-2 border-l-2 border-blue-200 ml-1">
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
                              <RadioGroupItem value="user" id="rec-user" />
                              <FormLabel
                                htmlFor="rec-user"
                                className="text-xs cursor-pointer"
                              >
                                User
                              </FormLabel>
                            </div>
                            <div className="flex items-center gap-1.5 cursor-pointer">
                              <RadioGroupItem value="unit" id="rec-unit" />
                              <FormLabel
                                htmlFor="rec-unit"
                                className="text-xs cursor-pointer"
                              >
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

              {/* Form-level error */}
              {errors.root?.message && (
                <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-100 rounded">
                  <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-red-700">
                    {errors.root.message}
                  </p>
                </div>
              )}

              <div className="p-2 bg-blue-50 border border-blue-100 rounded text-[10px] text-blue-700">
                <strong>Note:</strong> Saving creates a <em>new</em> transaction
                that records the change. The original transaction is preserved
                as historical record.
              </div>
            </div>
          </Form>
        </div>
      </Modal>
    </>
  );
};

export default UpdateTransaction;
