import { useState, memo } from "react";
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
  ChevronRight,
} from "lucide-react";
import Suppliers from "../Suppliers";

// Define validation schema
const formSchema = z.object({
  brandName: z.string().optional(),
  noBrand: z.boolean().default(true),
  quality: z.string(),
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

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      brandName: "",
      noBrand: true,
      quantity: item.receivedQuantity.toString() || "1",
      perQuantity: item.perQuantity.toString() || "1",
      condition: item.condition || "new",
      comment: item.comment,
      resolved: item.remark || "1",
      price: item.price.toString(),
      supplier: "",
      expiration: "",
    },
  });

  const { watch, setValue } = form;
  const noBrand = watch("noBrand");
  const quanlity = watch("quantity");
  const perQuantity = watch("perQuantity");

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
        className="group hover:bg-accent/50 transition-colors cursor-pointer border-b"
        onClick={() => {
          if (disabled) return;
          setOnOpen(true);
        }}
      >
        <TableCell className="p-2 sm:p-3 font-medium text-xs sm:text-sm">
          {index + 1}
        </TableCell>
        <TableCell className="p-2 sm:p-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0 max-w-[120px] xs:max-w-[150px] sm:max-w-none">
              <p className="text-xs sm:text-sm font-medium truncate">
                {item.supply.item}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {item.supply.description || "No description"}
              </p>
            </div>
          </div>
        </TableCell>
        <TableCell className="p-2 sm:p-3">
          <code className="text-[10px] sm:text-xs bg-muted px-1 sm:px-2 py-0.5 sm:py-1 rounded font-mono truncate block max-w-[60px] xs:max-w-[80px] sm:max-w-none">
            {item.refNumber}
          </code>
        </TableCell>
        <TableCell className="p-2 sm:p-3 max-w-[80px] xs:max-w-[100px] sm:max-w-xs">
          <p className="text-xs sm:text-sm truncate">{item.desc}</p>
        </TableCell>
        <TableCell className="p-2 sm:p-3 text-right">
          <div className="flex flex-col items-end">
            <span className="text-xs sm:text-sm font-medium">
              {item.quantity}
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              ordered
            </span>
          </div>
        </TableCell>
        <TableCell className="p-2 sm:p-3 text-right">
          <div className="flex flex-col items-end">
            <span className="text-xs sm:text-sm font-medium">
              {item.receivedQuantity}
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              received
            </span>
          </div>
        </TableCell>
        <TableCell className="p-2 sm:p-3">
          {item.condition ? (
            <Badge
              variant="outline"
              className={`text-[10px] sm:text-xs capitalize px-1.5 sm:px-2 py-0 sm:py-0.5 ${getConditionBadge(
                item.condition,
              )}`}
            >
              <span className="hidden xs:inline">{item.condition}</span>
              <span className="xs:hidden">{item.condition.charAt(0)}</span>
            </Badge>
          ) : (
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              N/A
            </span>
          )}
        </TableCell>
        <TableCell className="p-2 sm:p-3 text-right">
          <div className="flex items-center justify-end gap-1">
            {item.price > 0 ? (
              <DollarSign className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-600 flex-shrink-0" />
            )}
            <span
              className={`text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                item.price > 0 ? "text-green-700" : "text-amber-700"
              }`}
            >
              {item.price > 0 ? `$${item.price.toFixed(2)}` : "No price"}
            </span>
          </div>
        </TableCell>
        <TableCell className="p-2 sm:p-3">
          <Badge
            variant={resolveInfo.variant}
            className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 sm:py-0.5"
          >
            <span className="hidden xs:inline">{resolveInfo.label}</span>
            <span className="xs:hidden">{resolveInfo.label.charAt(0)}</span>
          </Badge>
        </TableCell>
        <TableCell className="">
          {item.supplieRecieveHistories?.timestamp
            .toISOString()
            .split("T")[0] || "N/A"}
        </TableCell>
      </TableRow>

      <Modal
        title={
          <div className="flex items-start sm:items-center gap-2 sm:gap-3">
            <PackageOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5 sm:mt-0" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-semibold truncate pr-4">
                {item.supply.item}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                Ref: {item.refNumber} • Order item details
              </p>
            </div>
          </div>
        }
        onOpen={onOpen}
        className="w-[95%] sm:w-[90%] md:w-[85%] lg:w-[80%] max-w-4xl max-h-[90vh] overflow-auto mx-auto"
        setOnOpen={() => setOnOpen(false)}
        footer={true}
        onFunction={form.handleSubmit(onSubmit)}
        yesTitle="Update Item"
      >
        <div className="space-y-4 sm:space-y-6 px-1 sm:px-0">
          {/* Mobile scroll indicator for long forms */}
          <div className="sm:hidden flex items-center justify-end">
            <div className="bg-primary/10 rounded-full px-2 py-1 text-[10px] text-primary flex items-center gap-1">
              <ChevronRight className="h-3 w-3" />
              <span>Scroll for more</span>
            </div>
          </div>

          {/* Item Summary */}
          <div className="bg-muted/30 p-3 sm:p-4 rounded-lg space-y-2 sm:space-y-3">
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="min-w-0">
                <span className="text-muted-foreground">Ordered Quantity:</span>
                <p className="font-medium">{item.quantity} units</p>
              </div>
              <div className="min-w-0">
                <span className="text-muted-foreground">Current Status:</span>
                <Badge
                  variant="outline"
                  className="ml-2 capitalize text-[10px] sm:text-xs"
                >
                  {item.status || "Pending"}
                </Badge>
              </div>
              <div className="col-span-1 xs:col-span-2">
                <span className="text-muted-foreground">Description:</span>
                <p className="font-medium break-words">
                  {item.desc || "No description provided"}
                </p>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 sm:space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Left Column */}
                <div className="space-y-3 sm:space-y-4">
                  <FormField
                    control={form.control}
                    name="quality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                          <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                          Quality
                        </FormLabel>
                        <FormControl>
                          <SelectUnitOfMeasure
                            onValueChange={field.onChange}
                            value={field.value}
                            defaultValue="piece"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                          <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                          Received Quantity
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max={item.quantity}
                            placeholder="Enter received quantity"
                            {...field}
                            className="text-xs sm:text-sm h-8 sm:h-10"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="perQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                          <Boxes className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                          Per Quantity
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max={item.quantity}
                            placeholder="Enter received per quantity"
                            {...field}
                            className="text-xs sm:text-sm h-8 sm:h-10"
                          />
                        </FormControl>
                        <FormDescription className="text-[10px] sm:text-xs">
                          Actual Stock to be record:{" "}
                          {parseInt(perQuantity, 10) * parseInt(quanlity, 10) ||
                            0}
                        </FormDescription>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">
                          Item Condition
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-10">
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem
                              value="new"
                              className="text-xs sm:text-sm"
                            >
                              New
                            </SelectItem>
                            <SelectItem
                              value="good"
                              className="text-xs sm:text-sm"
                            >
                              Good
                            </SelectItem>
                            <SelectItem
                              value="damaged"
                              className="text-xs sm:text-sm"
                            >
                              Damaged
                            </SelectItem>
                            <SelectItem
                              value="expired"
                              className="text-xs sm:text-sm"
                            >
                              Expired
                            </SelectItem>
                            <SelectItem
                              value="missing"
                              className="text-xs sm:text-sm"
                            >
                              Missing Parts
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expiration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                          Expiration Date (Optional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            className="text-xs sm:text-sm h-8 sm:h-10"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Right Column */}
                <div className="space-y-3 sm:space-y-4">
                  <FormField
                    control={form.control}
                    name="resolved"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">
                          Resolution Status
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-10">
                              <SelectValue placeholder="Select resolution" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem
                              value="1"
                              className="text-xs sm:text-sm"
                            >
                              OK - Accept Item
                            </SelectItem>
                            <SelectItem
                              value="2"
                              className="text-xs sm:text-sm"
                            >
                              Consider - Review Needed
                            </SelectItem>
                            <SelectItem
                              value="0"
                              className="text-xs sm:text-sm"
                            >
                              Return - Reject Item
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                          <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                          Unit Price
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs sm:text-sm">
                              $
                            </span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              className="pl-6 sm:pl-8 text-xs sm:text-sm h-8 sm:h-10"
                              placeholder="0.00"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="supplier"
                    render={({ field: { onChange } }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">
                          Supplier (Optional)
                        </FormLabel>
                        <Suppliers
                          auth={auth}
                          lineId={lineId}
                          onChange={onChange}
                          handleResetSupplier={handleResetSupplier}
                        />
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Brand Section */}
              <div className="space-y-3 sm:space-y-4 border rounded-lg p-3 sm:p-4">
                <FormField
                  control={form.control}
                  name="noBrand"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-2 sm:space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 sm:mt-0"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none flex-1">
                        <FormLabel className="font-normal cursor-pointer text-xs sm:text-sm">
                          Use object name as brand
                        </FormLabel>
                        <FormDescription className="text-[10px] sm:text-xs">
                          When checked, the system will use the default brand
                          for this item type
                        </FormDescription>
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
                        <FormLabel className="text-xs sm:text-sm">
                          Custom Brand/Product Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter specific brand or product name"
                            {...field}
                            className="text-xs sm:text-sm h-8 sm:h-10"
                          />
                        </FormControl>
                        <FormDescription className="text-[10px] sm:text-xs">
                          Override the default brand for this specific item
                        </FormDescription>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Comments */}
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                      <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      Additional Comments
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add notes, observations, or special instructions..."
                        className="min-h-[60px] sm:min-h-[80px] resize-none text-xs sm:text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-[10px] sm:text-xs">
                      Optional: Any additional information about this item
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
      </Modal>
    </>
  );
};

export default memo(OrderCompletionItem);
