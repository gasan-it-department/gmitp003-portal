import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axios from "@/db/axios";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Suppliers from "./Suppliers";
import SelectUnitOfMeasure from "@/layout/SelectUnitOfMeasure";
import {
  Package,
  PackagePlus,
  AlertTriangle,
  Loader2,
  Boxes,
} from "lucide-react";

import type { SuppliesProps, ProtectedRouteProps } from "@/interface/data";

interface Props {
  item: SuppliesProps;
  lineId: string;
  auth: ProtectedRouteProps;
  setOnOpen: React.Dispatch<React.SetStateAction<number>>;
  listId: string;
  containerId: string;
  queryKey: string;
}

const RestockItem = ({
  item,
  lineId,
  auth,
  setOnOpen,
  listId,
  containerId,
  queryKey,
}: Props) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    quantity: "1",
    perQuantity: "1",
    quality: "piece",
    supplier: "",
    price: "",
    expiration: "",
    brand: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalStock = item.totalStock ?? 0;
  const qty = parseInt(form.quantity || "0", 10) || 0;
  const perQ = parseInt(form.perQuantity || "1", 10) || 1;
  const willAdd = qty * perQ;

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async () => {
    setError(null);
    if (qty < 1) {
      setError("Enter a valid quantity (1 or more).");
      return;
    }
    if (!listId || !containerId) {
      setError("Missing container/list context.");
      return;
    }
    setSaving(true);
    try {
      const response = await axios.post(
        "/supply/restock",
        {
          suppliesId: item.id,
          inventoryBoxId: containerId,
          listId,
          quantity: qty,
          perQuantity: perQ,
          quality: form.quality.trim() || null,
          supplier: form.supplier.trim() || null,
          price: form.price ? parseFloat(form.price) : null,
          expiration: form.expiration || null,
          brand: form.brand.trim() || null,
          lineId,
          userId: auth.userId,
        },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        },
      );
      if (response.status !== 200) {
        throw new Error(response.data?.message ?? "Failed to restock.");
      }
      await queryClient.invalidateQueries({ queryKey: [queryKey, listId] });
      toast.success(`Restocked +${willAdd} unit${willAdd !== 1 ? "s" : ""}`);
      setOnOpen(0);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        (err instanceof Error ? err.message : "Failed to restock.");
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2 pb-2 border-b">
          <div className="p-1.5 bg-blue-50 rounded-md flex-shrink-0">
            <PackagePlus className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              Restock Item
            </h3>
            <p className="text-[10px] text-gray-500">
              Adds stock directly — no order process. Current on hand:{" "}
              <span className="font-semibold text-gray-700">{totalStock}</span>
            </p>
          </div>
        </div>

        {/* Item summary */}
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
          {willAdd > 0 && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200"
            >
              +{willAdd} units
            </Badge>
          )}
        </div>

        {/* Quantity card */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
            <Boxes className="h-3 w-3 text-blue-500" />
            <h4 className="text-xs font-semibold text-gray-800">
              Stock to add
            </h4>
          </div>
          <div className="p-3 grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-gray-700">
                Quantity *
              </Label>
              <Input
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => set("quantity", e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-gray-700">
                Units per quantity
              </Label>
              <Input
                type="number"
                min={1}
                value={form.perQuantity}
                onChange={(e) => set("perQuantity", e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-gray-700">
                Unit / quality
              </Label>
              <SelectUnitOfMeasure
                value={form.quality}
                onValueChange={(v) => set("quality", v)}
                defaultValue="piece"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-gray-700">
                Unit price
              </Label>
              <Input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="0"
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Source card */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50">
            <h4 className="text-xs font-semibold text-gray-800">
              Source (optional)
            </h4>
          </div>
          <div className="p-3 space-y-2.5">
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-gray-700">
                Supplier
              </Label>
              <Suppliers
                auth={auth}
                lineId={lineId}
                onChange={(v: string) => set("supplier", v)}
                handleResetSupplier={() => set("supplier", "")}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-gray-700">
                  Brand
                </Label>
                <Input
                  value={form.brand}
                  onChange={(e) => set("brand", e.target.value)}
                  placeholder="Brand"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-gray-700">
                  Expiration date
                </Label>
                <Input
                  type="date"
                  value={form.expiration}
                  onChange={(e) => set("expiration", e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-100 rounded-md">
            <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 left-0 right-0 pt-3 mt-3 border-t bg-white flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => !saving && setOnOpen(0)}
          disabled={saving}
          className="h-8 px-3 text-xs"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={saving}
          className="h-8 px-3 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700"
        >
          {saving ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Restocking...
            </>
          ) : (
            <>
              <PackagePlus className="h-3 w-3" />
              Confirm Restock
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default RestockItem;
