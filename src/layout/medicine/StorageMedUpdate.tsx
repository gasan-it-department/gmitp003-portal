import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/provider/ProtectedRoute";
import axios from "@/db/axios";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";

import SelectMed from "./SelectMed";

import {
  Boxes,
  Trash2,
  Gauge,
  Package,
  Tally5,
  MousePointerClick,
  CalendarClock,
  Rows2,
  Columns2,
  LayoutPanelTop,
  PackageCheck,
  Box,
  Warehouse,
  TableOfContents,
  ChevronLeft,
  ArrowLeft,
  Loader2,
  Coins,
} from "lucide-react";

import { unitOfMeasure } from "@/utils/helper";

import type { AddStorageMedProps, Medicine } from "@/interface/data";
import { AddStorageMedSchema } from "@/interface/zod";

const StorageMedUpdate = () => {
  const [selected, setSelected] = useState<Medicine | undefined>(undefined);
  const [mobileView, setMobileView] = useState<"select" | "form">("select");

  const auth = useAuth();
  const { storageId, lineId } = useParams();
  const nav = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<AddStorageMedProps>({
    resolver: zodResolver(AddStorageMedSchema),
    defaultValues: {
      thresHold: "5",
      quantity: "1",
      medicineId: "",
      perUnit: "1",
      unitOfmeasure: "box",
      price: "0",
      manufacturingDate: "",
      expiration: "",
      addressRoom: "",
      addressCol: "",
      addressRow: "",
      addressSec: "",
      container: "",
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    control,
    watch,
    reset,
  } = form;

  const quantity = parseInt(watch("quantity") || "0", 10);
  const perUnit = parseInt(watch("perUnit") || "0", 10);
  const actualTotal = Number.isFinite(quantity * perUnit)
    ? quantity * perUnit
    : 0;

  const handleClear = () => {
    setSelected(undefined);
    reset();
    setMobileView("select");
  };

  const onSubmit = async (data: AddStorageMedProps) => {
    if (!selected) return toast.warning("Select a medicine first.");
    if (!auth.token || !auth.userId) return toast.warning("Unauthorized.");
    if (!storageId || !lineId) return toast.error("Missing storage/line id.");

    try {
      const response = await axios.post(
        "/storage/add-medicine",
        {
          medicineId: selected.id,
          lineId,
          storageId,
          userId: auth.userId,
          unitOfMeasure: data.unitOfmeasure,
          thresHold: parseInt(data.thresHold, 10),
          quantity: parseInt(data.quantity, 10),
          perUnit: parseInt(data.perUnit, 10),
          price: Number(data.price || 0),
          expiration: data.expiration,
          manufacturingDate: data.manufacturingDate,
          addressRoom: data.addressRoom?.trim() || undefined,
          addressCol:  data.addressCol?.trim()  || undefined,
          addressRow:  data.addressRow?.trim()  || undefined,
          addressSec:  data.addressSec?.trim()  || undefined,
          container:   data.container?.trim()   || undefined,
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

      // Invalidate across ALL instances (mounted or not). The list lives on
      // a different route, so "active"-only would skip it while we're on the
      // Update screen. Combined with refetchOnMount: "always" on the list,
      // the user always sees fresh data when they navigate back.
      await queryClient.invalidateQueries({
        queryKey: ["medStorage-list", storageId],
        refetchType: "all",
      });
      await queryClient.invalidateQueries({
        queryKey: ["storage", storageId],
        refetchType: "all",
      });

      toast.success(
        response.data?.mode === "restock"
          ? "Restocked existing batch"
          : "New batch added to storage",
      );
      handleClear();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        (err instanceof Error ? err.message : "Failed to add to storage");
      toast.error(msg);
    }
  };

  // ── Form body (shared between desktop right panel & mobile view) ──────
  const FormBody = (
    <div className="p-3 space-y-3">

      {/* Selected medicine pill */}
      {selected && (
        <div className="border rounded-md bg-blue-50 border-blue-200 px-2.5 py-2 flex items-center gap-2">
          <PackageCheck className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-blue-900 truncate">
              {selected.name}
            </p>
            <p className="text-[10px] text-blue-700 font-mono truncate">
              {selected.serialNumber}
            </p>
          </div>
        </div>
      )}

      <Form {...form}>
        <div className="space-y-3">

          {/* Unit of Measure */}
          <FormField
            control={control}
            name="unitOfmeasure"
            render={({ field: { onChange, value } }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-semibold text-gray-700">
                  Unit of Measure *
                </FormLabel>
                <FormControl>
                  <Select value={value} onValueChange={onChange}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {unitOfMeasure.map((item, i) => (
                        <SelectItem
                          key={i}
                          value={item.value}
                          className="text-xs"
                        >
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />

          {/* Quantity + Per Unit */}
          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold text-gray-700">
                    Quantity *
                  </FormLabel>
                  <FormControl>
                    <InputGroup className="bg-white">
                      <InputGroupAddon>
                        <Tally5 className="h-3 w-3" />
                      </InputGroupAddon>
                      <InputGroupInput
                        type="number"
                        min="1"
                        placeholder="Qty"
                        className="h-8 text-xs"
                        {...field}
                      />
                    </InputGroup>
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="perUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold text-gray-700">
                    Per Unit *
                  </FormLabel>
                  <FormControl>
                    <InputGroup className="bg-white">
                      <InputGroupAddon>
                        <Boxes className="h-3 w-3" />
                      </InputGroupAddon>
                      <InputGroupInput
                        type="number"
                        min="1"
                        placeholder="Items/unit"
                        className="h-8 text-xs"
                        {...field}
                      />
                    </InputGroup>
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />
          </div>

          {/* Actual total readout */}
          <div className="border rounded-md bg-gray-50 px-2.5 py-2 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-gray-700">
                Total items added
              </p>
              <p className="text-[10px] text-gray-500">
                {quantity || 0} × {perUnit || 0} = <strong>{actualTotal}</strong>
              </p>
            </div>
            <Badge
              variant="outline"
              className="text-[10px] px-2 py-0 font-mono bg-white"
            >
              {actualTotal}
            </Badge>
          </div>

          {/* Threshold + Price */}
          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={control}
              name="thresHold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold text-gray-700">
                    Low-stock Threshold
                  </FormLabel>
                  <FormControl>
                    <InputGroup className="bg-white">
                      <InputGroupAddon>
                        <Gauge className="h-3 w-3" />
                      </InputGroupAddon>
                      <InputGroupInput
                        type="number"
                        min="0"
                        placeholder="Alert level"
                        className="h-8 text-xs"
                        {...field}
                      />
                    </InputGroup>
                  </FormControl>
                  <FormDescription className="text-[10px]">
                    Alert when stock ≤ this
                  </FormDescription>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold text-gray-700">
                    Price
                  </FormLabel>
                  <FormControl>
                    <InputGroup className="bg-white">
                      <InputGroupAddon>
                        <Coins className="h-3 w-3" />
                      </InputGroupAddon>
                      <InputGroupInput
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="h-8 text-xs"
                        {...field}
                      />
                    </InputGroup>
                  </FormControl>
                  <FormDescription className="text-[10px]">
                    Per-batch price (tracked)
                  </FormDescription>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={control}
              name="manufacturingDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold text-gray-700">
                    Manufactured *
                  </FormLabel>
                  <FormControl>
                    <InputGroup className="bg-white">
                      <InputGroupAddon>
                        <CalendarClock className="h-3 w-3" />
                      </InputGroupAddon>
                      <InputGroupInput
                        type="date"
                        className="h-8 text-xs"
                        {...field}
                      />
                    </InputGroup>
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="expiration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold text-gray-700">
                    Expires *
                  </FormLabel>
                  <FormControl>
                    <InputGroup className="bg-white">
                      <InputGroupAddon>
                        <CalendarClock className="h-3 w-3" />
                      </InputGroupAddon>
                      <InputGroupInput
                        type="date"
                        className="h-8 text-xs"
                        {...field}
                      />
                    </InputGroup>
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />
          </div>

          {/* Shelf Address */}
          <div className="border rounded-md bg-white overflow-hidden">
            <div className="px-2.5 py-1.5 border-b bg-gray-50 flex items-center gap-1.5">
              <LayoutPanelTop className="h-3 w-3 text-blue-500" />
              <p className="text-[10px] font-semibold text-gray-700">
                Shelf Address (optional)
              </p>
            </div>
            <div className="p-2.5 grid grid-cols-2 gap-2">
              <FormField
                control={control}
                name="addressRoom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] text-gray-600">
                      Room
                    </FormLabel>
                    <FormControl>
                      <InputGroup className="bg-white">
                        <InputGroupAddon>
                          <Warehouse className="h-3 w-3" />
                        </InputGroupAddon>
                        <InputGroupInput
                          placeholder="Room"
                          className="h-8 text-xs"
                          {...field}
                        />
                      </InputGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="addressSec"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] text-gray-600">
                      Section
                    </FormLabel>
                    <FormControl>
                      <InputGroup className="bg-white">
                        <InputGroupAddon>
                          <TableOfContents className="h-3 w-3" />
                        </InputGroupAddon>
                        <InputGroupInput
                          placeholder="Section"
                          className="h-8 text-xs"
                          {...field}
                        />
                      </InputGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="addressRow"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] text-gray-600">
                      Row
                    </FormLabel>
                    <FormControl>
                      <InputGroup className="bg-white">
                        <InputGroupAddon>
                          <Rows2 className="h-3 w-3" />
                        </InputGroupAddon>
                        <InputGroupInput
                          placeholder="Row"
                          className="h-8 text-xs"
                          {...field}
                        />
                      </InputGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="addressCol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] text-gray-600">
                      Column
                    </FormLabel>
                    <FormControl>
                      <InputGroup className="bg-white">
                        <InputGroupAddon>
                          <Columns2 className="h-3 w-3" />
                        </InputGroupAddon>
                        <InputGroupInput
                          placeholder="Column"
                          className="h-8 text-xs"
                          {...field}
                        />
                      </InputGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="container"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className="text-[10px] text-gray-600">
                      Container
                    </FormLabel>
                    <FormControl>
                      <InputGroup className="bg-white">
                        <InputGroupAddon>
                          <Box className="h-3 w-3" />
                        </InputGroupAddon>
                        <InputGroupInput
                          placeholder="Container reference"
                          className="h-8 text-xs"
                          {...field}
                        />
                      </InputGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      </Form>
    </div>
  );

  const EmptySelectionState = (
    <div className="h-full flex flex-col items-center justify-center p-4 text-center">
      <div className="rounded-full bg-gray-100 p-3 mb-2">
        <MousePointerClick className="h-5 w-5 text-gray-400" />
      </div>
      <h3 className="text-xs font-semibold text-gray-700">
        Select a Medicine
      </h3>
      <p className="text-[10px] text-gray-500 mt-1 max-w-[260px]">
        Choose a medicine on the left to configure its batch details for this
        storage.
      </p>
    </div>
  );

  const ActionsRow = selected ? (
    <div className="flex items-center justify-end gap-1.5 px-3 py-2 border-t bg-gray-50 flex-shrink-0">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleClear}
        disabled={isSubmitting}
        className="h-7 text-[10px]"
      >
        Cancel
      </Button>
      <Button
        type="button"
        size="sm"
        onClick={handleSubmit(onSubmit)}
        disabled={isSubmitting}
        className="h-7 text-[10px] gap-1.5 bg-blue-600 hover:bg-blue-700 min-w-[120px]"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Package className="h-3 w-3" />
            Add to Storage
          </>
        )}
      </Button>
    </div>
  ) : null;

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">

      {/* Page header */}
      <div className="bg-white border-b flex-shrink-0">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => nav(-1)}
            >
              <ArrowLeft className="h-3 w-3" />
            </Button>
            <div className="p-1.5 bg-blue-600 rounded-md flex-shrink-0">
              <Package className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-semibold text-gray-900 truncate">
                Stock &amp; Restock
              </h1>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                Add new batches or top up existing ones
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Desktop: resizable two-pane ───────────────────────────────── */}
      <div className="hidden lg:flex flex-1 min-h-0 p-3">
        <ResizablePanelGroup
          direction="horizontal"
          className="w-full h-full border rounded-lg bg-white overflow-hidden"
        >
          <ResizablePanel defaultSize={45} minSize={30}>
            <div className="h-full flex flex-col">
              <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5 flex-shrink-0">
                <Package className="h-3 w-3 text-blue-500" />
                <div>
                  <h2 className="text-xs font-semibold text-gray-800">
                    Select Medicine
                  </h2>
                  <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                    Search and pick a medicine
                  </p>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <SelectMed onChange={setSelected} value={selected} />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          <ResizablePanel defaultSize={55} minSize={40}>
            <div className="h-full flex flex-col">
              <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2 flex-shrink-0">
                <div className="min-w-0">
                  <h2 className="text-xs font-semibold text-gray-800 truncate">
                    Batch Details
                  </h2>
                  <p className="text-[10px] text-gray-500 leading-none mt-0.5 truncate">
                    {selected ? selected.name : "Select a medicine first"}
                  </p>
                </div>
                {selected && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleClear}
                    className="h-7 text-[10px] gap-1.5"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear
                  </Button>
                )}
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto">
                {selected ? FormBody : EmptySelectionState}
              </div>

              {ActionsRow}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* ── Mobile: single-pane swap ─────────────────────────────────── */}
      <div className="lg:hidden flex-1 min-h-0 flex flex-col p-3">
        <div className="flex-1 min-h-0 border rounded-lg bg-white overflow-hidden flex flex-col">
          {mobileView === "select" ? (
            <>
              <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5 flex-shrink-0">
                <Package className="h-3 w-3 text-blue-500" />
                <div>
                  <h2 className="text-xs font-semibold text-gray-800">
                    Select Medicine
                  </h2>
                  <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                    Search and select
                  </p>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <SelectMed
                  onChange={(med) => {
                    setSelected(med);
                    if (med) setMobileView("form");
                  }}
                  value={selected}
                />
              </div>
            </>
          ) : (
            <>
              <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2 flex-shrink-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMobileView("select")}
                    className="h-7 w-7 p-0 flex-shrink-0"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <div className="min-w-0">
                    <h2 className="text-xs font-semibold text-gray-800 truncate">
                      Batch Details
                    </h2>
                    <p className="text-[10px] text-gray-500 leading-none mt-0.5 truncate">
                      {selected ? selected.name : "—"}
                    </p>
                  </div>
                </div>
                {selected && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClear}
                    className="h-7 text-[10px] gap-1.5 flex-shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear
                  </Button>
                )}
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto">
                {selected ? FormBody : EmptySelectionState}
              </div>

              {ActionsRow}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StorageMedUpdate;
