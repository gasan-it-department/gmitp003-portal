import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "@/db/axios";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getContainerDatasets } from "@/db/statement";
import SupplySearch from "./SupplySearch";
import Suppliers from "./Suppliers";
import SelectUnitOfMeasure from "@/layout/SelectUnitOfMeasure";
import { PackagePlus, AlertTriangle, Loader2, Boxes, Tag } from "lucide-react";

import type { ProtectedRouteProps } from "@/interface/data";

interface Props {
  lineId: string;
  listId: string;
  containerId: string;
  auth: ProtectedRouteProps;
  onClose: () => void;
}

const AddStockItem = ({ lineId, listId, containerId, auth, onClose }: Props) => {
  const queryClient = useQueryClient();

  // The container's datasets — the item search/create works within one of them
  // (datasets are per-container; a list isn't pinned to one).
  const { data: dsData } = useQuery({
    queryKey: ["container-datasets", containerId],
    queryFn: () => getContainerDatasets(auth.token as string, containerId),
    enabled: !!auth.token && !!containerId,
    refetchOnWindowFocus: false,
  });
  const datasets = dsData?.list ?? [];

  const [datasetId, setDatasetId] = useState("");
  // Default to the dataset with the most supplies (the main template list).
  useEffect(() => {
    if (!datasetId && datasets.length) {
      const biggest = [...datasets].sort((a, b) => b.count - a.count)[0];
      setDatasetId(biggest.id);
    }
  }, [datasets, datasetId]);

  // Item: either an existing supply (pickedId) or a brand-new name.
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [consumable, setConsumable] = useState(true);

  // Stock + source
  const [quantity, setQuantity] = useState("1");
  const [perQuantity, setPerQuantity] = useState("1");
  const [quality, setQuality] = useState("piece");
  const [supplier, setSupplier] = useState(""); // id (picked) or free-text name
  const [price, setPrice] = useState("");
  const [brand, setBrand] = useState("");
  const [expiration, setExpiration] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qty = parseInt(quantity || "0", 10) || 0;
  const perQ = parseInt(perQuantity || "1", 10) || 1;
  const willAdd = qty * perQ;
  const isNewItem = !pickedId;

  const onSubmit = async () => {
    setError(null);
    if (!pickedId && !itemName.trim()) {
      setError("Search for an item or type a new item name.");
      return;
    }
    if (!pickedId && !datasetId) {
      setError("Select a dataset for the new item.");
      return;
    }
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
          ...(pickedId
            ? { suppliesId: pickedId }
            : {
                newItem: {
                  item: itemName.trim(),
                  description: description.trim() || null,
                  consumable,
                },
                datasetId,
              }),
          inventoryBoxId: containerId,
          listId,
          quantity: qty,
          perQuantity: perQ,
          quality: quality.trim() || null,
          supplier: supplier.trim() || null,
          price: price ? parseFloat(price) : null,
          expiration: expiration || null,
          brand: brand.trim() || null,
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
        throw new Error(response.data?.message ?? "Failed to add item.");
      }
      await queryClient.invalidateQueries({ queryKey: ["supply-list", listId] });
      await queryClient.invalidateQueries({
        queryKey: ["listSupplyOverview", listId],
      });
      await queryClient.invalidateQueries({
        queryKey: [listId, "supply-stats"],
      });
      const label = pickedId ? "stock added" : `"${itemName.trim()}" added`;
      toast.success(`${label} — ${willAdd} unit(s)`);
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        (err instanceof Error ? err.message : "Failed to add item.");
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
              Add Item &amp; Stock
            </h3>
            <p className="text-[10px] text-gray-500">
              Pick an existing item or create a new one, then stock it — no order
              process.
            </p>
          </div>
        </div>

        {/* Item card */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
            <Tag className="h-3 w-3 text-blue-500" />
            <h4 className="text-xs font-semibold text-gray-800">Item *</h4>
          </div>
          <div className="p-3 space-y-2.5">
            {datasets.length > 1 && (
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold text-gray-700">
                  Dataset
                </Label>
                <Select value={datasetId} onValueChange={setDatasetId}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select dataset" />
                  </SelectTrigger>
                  <SelectContent>
                    {datasets.map((d) => (
                      <SelectItem key={d.id} value={d.id} className="text-xs">
                        {d.title} ({d.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <SupplySearch
              key={datasetId}
              datasetId={datasetId || undefined}
              auth={auth}
              onChange={({ id, name }) => {
                setPickedId(id);
                setItemName(name);
              }}
            />

            {/* New-item fields only when not picking an existing supply */}
            {isNewItem && itemName.trim() && (
              <>
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold text-gray-700">
                    Description
                  </Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional"
                    className="h-8 text-xs"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <Checkbox
                    checked={consumable}
                    onCheckedChange={(c) => setConsumable(c === true)}
                  />
                  Consumable item
                </label>
              </>
            )}
          </div>
        </div>

        {/* Stock card */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
            <Boxes className="h-3 w-3 text-blue-500" />
            <h4 className="text-xs font-semibold text-gray-800">Initial stock</h4>
            {willAdd > 0 && (
              <span className="ml-auto text-[10px] font-semibold text-blue-700">
                +{willAdd} units
              </span>
            )}
          </div>
          <div className="p-3 grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-gray-700">
                Quantity *
              </Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
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
                value={perQuantity}
                onChange={(e) => setPerQuantity(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-gray-700">
                Unit / quality
              </Label>
              <SelectUnitOfMeasure
                value={quality}
                onValueChange={setQuality}
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
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-[10px] font-semibold text-gray-700">
                Brand
              </Label>
              <Input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Optional"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-[10px] font-semibold text-gray-700">
                Expiration date
              </Label>
              <Input
                type="date"
                value={expiration}
                onChange={(e) => setExpiration(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Supplier card */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50">
            <h4 className="text-xs font-semibold text-gray-800">
              Supplier{" "}
              <span className="font-normal text-gray-400">(optional)</span>
            </h4>
          </div>
          <div className="p-3">
            <Suppliers
              auth={auth}
              lineId={lineId}
              onChange={(v: string) => setSupplier(v)}
              handleResetSupplier={() => setSupplier("")}
            />
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
          onClick={() => !saving && onClose()}
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
              Adding...
            </>
          ) : (
            <>
              <PackagePlus className="h-3 w-3" />
              {isNewItem ? "Add & Stock" : "Add Stock"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AddStockItem;
