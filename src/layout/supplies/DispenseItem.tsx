import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axios from "@/db/axios";
import { toast } from "sonner";
//
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormMessage,
  FormItem,
  FormField,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import SearchUser from "../SearchUser";
import SearchUnit from "../SearchUnit";
import SelectStockDispense from "../SelectStockDispense";
//
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
//schema and interfaces
import { DispenseItemSchema } from "@/interface/zod";
import { type DispenseItemProps, type SuppliesProps } from "@/interface/data";
import {
  Package,
  HandHelping,
  AlertTriangle,
  Loader2,
  Send,
  User as UserIcon,
  Building2,
  FileText,
  Hash,
} from "lucide-react";

interface Props {
  item: SuppliesProps;
  lineId: string;
  userId: string;
  token: string;
  setOnOpen: React.Dispatch<React.SetStateAction<number>>;
  listId: string;
  containerId: string;
  queryKey: string;
}

const DispenseItem = ({
  item,
  lineId,
  userId,
  token,
  setOnOpen,
  listId,
  containerId,
  queryKey,
}: Props) => {
  const queryClient = useQueryClient();
  const form = useForm<DispenseItemProps>({
    resolver: zodResolver(DispenseItemSchema),
    defaultValues: {
      desc: "",
      unitId: "",
      userId: "",
      quantity: "1",
      toAccount: true,
      address: "user",
      stockId: "",
    },
  });

  const {
    handleSubmit,
    watch,
    control,
    formState: { isSubmitting, errors },
    setValue,
    setError,
  } = form;

  const toAccount = watch("toAccount", true);
  const address = watch("address");
  const stockId = watch("stockId");
  const quantityRaw = watch("quantity");

  // Defensive: backend may omit SupplyStockTrack for some legacy rows
  const stockTracks = item.SupplyStockTrack ?? [];
  const totalStock = item.totalStock ?? 0;
  const selectedStock = stockTracks.find((s) => s.id === stockId);

  useEffect(() => {
    if (!toAccount) {
      setValue("unitId", undefined);
      setValue("userId", undefined);
    }
  }, [toAccount]);

  const onSubmit = async (data: DispenseItemProps) => {
    const quantity = parseInt(data.quantity, 10);

    if (!stockId) {
      setError("root", { message: "Select a stock batch first." });
      return;
    }
    const stockSel = stockTracks.find((s) => s.id === stockId);
    if (!stockSel) {
      setError("root", { message: "Selected stock is no longer valid." });
      return;
    }
    if (Number.isNaN(quantity) || quantity < 1) {
      setError("quantity", { message: "Enter a valid quantity." });
      return;
    }
    if (quantity > stockSel.stock) {
      setError("quantity", {
        message: `Only ${stockSel.stock} units available in this batch.`,
      });
      return;
    }
    if (data.toAccount) {
      if (data.address === "user" && !data.userId) {
        setError("userId", { message: "Select a user recipient." });
        return;
      }
      if (data.address === "unit" && !data.unitId) {
        setError("unitId", { message: "Select a unit recipient." });
        return;
      }
    }

    try {
      const response = await axios.post(
        "/supply/dispense",
        {
          id: data.stockId,
          currUserId: userId,
          remark: data.desc,
          inventoryBoxId: containerId,
          listId: listId,
          ...data,
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
        throw new Error(response.data?.message ?? "Failed to dispense.");
      }
      await queryClient.invalidateQueries({ queryKey: [queryKey, listId] });
      toast.success(`Dispensed ${quantity} unit${quantity !== 1 ? "s" : ""}`);
      setOnOpen(0);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        (err instanceof Error ? err.message : "Failed to dispense.");
      setError("root", { message: msg });
      toast.error(msg);
    }
  };

  const handleCancel = () => {
    if (isSubmitting) return;
    setOnOpen(0);
  };

  const parsedQty = parseInt(quantityRaw || "0", 10) || 0;
  const overLimit = !!selectedStock && parsedQty > selectedStock.stock;

  return (
    <div className="flex flex-col">
      <Form {...form}>
        <div className="space-y-3">

          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 pb-2 border-b">
            <div className="p-1.5 bg-blue-50 rounded-md flex-shrink-0">
              <HandHelping className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                Dispense Item
              </h3>
              <p className="text-[10px] text-gray-500">
                Total stock on hand:{" "}
                <span className="font-semibold text-gray-700">{totalStock}</span>
              </p>
            </div>
          </div>

          {/* ── Item summary ────────────────────────────────────────────── */}
          <div className="border rounded-lg bg-gray-50 p-2.5 flex items-center gap-2">
            <Package className="h-3 w-3 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">
                {item.item}
              </p>
              {item.refNumber && (
                <p className="text-[10px] text-gray-400 font-mono truncate">
                  Ref: {item.refNumber}
                </p>
              )}
            </div>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {stockTracks.length} batch{stockTracks.length !== 1 ? "es" : ""}
            </Badge>
          </div>

          {/* ── Stock & quantity card ──────────────────────────────────── */}
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
              <Hash className="h-3 w-3 text-blue-500" />
              <h4 className="text-xs font-semibold text-gray-800">
                Stock & Quantity
              </h4>
            </div>
            <div className="p-3 space-y-2.5">
              <FormField
                control={control}
                name="stockId"
                render={({ field: { onChange, value } }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-semibold text-gray-700">
                      Stock Batch *
                    </FormLabel>
                    <FormControl>
                      <SelectStockDispense
                        value={value}
                        onChange={onChange}
                        className="w-full"
                        items={stockTracks}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              {selectedStock && (
                <div className="flex items-center gap-1.5 px-2 py-1.5 bg-blue-50 border border-blue-100 rounded">
                  <span className="text-[10px] text-blue-700">
                    Available in this batch:
                  </span>
                  <span className="text-xs font-semibold text-blue-700">
                    {selectedStock.stock}
                  </span>
                  <span className="text-[10px] text-blue-600">units</span>
                </div>
              )}

              <FormField
                control={control}
                name="quantity"
                render={({ field: { onBlur, onChange, value } }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-semibold text-gray-700">
                      Quantity to Dispense *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={value}
                        onBlur={onBlur}
                        onChange={onChange}
                        placeholder="0"
                        min={1}
                        max={selectedStock?.stock ?? totalStock}
                        step="1"
                        className={`h-8 text-xs ${
                          overLimit ? "border-red-300 focus-visible:ring-red-200" : ""
                        }`}
                      />
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      {selectedStock
                        ? `Max: ${selectedStock.stock} units in selected batch`
                        : `Max: ${totalStock} units total`}
                    </FormDescription>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* ── Recipient card ─────────────────────────────────────────── */}
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
              <UserIcon className="h-3 w-3 text-blue-500" />
              <h4 className="text-xs font-semibold text-gray-800">Recipient</h4>
            </div>
            <div className="p-3 space-y-2.5">
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
                        Assign to user / unit
                      </FormLabel>
                      <p className="text-[10px] text-gray-500">
                        Uncheck for an anonymous / general issuance
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              {toAccount && (
                <div className="space-y-2.5 pl-2 border-l-2 border-blue-200">
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
                                className="text-xs cursor-pointer flex items-center gap-1"
                              >
                                <UserIcon className="h-2.5 w-2.5" />
                                User
                              </FormLabel>
                            </div>
                            <div className="flex items-center gap-1.5 cursor-pointer">
                              <RadioGroupItem value="unit" id="rec-unit" />
                              <FormLabel
                                htmlFor="rec-unit"
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
                            Select User *
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
                            Select Unit *
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
            </div>
          </div>

          {/* ── Remarks card ───────────────────────────────────────────── */}
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
              <FileText className="h-3 w-3 text-blue-500" />
              <h4 className="text-xs font-semibold text-gray-800">Remarks</h4>
            </div>
            <div className="p-3">
              <FormField
                name="desc"
                control={control}
                render={({ field: { value, onBlur, onChange } }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Notes, purpose, observations..."
                        onBlur={onBlur}
                        onChange={onChange}
                        value={value}
                        className="min-h-[60px] resize-none text-xs"
                      />
                    </FormControl>
                    <FormDescription className="text-[10px] mt-1">
                      Optional — appears on the dispense transaction record
                    </FormDescription>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* ── Form-level error ───────────────────────────────────────── */}
          {errors.root?.message && (
            <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-100 rounded-md">
              <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-red-700">
                {errors.root.message}
              </p>
            </div>
          )}
        </div>

        {/* ── Footer actions ───────────────────────────────────────────── */}
        <div className="sticky bottom-0 left-0 right-0 pt-3 mt-3 border-t bg-white flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="h-8 px-3 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="h-8 px-3 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="h-3 w-3" />
                Confirm Dispense
              </>
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default DispenseItem;
