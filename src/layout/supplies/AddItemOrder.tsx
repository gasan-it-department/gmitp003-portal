import { type SuppliesProps } from "@/interface/data";
import axios from "@/db/axios";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormMessage,
  FormItem,
  FormField,
  FormLabel,
} from "@/components/ui/form";
import { toast } from "sonner";
import { AddItemOrderSchema } from "@/interface/zod";
import { type AddItemOrderProps } from "@/interface/data";
//
import { useForm } from "react-hook-form";
import { useAuth } from "@/provider/ProtectedRoute";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ShoppingCart,
  Package,
  X,
  Hash,
  FileText,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  selected: SuppliesProps | null;
  setSelected: React.Dispatch<React.SetStateAction<SuppliesProps | null>>;
}

const AddItemOrder = ({ setSelected, selected }: Props) => {
  const auth = useAuth();
  const { orderId } = useParams();
  const queryClient = useQueryClient();

  const form = useForm<AddItemOrderProps>({
    resolver: zodResolver(AddItemOrderSchema),
    defaultValues: {
      quantity: "",
      desc: "",
      unit: "",
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = form;

  const handleClear = () => {
    setSelected(null);
    reset();
  };

  const onSubmit = async (data: AddItemOrderProps) => {
    if (!auth.token) {
      return toast.warning("Authentication required", {
        description: "Please sign in again",
      });
    }
    if (!selected) {
      return toast.warning("No item selected", {
        description: "Please select an item first",
      });
    }
    try {
      const response = await axios.post(
        "/add-item-order",
        {
          quanlity: data.quantity,
          desc: data.desc,
          supplyId: selected.id,
          orderId,
        },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        }
      );

      if (response.status !== 200) {
        throw new Error(response.data.message || "Failed to add item");
      }

      await queryClient.invalidateQueries({
        queryKey: ["order-items", orderId],
      });

      toast.success("Item added to order", {
        description: `${data.quantity} x ${selected.item} has been added`,
      });

      handleClear();
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to add item", {
        description: error.message || "Please try again",
      });
    }
  };

  if (!selected) {
    return null;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Add to Order</h3>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium truncate">{selected.item}</h4>
              {selected.description && (
                <p className="text-xs text-muted-foreground truncate">
                  {selected.description}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {selected.code && (
            <Badge variant="outline" className="text-xs">
              Code: {selected.code}
            </Badge>
          )}
          {/* {selected.category && (
            <Badge variant="secondary" className="text-xs">
              {selected.quantity}
            </Badge>
          )} */}
          <Badge
            variant={selected.consumable ? "default" : "outline"}
            className="text-xs"
          >
            {selected.consumable ? "Consumable" : "Non-Consumable"}
          </Badge>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-auto p-4">
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Quantity */}
            <FormField
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Quantity
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="Enter quantity"
                        type="number"
                        min="1"
                        step="1"
                        className="pr-12"
                        {...field}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-sm text-muted-foreground">
                          units
                        </span>
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs">
                    Enter the number of units needed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              name="desc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Description (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes, specifications, or special requirements..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Additional details about this order item
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Summary */}
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Order Summary</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Item:</span>
                <span className="font-medium truncate">{selected.item}</span>

                <span className="text-muted-foreground">Type:</span>
                <span>
                  {selected.consumable ? "Consumable" : "Non-Consumable"}
                </span>

                {selected.code && (
                  <>
                    <span className="text-muted-foreground">Code:</span>
                    <span className="font-mono">{selected.code}</span>
                  </>
                )}
              </div>
            </div>
          </form>
        </Form>
      </div>

      {/* Footer Actions */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleClear}
            className="flex-1"
            disabled={isSubmitting}
          >
            Clear
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="flex-1 gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                Add to Order
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddItemOrder;
