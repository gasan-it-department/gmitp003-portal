import { useState, useEffect, memo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "@/db/axios";
import { useParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";

// UI Components
import { TableRow, TableCell } from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectValue,
  SelectTrigger,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Modal from "@/components/custom/Modal";
import { toast } from "sonner";
import SelectUnitOfMeasure from "@/layout/SelectUnitOfMeasure";
//
import {
  type OrderCompletionSelected,
  type ProtectedRouteProps,
  type SupplyOrder,
} from "@/interface/data";
// Icons
import {
  Package,
  PackageOpen,
  DollarSign,
  AlertCircle,
  Calendar,
  MessageSquare,
  Boxes,
} from "lucide-react";
import Suppliers from "../Suppliers";

// Define validation schema
const formSchema = z.object({
  brandName: z.string().optional(),
  noBrand: z.boolean().default(true),
  quality: z.string().min(1, "Quality is required"),
  quantity: z.string().min(1, "Quantity is required"),
  perQuantity: z.string(),
  condition: z.string().min(1, "Condition is required"),
  comment: z.string().optional(),
  resolved: z.string().optional(),
  price: z.string().optional(),
  supplier: z.string().optional(),
  expiration: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Props {
  item: SupplyOrder;
  index: number;
  selected: any[];
  setSelected: React.Dispatch<React.SetStateAction<OrderCompletionSelected[]>>;
  auth: ProtectedRouteProps;
  listId: string | undefined;
  lineId: string | undefined;
  orderId: string | undefined;
  disabled: boolean;
}

const OrderCompletionItem = ({
  index,
  item,
  auth,
  listId,
  lineId,
  orderId,
  disabled,
}: Props) => {
  const [onOpen, setOnOpen] = useState(false);
  const { containerId } = useParams();
  const queryClient = useQueryClient();

  // The Select renders the placeholder when value doesn't match any SelectItem,
  // so coerce the DB value into one of the known options. Anything unknown → "new".
  const VALID_CONDITIONS = ["new", "good", "damaged", "expired", "missing"] as const;
  const rawCondition =
    typeof item.condition === "string" ? item.condition.trim().toLowerCase() : "";
  const defaultCondition = (VALID_CONDITIONS as readonly string[]).includes(rawCondition)
    ? rawCondition
    : "new";

  // resolved/remark: "0" = To Return, "1" = OK, "2" = Considered.
  const VALID_RESOLVED = ["0", "1", "2"] as const;
  const rawResolved =
    item.remark !== null && item.remark !== undefined
      ? String(item.remark).trim()
      : "";
  const defaultResolved = (VALID_RESOLVED as readonly string[]).includes(rawResolved)
    ? rawResolved
    : "1"; // "1" = OK

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      brandName: "",
      noBrand: true,
      quantity: item.quantity.toString() || "1",
      perQuantity: item.perQuantity.toString() || "1",
      condition: defaultCondition,
      comment: item.comment,
      resolved: defaultResolved,
      price: item.price.toString(),
      supplier: item.id || "",
      expiration: item.expiration || "",
      quality: item.quality || "",
    },
  });

  const { watch, setValue, reset } = form;
  const noBrand = watch("noBrand");
  const quanlity = watch("quantity");
  const perQuantity = watch("perQuantity");

  // Re-sync the form whenever the modal opens (or the item changes) so the
  // condition + status defaults always show, even after a previous edit.
  useEffect(() => {
    if (!onOpen) return;
    reset({
      brandName: "",
      noBrand: true,
      quantity: item.quantity.toString() || "1",
      perQuantity: item.perQuantity.toString() || "1",
      condition: defaultCondition,
      comment: item.comment,
      resolved: defaultResolved,
      price: item.price.toString(),
      supplier: item.id || "",
      expiration: item.expiration || "",
      quality: item.quality || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onOpen, item.id]);

  const handleResetSupplier = () => {
    setValue("supplier", "");
  };

  const onSubmit = async (data: FormData) => {
    if (!containerId) {
      toast.error("Container ID is missing. Please select a valid container.");
      return;
    }
    if (!listId) {
      return toast.error("List ID is missing.");
    }
    try {
      const response = await axios.post(
        "/fullfill-item-order",
        {
          id: item.suppliesId,
          quantity: parseInt(data.quantity, 10),
          perQuantity: parseInt(data.perQuantity, 10),
          condition: data.condition,
          comment: data.comment,
          resolve: data.resolved ? parseInt(data.resolved, 10) : 0,
          price: parseFloat(data.price || "0"),
          brand: noBrand ? null : data.brandName,
          inventoryBoxId: containerId,
          listId: listId,
          expirationDate: data.expiration,
          supplier: data.supplier,
          lineId: lineId,
          orderItemId: item.id,
          quality: data.quality,
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
        console.error("Failed to submit form:", response.statusText);
        toast.error("Failed to update item");
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: ["order-items", orderId],
        refetchType: "active",
      });
      toast.success("Item updated successfully");
      setOnOpen(false);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Error updating item");
    }
  };

  const getConditionBadge = (condition: string) => {
    const variants = {
      new: "bg-green-100 text-green-800 border-green-200",
      good: "bg-blue-100 text-blue-800 border-blue-200",
      damaged: "bg-amber-100 text-amber-800 border-amber-200",
      expired: "bg-red-100 text-red-800 border-red-200",
      "missing parts": "bg-purple-100 text-purple-800 border-purple-200",
    };
    return (
      variants[condition as keyof typeof variants] ||
      "bg-gray-100 text-gray-800 border-gray-200"
    );
  };

  const getResolveBadge = (resolve: string) => {
    const resolveMap = {
      "1": { label: "OK", variant: "default" as const },
      "2": { label: "Considered", variant: "secondary" as const },
      "0": { label: "To Return", variant: "destructive" as const },
    };
    return (
      resolveMap[resolve as keyof typeof resolveMap] || {
        label: "Pending",
        variant: "outline" as const,
      }
    );
  };

  const resolveInfo = getResolveBadge(item.remark);

  return (
    <>
      <TableRow
        className="group hover:bg-gray-50 transition-colors cursor-pointer border-b"
        onClick={() => {
          if (disabled) return;
          setOnOpen(true);
        }}
      >
        <TableCell className="py-2 px-3 text-xs font-medium text-gray-500">
          {index + 1}
        </TableCell>
        <TableCell className="py-2 px-3">
          <div className="flex items-center gap-1.5">
            <Package className="h-3 w-3 text-gray-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">
                {item.supply.item}
              </p>
              <p className="text-[10px] text-gray-400 truncate">
                {item.supply.description || "No description"}
              </p>
            </div>
          </div>
        </TableCell>
        <TableCell className="py-2 px-3">
          <code className="text-[10px] font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
            {item.refNumber}
          </code>
        </TableCell>
        <TableCell className="py-2 px-3 max-w-[180px]">
          <p className="text-xs text-gray-600 truncate">{item.desc}</p>
        </TableCell>
        <TableCell className="py-2 px-3 text-right">
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-gray-800">
              {item.quantity}
            </span>
            <span className="text-[10px] text-gray-400">ordered</span>
          </div>
        </TableCell>
        <TableCell className="py-2 px-3 text-right">
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-gray-800">
              {item.receivedQuantity}
            </span>
            <span className="text-[10px] text-gray-400">received</span>
          </div>
        </TableCell>
        <TableCell className="py-2 px-3">
          {item.condition ? (
            <Badge
              variant="outline"
              className={`text-[10px] capitalize px-1.5 py-0 leading-none ${getConditionBadge(
                item.condition,
              )}`}
            >
              {item.condition}
            </Badge>
          ) : (
            <span className="text-[10px] text-gray-400">N/A</span>
          )}
        </TableCell>
        <TableCell className="py-2 px-3 text-right">
          <div className="flex items-center justify-end gap-1">
            {item.price > 0 ? (
              <DollarSign className="h-3 w-3 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-3 w-3 text-amber-600 flex-shrink-0" />
            )}
            <span
              className={`text-[10px] font-medium whitespace-nowrap ${
                item.price > 0 ? "text-green-700" : "text-amber-700"
              }`}
            >
              {item.price > 0 ? `$${item.price.toFixed(2)}` : "No price"}
            </span>
          </div>
        </TableCell>
        <TableCell className="py-2 px-3">
          <Badge
            variant={resolveInfo.variant}
            className="text-[10px] px-1.5 py-0 leading-none"
          >
            {resolveInfo.label}
          </Badge>
        </TableCell>
        <TableCell className="py-2 px-3 text-[10px] text-gray-500">
          {item.supplieRecieveHistories?.timestamp
            .toISOString()
            .split("T")[0] || "N/A"}
        </TableCell>
      </TableRow>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded-md flex-shrink-0">
              <PackageOpen className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {item.supply.item}
              </h3>
              <p className="text-[10px] text-gray-500 truncate">
                Ref: {item.refNumber} · Order item details
              </p>
            </div>
          </div>
        }
        onOpen={onOpen}
        className="max-w-3xl w-[95vw] max-h-[90vh] overflow-auto"
        setOnOpen={() => setOnOpen(false)}
        footer={true}
        onFunction={form.handleSubmit(onSubmit)}
        yesTitle="Update Item"
      >
        <div className="space-y-3 p-1">

          {/* ── Item Summary ── */}
          <div className="border rounded-lg bg-gray-50 overflow-hidden">
            <div className="px-3 py-2 border-b bg-white">
              <h4 className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                Item Summary
              </h4>
            </div>
            <div className="p-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-gray-500">Ordered Quantity</p>
                <p className="text-xs font-medium text-gray-900 mt-0.5">
                  {item.quantity} units
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Current Status</p>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 mt-0.5 capitalize"
                >
                  {item.status || "Pending"}
                </Badge>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-gray-500">Description</p>
                <p className="text-xs text-gray-700 mt-0.5 break-words">
                  {item.desc || "No description provided"}
                </p>
              </div>
            </div>
          </div>

          {/* ── Form ── */}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-3"
            >
              {/* Receipt details card */}
              <div className="border rounded-lg bg-white overflow-hidden">
                <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
                  <Package className="h-3 w-3 text-blue-500" />
                  <h4 className="text-xs font-semibold text-gray-800">
                    Receipt Details
                  </h4>
                </div>
                <div className="p-3 grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="quality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-semibold text-gray-700">
                          Quality *
                        </FormLabel>
                        <FormControl>
                          <SelectUnitOfMeasure
                            onValueChange={field.onChange}
                            value={field.value}
                            defaultValue="piece"
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-semibold text-gray-700">
                          Received Quantity
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max={item.quantity}
                            placeholder="0"
                            className="h-8 text-xs"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="perQuantity"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="text-[10px] font-semibold text-gray-700 flex items-center gap-1">
                          <Boxes className="h-2.5 w-2.5" /> Per Quantity
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            className="h-8 text-xs"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-[10px] text-gray-500">
                          Actual stock to record:{" "}
                          <span className="font-semibold text-gray-700">
                            {parseInt(perQuantity, 10) *
                              parseInt(quanlity, 10) || 0}
                          </span>
                        </FormDescription>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-semibold text-gray-700">
                          Item Condition
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "new"}
                        >
                          <FormControl>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="new" className="text-xs">New</SelectItem>
                            <SelectItem value="good" className="text-xs">Good</SelectItem>
                            <SelectItem value="damaged" className="text-xs">Damaged</SelectItem>
                            <SelectItem value="expired" className="text-xs">Expired</SelectItem>
                            <SelectItem value="missing" className="text-xs">Missing Parts</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expiration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-semibold text-gray-700 flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5" /> Expiration
                          <span className="font-normal text-gray-400">
                            (optional)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="h-8 text-xs"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Pricing & status card */}
              <div className="border rounded-lg bg-white overflow-hidden">
                <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
                  <DollarSign className="h-3 w-3 text-blue-500" />
                  <h4 className="text-xs font-semibold text-gray-800">
                    Pricing & Status
                  </h4>
                </div>
                <div className="p-3 grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="resolved"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-semibold text-gray-700">
                          Status
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || "1"}
                        >
                          <FormControl>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1" className="text-xs">
                              OK — Accept item
                            </SelectItem>
                            <SelectItem value="2" className="text-xs">
                              Consider — Review needed
                            </SelectItem>
                            <SelectItem value="0" className="text-xs">
                              Return — Reject item
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-semibold text-gray-700">
                          Unit Price
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                              $
                            </span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              className="pl-5 h-8 text-xs"
                              placeholder="0.00"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="supplier"
                    render={({ field: { onChange } }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="text-[10px] font-semibold text-gray-700">
                          Supplier
                          <span className="font-normal text-gray-400 ml-1">
                            (optional)
                          </span>
                        </FormLabel>
                        <Suppliers
                          auth={auth}
                          lineId={lineId}
                          onChange={onChange}
                          handleResetSupplier={handleResetSupplier}
                        />
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Brand card */}
              <div className="border rounded-lg bg-white overflow-hidden">
                <div className="px-3 py-2 border-b bg-gray-50">
                  <h4 className="text-xs font-semibold text-gray-800">Brand</h4>
                </div>
                <div className="p-3 space-y-2">
                  <FormField
                    control={form.control}
                    name="noBrand"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start gap-2 p-2 bg-gray-50 rounded-md">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="h-3.5 w-3.5 mt-0.5"
                          />
                        </FormControl>
                        <div className="leading-tight">
                          <FormLabel className="text-xs font-medium cursor-pointer">
                            Use object name as brand
                          </FormLabel>
                          <p className="text-[10px] text-gray-500">
                            Uses the default brand for this item type
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  {!noBrand && (
                    <FormField
                      control={form.control}
                      name="brandName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-semibold text-gray-700">
                            Custom Brand / Product Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Acme Co."
                              className="h-8 text-xs"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>

              {/* Comments card */}
              <div className="border rounded-lg bg-white overflow-hidden">
                <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
                  <MessageSquare className="h-3 w-3 text-blue-500" />
                  <h4 className="text-xs font-semibold text-gray-800">
                    Comments
                  </h4>
                </div>
                <div className="p-3">
                  <FormField
                    control={form.control}
                    name="comment"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Notes, observations, or special instructions..."
                            className="min-h-[60px] resize-none text-xs"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </form>
          </Form>
        </div>
      </Modal>
    </>
  );
};

export default memo(OrderCompletionItem);
