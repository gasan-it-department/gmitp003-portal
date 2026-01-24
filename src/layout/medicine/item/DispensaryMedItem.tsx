import { memo } from "react";
import { Item, ItemTitle, ItemContent, ItemHeader } from "@/components/ui/item";
import { useFormContext } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  FormField,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  TooltipTrigger,
  Tooltip,
  TooltipContent,
} from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";

//
import { formatPureDate } from "@/utils/date";
//icons
import {
  CircleAlert,
  Package,
  Pill,
  Calendar,
  CheckCircle2,
} from "lucide-react";

//
import type { ReleasePrescribeMedItemProps } from "@/interface/data";
import type { Control } from "react-hook-form";
import { Label } from "@/components/ui/label";

interface Props {
  no: number;
  item: ReleasePrescribeMedItemProps;
  id: string;
  status: number;
  control: Control<
    {
      prescribeMed: {
        quantity: string;
        prescribeQuantity: string;
        remark: string;
        medId: string;
        id: string;
        label: string;
        currentStock: string;
        stocks: {
          id: string;
          quantity: string;
          expireIn?: string | undefined;
          toRelease: string;
        }[];
      }[];
    },
    any,
    {
      prescribeMed: {
        quantity: string;
        prescribeQuantity: string;
        remark: string;
        medId: string;
        id: string;
        label: string;
        currentStock: string;
        stocks: {
          id: string;
          quantity: string;
          expireIn?: string | undefined;
          toRelease: string;
        }[];
      }[];
    }
  >;
}

const DispensaryMedItem = ({ no, item, control, status }: Props) => {
  const currentQuantity = parseInt(item.currentStock);
  const isLowStock = currentQuantity <= 10;
  const isCompleted = status === 2;
  const isDisabled = isCompleted || isLowStock;
  const { watch } = useFormContext();

  const getStockStatus = () => {
    if (currentQuantity === 0)
      return { label: "Out", variant: "destructive" as const };
    if (currentQuantity <= 5)
      return { label: "Very Low", variant: "destructive" as const };
    if (currentQuantity <= 10)
      return { label: "Low", variant: "secondary" as const };
    if (currentQuantity <= 20)
      return { label: "Adequate", variant: "outline" as const };
    return { label: "In Stock", variant: "default" as const };
  };

  const stockStatus = getStockStatus();
  const stocks = watch(`prescribeMed.${no}.stocks`);

  // Calculate total toRelease
  const totalToRelease =
    stocks?.reduce((total: number, stock: any) => {
      const releaseValue = parseInt(stock?.toRelease || "0");
      return total + (isNaN(releaseValue) ? 0 : releaseValue);
    }, 0) || 0;

  return (
    <Item
      variant="outline"
      className="bg-white border border-gray-400 rounded-lg p-4 hover:shadow-sm transition-colors mb-3"
    >
      {/* Header Section */}
      <ItemHeader className="pb-3 border-b border-gray-100 mb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-1.5 rounded-md">
              <Pill className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
                  #{no + 1}
                </span>
                <ItemTitle className="text-sm font-semibold text-gray-900 line-clamp-1">
                  {item.label}
                </ItemTitle>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge
                  variant={stockStatus.variant}
                  className="text-xs font-medium px-1.5 py-0.5"
                >
                  {stockStatus.label}
                </Badge>
                {isLowStock && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CircleAlert className="w-3 h-3 text-amber-500" />
                    </TooltipTrigger>
                    <TooltipContent className="p-2">
                      <p className="text-xs font-medium">
                        Low stock: {currentQuantity} units
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
          {isCompleted && (
            <Badge
              variant="default"
              className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs px-1.5 py-0.5"
            >
              <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
              Done
            </Badge>
          )}
        </div>
      </ItemHeader>

      <ItemContent className="space-y-4">
        {/* Stock Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs font-medium text-gray-700">
                Stock ({item.currentStock})
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">Total:</span>
              <span
                className={`text-xs font-semibold ${
                  isLowStock ? "text-amber-600" : "text-gray-900"
                }`}
              >
                {item.currentStock}
              </span>
            </div>
          </div>

          <div>
            {item.stocks.map((stockItem, n) => {
              const isExpired =
                stockItem.expireIn && new Date(stockItem.expireIn) < new Date();
              return (
                <div
                  key={stockItem.id}
                  className="flex items-center space-x-2 p-2 border border-gray-200 rounded hover:bg-gray-50 transition-colors mt-2"
                >
                  <Label className="flex-1 cursor-pointer text-xs">
                    <div className="w-full flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">
                            Lot {stockItem.id.slice(-4)}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-xs px-1 py-0"
                          >
                            {stockItem.quantity}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {stockItem.expireIn && (
                            <>
                              <Calendar className="w-2.5 h-2.5 text-gray-400" />
                              <span className="text-gray-500">
                                {formatPureDate(stockItem.expireIn)}
                              </span>
                              <span
                                className={`text-xs px-1 rounded ${
                                  isExpired
                                    ? "bg-red-100 text-red-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {isExpired ? "Expired" : "Valid"}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <FormField
                        control={control}
                        name={`prescribeMed.${no}.stocks.${n}.toRelease`}
                        disabled={
                          stockItem.quantity === "0" ||
                          isCompleted ||
                          isDisabled
                        }
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                min={1}
                                max={stockItem.quantity}
                                type="number"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </Label>
                </div>
              );
            })}

            {item.stocks.length === 0 && (
              <div className="text-center py-3 border border-dashed border-gray-300 rounded">
                <Package className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">No stock</p>
              </div>
            )}
          </div>
        </div>

        {/* Quantity Section */}
        <div className="bg-gray-50 rounded p-3 border border-gray-200">
          <div className="grid grid-cols-2 gap-3">
            {/* Prescribed Quantity */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">
                  Prescribed
                </span>
                <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">
                  Order
                </span>
              </div>
              <div className="p-2 bg-white border border-blue-100 rounded">
                <div className="text-base font-bold text-gray-900">
                  {item.prescribeQuantity}
                </div>
                <div className="text-xs text-gray-600">units</div>
              </div>
            </div>

            {/* Dispense Quantity */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">
                  Dispense
                </span>
                <span
                  className={`text-xs px-1 rounded ${
                    isDisabled
                      ? "bg-gray-100 text-gray-600"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  Issue
                </span>
              </div>
              <FormField
                control={control}
                name={`prescribeMed.${no}.quantity`}
                render={({ field: { onChange, value } }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Input
                          value={totalToRelease}
                          className={`text-sm font-semibold h-9 text-center rounded ${
                            isDisabled
                              ? "bg-gray-50 border-gray-200 text-gray-500"
                              : "border-emerald-200 bg-white text-emerald-700"
                          }`}
                          placeholder="0"
                          type="number"
                          onChange={onChange}
                          disabled={isDisabled}
                          min="0"
                          max={currentQuantity}
                        />
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">
                          units
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Low Stock Warning */}
          {isLowStock && !isCompleted && (
            <div className="mt-2 flex items-center gap-1.5 p-1.5 bg-amber-50 border border-amber-200 rounded">
              <CircleAlert className="w-3 h-3 text-amber-600 flex-shrink-0" />
              <span className="text-xs text-amber-700 font-medium">
                Low stock ({currentQuantity})
              </span>
            </div>
          )}
        </div>

        {/* Status Section */}
        <div>
          <span className="text-xs font-medium text-gray-700 mb-1.5 block">
            Status
          </span>
          <FormField
            control={control}
            name={`prescribeMed.${no}.remark`}
            render={({ field: { onChange, value } }) => (
              <FormItem>
                <FormControl>
                  <Select
                    onValueChange={onChange}
                    value={value}
                    disabled={isCompleted || isDisabled}
                  >
                    <SelectTrigger
                      className={`h-8 text-xs rounded ${
                        isDisabled
                          ? "bg-gray-50 border-gray-200 text-gray-500"
                          : ""
                      }`}
                    >
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="OK">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                          <span>Ready</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Pending">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                          <span>Pending</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="outofStock">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                          <span>Out of Stock</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>

        {/* Information Note */}
        <div className="p-2 bg-blue-50 rounded border border-blue-200">
          <div className="flex items-center gap-1.5">
            <CircleAlert className="w-3 h-3 text-blue-600 flex-shrink-0" />
            <span className="text-xs text-blue-700">
              {isCompleted
                ? "✓ Dispensed"
                : isLowStock
                ? `⚠ Low stock (${currentQuantity} units)`
                : "✓ Verify before dispensing"}
            </span>
          </div>
        </div>
      </ItemContent>
    </Item>
  );
};

export default memo(DispensaryMedItem);
