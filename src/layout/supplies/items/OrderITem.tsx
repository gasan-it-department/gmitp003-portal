import { useState, memo, useEffect, useCallback } from "react";
import { useAuth } from "@/provider/ProtectedRoute";
import { useParams } from "react-router";
import { useForm } from "react-hook-form";
import { useInView } from "react-intersection-observer";
//db and statements
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteOrderItem, updateOrderItem } from "@/db/statement";
//
import { TableRow, TableCell } from "@/components/ui/table";
import Modal from "@/components/custom/Modal";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
//props and Interfaces
import { type SupplyOrder, type UpdateOrderItenProps } from "@/interface/data";
import { UpdateOrderItenSchema } from "@/interface/zod";

//icons
import { Pencil, Trash2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  item: SupplyOrder;
  index: number;
  handleRefetch: () => Promise<void>;
  status: number;
}

const OrderITem = ({ index, item, handleRefetch, status }: Props) => {
  const [onOpen, setOnOpen] = useState(0);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const auth = useAuth();
  const queryClient = useQueryClient();
  const { containerId, orderId } = useParams();

  const form = useForm({
    resolver: zodResolver(UpdateOrderItenSchema),
    defaultValues: {
      quantity: item.quantity.toString(),
      desc: item.desc,
    },
  });
  const {
    handleSubmit,
    formState: { isSubmitting, errors },
    control,
    reset,
  } = form;

  const removeItem = useMutation({
    mutationFn: () =>
      deleteOrderItem(
        auth.token as string,
        item.id,
        auth.userId as string,
        containerId as string,
        orderId as string
      ),
    onError: (err) => {
      console.log(err);
      toast.error("Failed to remove this item", {
        description: err.message,
        closeButton: false,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["order-items", orderId],
        refetchType: "active",
      });
      setOnOpen(0);
    },
  });

  const onSubmit = async (data: UpdateOrderItenProps) => {
    try {
      await updateOrderItem(
        auth.token as string,
        item.id,
        auth.userId as string,
        containerId as string,
        data.quantity,
        data.desc
      );
      await queryClient.invalidateQueries({
        queryKey: ["order-items", orderId],
        refetchType: "all",
      });
      setOnOpen(0);
    } catch (error) {
      console.log(error);
      toast.error("Failed to update", {
        description: `${error}`,
        closeButton: false,
        position: "top-right",
      });
    }
  };
  const number = index + 1;

  const { ref, inView } = useInView();

  // Check if popover should be disabled
  const isPopoverDisabled = status === 2;

  // Handle popover item clicks
  const handlePopoverAction = useCallback((modalNumber: number) => {
    setPopoverOpen(false);
    setTimeout(() => {
      setOnOpen(modalNumber);
    }, 50);
  }, []);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setOnOpen(0);
    reset(); // Reset form when modal closes
  }, [reset]);

  // Close popover when modal opens
  useEffect(() => {
    if (onOpen !== 0) {
      setPopoverOpen(false);
    }
  }, [onOpen]);

  // Handle infinite scroll
  useEffect(() => {
    if (number % 20 === 0 && inView) {
      handleRefetch();
    }
  }, [inView, number, handleRefetch]);

  // Handle row click for opening popover - disabled when status is 2
  const handleRowClick = useCallback(
    (e: React.MouseEvent) => {
      if (isPopoverDisabled) return;

      if (e.type === "contextmenu" || (e.type === "click" && e.ctrlKey)) {
        e.preventDefault();
        setPopoverOpen(true);
      }
    },
    [isPopoverDisabled]
  );

  // Wrapper component for TableRow based on popover state
  const TableRowWrapper = isPopoverDisabled ? (
    <TableRow
      className="hover:bg-neutral-50 cursor-default"
      ref={number % 20 === 0 ? ref : null}
    >
      <TableCell className="w-12 p-4">{index + 1}</TableCell>
      <TableCell className="p-4 min-w-48">{item.supply.item}</TableCell>
      <TableCell className="max-w-8 truncate min-w-64">
        {item.desc ?? "N/A"}
      </TableCell>
      <TableCell className="p-4 min-w-32">{item.quantity}</TableCell>
      <TableCell className="p-4 min-w-32">{item.status}</TableCell>
    </TableRow>
  ) : (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <TableRow
          className="hover:bg-neutral-200 cursor-pointer group"
          ref={number % 20 === 0 ? ref : null}
          onClick={handleRowClick}
          onContextMenu={handleRowClick}
        >
          <TableCell className="w-12 p-4">{index + 1}</TableCell>
          <TableCell className="p-4 min-w-48">{item.supply.item}</TableCell>
          <TableCell className="max-w-8 truncate min-w-64">
            {item.desc ?? "N/A"}
          </TableCell>
          <TableCell className="p-4 min-w-32">{item.quantity}</TableCell>
          <TableCell className="p-4 min-w-32">{item.status}</TableCell>
        </TableRow>
      </PopoverTrigger>
      <PopoverContent
        className="w-48 p-2"
        align="end"
        onCloseAutoFocus={(e) => e.preventDefault()}
        onEscapeKeyDown={() => setPopoverOpen(false)}
        sideOffset={5}
      >
        <div className="flex flex-col space-y-1">
          <div className="px-2 py-1.5 text-sm font-semibold border-b">
            {item.supply.item}
          </div>
          <Button
            variant="ghost"
            className="justify-start w-full hover:bg-accent"
            onClick={() => handlePopoverAction(2)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Update
          </Button>
          <Button
            variant="ghost"
            className="justify-start w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => handlePopoverAction(1)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remove
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <>
      {TableRowWrapper}

      {/* Remove Item Modal - only show if popover is not disabled */}
      {!isPopoverDisabled && (
        <Modal
          title={"Item: " + item.supply.item}
          onOpen={onOpen === 1}
          setOnOpen={handleModalClose}
          className="max-w-md"
          onFunction={() => removeItem.mutateAsync()}
          loading={removeItem.isPending}
          footer={true}
          yesTitle="Remove"
        >
          <div className="w-full">
            <p className="font-medium text-sm text-orange-500">
              Are you sure you want to remove this item?
            </p>
            <div className="mt-4 bg-destructive/5 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm font-medium text-destructive">
                Item will be permanently removed from this order
              </p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1 list-disc pl-4">
                <li>Item: {item.supply.item}</li>
                <li>Quantity: {item.quantity}</li>
                {item.desc && <li>Description: {item.desc}</li>}
              </ul>
            </div>
          </div>
        </Modal>
      )}

      {/* Update Item Modal - only show if popover is not disabled */}
      {!isPopoverDisabled && (
        <Modal
          title={"Update " + item.supply.item}
          onOpen={onOpen === 2}
          setOnOpen={handleModalClose}
          className="max-w-md"
          footer={true}
          yesTitle="Save"
          onFunction={handleSubmit(onSubmit)}
          loading={isSubmitting || removeItem.isPending}
        >
          <Form {...form}>
            <div className="space-y-4">
              <FormField
                name="quantity"
                control={control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        disabled={isSubmitting}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? "0" : value);
                        }}
                      />
                    </FormControl>
                    {errors.quantity && (
                      <FormMessage>{errors.quantity.message}</FormMessage>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                name="desc"
                control={control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        disabled={isSubmitting}
                        className="max-h-32 min-h-24"
                        placeholder="Enter item description..."
                      />
                    </FormControl>
                    {errors.desc && (
                      <FormMessage>{errors.desc.message}</FormMessage>
                    )}
                  </FormItem>
                )}
              />
            </div>
          </Form>
        </Modal>
      )}
    </>
  );
};

export default memo(OrderITem);
