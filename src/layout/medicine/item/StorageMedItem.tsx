import { memo, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  transferMedicineStock,
  updateMedicineThreshold,
} from "@/db/statements/medicine";
import { formatPureDate } from "@/utils/date";

import { TableRow, TableCell } from "@/components/ui/table";
import Modal from "@/components/custom/Modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import SelectStorage from "@/layout/SelectStorage";

import {
  FolderSync,
  Package,
  Loader2,
  CalendarClock,
  CheckCircle2,
  Save,
} from "lucide-react";

import type {
  Medicine,
  MedicineStock,
  ProtectedRouteProps,
  TransferMedStorageProps,
} from "@/interface/data";
import { TransferMedStorageSchema } from "@/interface/zod";

interface Props {
  item: Medicine;
  no: number;
  onMultiSelect: boolean;
  lineId: string;
  auth: ProtectedRouteProps;
  storageId: string;
}

const StorageMedItem = ({ item, no, onMultiSelect, lineId, auth, storageId }: Props) => {
  const [onOpen, setOnOpen] = useState(0); // 0=closed, 1=details, 2=transfer
  const queryClient = useQueryClient();
  const today = new Date();

  const [threshold, setThreshold] = useState<string>(
    String((item.MedicineStock ?? [])[0]?.threshold ?? 5),
  );
  const [savingThreshold, setSavingThreshold] = useState(false);

  const saveThreshold = async () => {
    const value = Math.max(0, parseInt(threshold || "0", 10) || 0);
    setSavingThreshold(true);
    try {
      await updateMedicineThreshold(auth.token as string, {
        medicineId: item.id,
        storageId: storageId as string,
        threshold: value,
        lineId,
        userId: auth.userId as string,
      });
      toast.success(`Threshold set to ${value} for ${item.name}`);
      queryClient.invalidateQueries({ queryKey: ["medStorage-list"] });
    } catch (e) {
      toast.error("Failed to update threshold", { description: `${e}` });
    } finally {
      setSavingThreshold(false);
    }
  };

  const stocks: MedicineStock[] = useMemo(
    () => (item.MedicineStock ?? []).filter((s) => (s.quantity ?? 0) > 0),
    [item.MedicineStock],
  );

  const statusColor = () => {
    if (item.totalStock <= 0) return "bg-red-50 text-red-700 border-red-200";
    if (item.totalStock < 10) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  };

  const expirationStatus = (exp?: string | null) => {
    if (!exp) return "border-gray-200";
    const d = new Date(exp);
    if (d <= today) return "border-red-300 bg-red-50";
    const sixMonths = new Date(today);
    sixMonths.setMonth(sixMonths.getMonth() + 6);
    if (d <= sixMonths) return "border-amber-300 bg-amber-50";
    return "border-gray-200";
  };

  // ── Transfer form ─────────────────────────────────────────────────────
  const transferForm = useForm<TransferMedStorageProps>({
    resolver: zodResolver(TransferMedStorageSchema),
    defaultValues: {
      stockId: "",
      departId: "",
      quantity: "1",
    },
  });
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isSubmitting },
  } = transferForm;

  const selectedStockId = watch("stockId");
  const qtyInput = watch("quantity");
  const selectedStock = stocks.find((s) => s.id === selectedStockId);

  const transferMut = useMutation({
    mutationFn: (data: TransferMedStorageProps) =>
      transferMedicineStock(auth.token as string, {
        stockId: data.stockId,
        departId: data.departId,
        quantity: parseInt(data.quantity, 10),
        userId: auth.userId as string,
      }),
    onSuccess: async (r) => {
      await queryClient.invalidateQueries({
        queryKey: ["medStorage-list", storageId],
        refetchType: "active",
      });
      await queryClient.invalidateQueries({
        queryKey: ["storage", storageId],
        refetchType: "active",
      });
      toast.success(
        r?.mode === "merge"
          ? "Stock transferred — merged into existing batch"
          : "Stock transferred to new batch in destination",
      );
      reset({ stockId: "", departId: "", quantity: "1" });
      setOnOpen(0);
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ??
          (err instanceof Error ? err.message : "Transfer failed"),
      );
    },
  });

  const onTransferSubmit = (data: TransferMedStorageProps) => {
    if (!selectedStock) {
      toast.error("Pick a batch to transfer first.");
      return;
    }
    const qty = parseInt(data.quantity, 10);
    if (qty > selectedStock.quantity) {
      transferForm.setError("quantity", {
        message: `Only ${selectedStock.quantity} available in this batch.`,
      });
      return;
    }
    transferMut.mutateAsync(data);
  };

  const openTransfer = () => {
    reset({
      stockId: stocks[0]?.id ?? "",
      departId: "",
      quantity: "1",
    });
    setOnOpen(2);
  };

  return (
    <>
      <TableRow
        className="hover:bg-gray-50 cursor-pointer"
        onClick={() => setOnOpen(1)}
      >
        {onMultiSelect && (
          <TableCell className="w-10" onClick={(e) => e.stopPropagation()} />
        )}
        <TableCell className="text-[10px] text-gray-500 text-center">
          {no}
        </TableCell>
        <TableCell>
          <code className="text-[11px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
            {item.serialNumber}
          </code>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5">
            <Package className="h-3 w-3 text-gray-400" />
            <span className="text-xs font-medium text-gray-900 truncate">
              {item.name}
            </span>
          </div>
        </TableCell>
        <TableCell className="text-center">
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 font-mono ${statusColor()}`}
          >
            {item.totalStock}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${
              item.stockToExpire > 0
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-gray-50 text-gray-500"
            }`}
          >
            {item.stockToExpire ?? 0}
          </Badge>
        </TableCell>
        <TableCell className="text-center">
          <Badge className="text-[10px] px-1.5 py-0">
            {item.totalStock <= 0
              ? "Out"
              : item.totalStock < 10
                ? "Low"
                : "In Stock"}
          </Badge>
        </TableCell>
      </TableRow>

      {/* ── Details modal ──────────────────────────────────────────── */}
      <Modal
        title={item.name}
        onOpen={onOpen === 1}
        setOnOpen={() => setOnOpen(0)}
        className="max-w-lg w-full max-h-[90vh] overflow-auto"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="border rounded-md bg-gray-50 p-2">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                Serial #
              </p>
              <code className="text-[11px] font-mono text-gray-800">
                {item.serialNumber}
              </code>
            </div>
            <div className="border rounded-md bg-gray-50 p-2">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                Total Stock
              </p>
              <p className="text-base font-bold text-gray-900 leading-none">
                {item.totalStock}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-semibold text-gray-700">
                Batches ({stocks.length})
              </p>
            </div>
            {stocks.length === 0 ? (
              <p className="text-[10px] text-gray-400 italic">
                No batches with stock on hand.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-[240px] overflow-auto pr-0.5">
                {stocks.map((s, i) => (
                  <div
                    key={s.id}
                    className={`border rounded-md p-2 ${expirationStatus(s.expiration as string | null)}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-medium text-gray-800">
                        #{i + 1} · {s.quantity} {s.quality}{" "}
                        <span className="text-gray-400">
                          (×{s.perQuantity} = {s.actualStock} items)
                        </span>
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500">
                        <CalendarClock className="h-2.5 w-2.5" />
                        Exp: {formatPureDate(s.expiration as string)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low-stock threshold */}
          <div className="border rounded-md p-2.5 bg-gray-50/60">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                Low-stock threshold
              </p>
              <span className="text-[9px] text-gray-400">
                applies to all batches
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="h-8 text-xs w-28"
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                size="sm"
                className="h-8 text-[10px] gap-1.5 bg-blue-600 hover:bg-blue-700"
                onClick={saveThreshold}
                disabled={savingThreshold}
              >
                {savingThreshold ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Save className="h-3 w-3" />
                )}
                Save
              </Button>
            </div>
            <p className="text-[9px] text-gray-400 mt-1">
              You'll be alerted when stock falls to this number or below.
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="w-full h-7 text-[10px] gap-1.5"
            onClick={openTransfer}
            disabled={stocks.length === 0}
          >
            <FolderSync className="h-3 w-3" />
            Transfer to Another Storage
          </Button>
        </div>
      </Modal>

      {/* ── Transfer modal ─────────────────────────────────────────── */}
      <Modal
        title="Transfer Stock"
        onOpen={onOpen === 2}
        setOnOpen={() => {
          if (transferMut.isPending) return;
          setOnOpen(0);
        }}
        className="max-w-md overflow-auto"
        footer={true}
        yesTitle="Transfer"
        loading={transferMut.isPending || isSubmitting}
        onFunction={handleSubmit(onTransferSubmit)}
      >
        <Form {...transferForm}>
          <div className="space-y-3">

            {/* Batch picker */}
            <FormField
              control={control}
              name="stockId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold text-gray-700">
                    Select Batch *
                  </FormLabel>
                  <div className="space-y-1.5 max-h-[200px] overflow-auto pr-0.5">
                    {stocks.length === 0 ? (
                      <p className="text-[10px] text-gray-400 italic">
                        No batches with stock available.
                      </p>
                    ) : (
                      stocks.map((s) => {
                        const isSelected = field.value === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              field.onChange(s.id);
                              // Clamp current quantity to this batch's size.
                              const cur = parseInt(qtyInput || "1", 10);
                              if (cur > s.quantity) {
                                setValue("quantity", String(s.quantity));
                              }
                            }}
                            className={`w-full text-left border rounded-md p-2 transition-colors ${
                              isSelected
                                ? "border-blue-400 bg-blue-50/50 ring-1 ring-blue-200"
                                : `${expirationStatus(s.expiration as string | null)} hover:border-blue-300`
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-[11px] font-medium text-gray-800">
                                  {s.quantity} {s.quality}{" "}
                                  <span className="text-gray-400">
                                    (×{s.perQuantity} = {s.actualStock} items)
                                  </span>
                                </p>
                                <p className="text-[10px] text-gray-500">
                                  Exp: {formatPureDate(s.expiration as string)}
                                </p>
                              </div>
                              {isSelected && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            {/* Destination */}
            <FormField
              control={control}
              name="departId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold text-gray-700">
                    Destination Storage *
                  </FormLabel>
                  <FormControl>
                    <SelectStorage
                      onChange={field.onChange}
                      lineId={lineId}
                      currentValue={field.value}
                      token={auth.token as string}
                    />
                  </FormControl>
                  <FormDescription className="text-[10px]">
                    Must be different from the current storage.
                  </FormDescription>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            {/* Quantity */}
            <FormField
              control={control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold text-gray-700">
                    Quantity to Transfer *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={1}
                      max={selectedStock?.quantity ?? undefined}
                      className="h-8 text-xs"
                      disabled={!selectedStock}
                    />
                  </FormControl>
                  <FormDescription className="text-[10px]">
                    {selectedStock ? (
                      <>
                        In <strong>{selectedStock.quality}</strong>. Up to{" "}
                        <strong>{selectedStock.quantity}</strong> available · ×
                        {selectedStock.perQuantity} per unit ={" "}
                        <strong>
                          {(parseInt(qtyInput || "0", 10) || 0) *
                            selectedStock.perQuantity}
                        </strong>{" "}
                        items moved.
                      </>
                    ) : (
                      "Pick a batch first."
                    )}
                  </FormDescription>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            {transferMut.isPending && (
              <div className="flex items-center justify-center gap-1.5 py-1 text-gray-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-[10px]">Transferring...</span>
              </div>
            )}
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default memo(StorageMedItem);
