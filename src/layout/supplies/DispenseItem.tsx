import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axios from "@/db/axios";
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
import SearchUser from "../SearchUser";
import SearchUnit from "../SearchUnit";
import SelectStockDispense from "../SelectStockDispense";
import { Separator } from "@/components/ui/separator";
//
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
//schema and interfaces
import { DispenseItemSchema } from "@/interface/zod";
import { type DispenseItemProps, type SuppliesProps } from "@/interface/data";
import { Package } from "lucide-react";

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
    formState: { isSubmitting },
    setValue,
    setError,
  } = form;

  const toAccount = watch("toAccount", true);
  const address = watch("address");
  const stockId = watch("stockId");

  useEffect(() => {
    if (!toAccount) {
      setValue("unitId", undefined);
      setValue("userId", undefined);
    }
  }, [toAccount]);

  const onSubmit = async (data: DispenseItemProps) => {
    const quantity = parseInt(data.quantity, 10);

    if (!stockId) {
      return setError("root", { message: "Select stock" });
    }
    const selectedstock = item.SupplyStockTrack.find(
      (item) => item.id === stockId,
    );
    if (!selectedstock) {
      return setError("root", { message: "Invalid stock" });
    }
    if (quantity > selectedstock.stock) {
      return setError("quantity", { message: "Invalid quantity" });
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
        throw new Error(response.data.message);
      }
      await queryClient.invalidateQueries({
        queryKey: [queryKey, listId],
      });
      setOnOpen(0);
    } catch (error) {
      console.log(error);
    }
  };

  const handleCancel = () => {
    setOnOpen(0);
  };

  return (
    <div className="flex flex-col h-full">
      <Form {...form}>
        <form className="flex-1">
          {/* Header Section - Compact */}
          <div className="mb-4 pb-3 border-b">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md">
                <Package className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Dispense Item
                </p>
                <p className="text-xs text-gray-500">
                  Current Total Stock: {item.totalStock}
                </p>
              </div>
            </div>
          </div>

          {/* Form Fields Section - Compact */}
          <div className="space-y-4">
            <FormField
              control={control}
              name="stockId"
              rules={{
                required: true,
                minLength: 1,
                min: 0.1,
                max: item.totalStock,
              }}
              render={({ field: { onChange, value } }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700">
                    Select Stock *
                  </FormLabel>
                  <FormControl>
                    <SelectStockDispense
                      value={value}
                      onChange={onChange}
                      className="w-full"
                      items={item.SupplyStockTrack}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Choose the stock batch to dispense from
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="quantity"
              rules={{
                required: true,
                minLength: 1,
                min: 0.1,
                max: item.totalStock,
              }}
              render={({ field: { onBlur, onChange, value } }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700">
                    Quantity *
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      value={value}
                      onBlur={onBlur}
                      onChange={onChange}
                      placeholder="Enter quantity"
                      min={0.1}
                      max={item.totalStock}
                      step="0.1"
                      className="h-9 text-sm"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Max: {item.totalStock} units
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <FormField
              name="toAccount"
              control={control}
              render={({ field: { value, onBlur, onChange } }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 bg-gray-50 rounded-md">
                  <FormControl>
                    <Checkbox
                      id="toAccount"
                      onBlur={onBlur}
                      checked={value}
                      onCheckedChange={onChange}
                      className="h-4 w-4 mt-0.5"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-medium cursor-pointer">
                      Dispense to Account
                    </FormLabel>
                    <p className="text-xs text-gray-500">
                      Assign to a user or unit account
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {toAccount && (
              <div className="space-y-4 pl-2 border-l-2 border-blue-200 ml-1">
                <FormField
                  control={control}
                  name="address"
                  render={({ field: { onBlur, onChange, value } }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-semibold text-gray-700">
                        Recipient Type
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          disabled={toAccount ? false : true}
                          className="flex gap-4"
                          onValueChange={onChange}
                          onBlur={onBlur}
                          value={value}
                          defaultValue="user"
                        >
                          <div className="flex items-center space-x-2 cursor-pointer">
                            <RadioGroupItem value="user" id="user" />
                            <FormLabel
                              htmlFor="user"
                              className="text-sm cursor-pointer"
                            >
                              User
                            </FormLabel>
                          </div>
                          <div className="flex items-center space-x-2 cursor-pointer">
                            <RadioGroupItem value="unit" id="unit" />
                            <FormLabel
                              htmlFor="unit"
                              className="text-sm cursor-pointer"
                            >
                              Unit
                            </FormLabel>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {address === "user" ? (
                  <FormField
                    control={control}
                    name="userId"
                    render={({ field: { onChange, value } }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700">
                          Select User *
                        </FormLabel>
                        <FormControl>
                          <SearchUser
                            lineId={lineId}
                            token={token}
                            onChange={onChange}
                            value={value}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Choose the user receiving this item
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={control}
                    name="unitId"
                    render={({ field: { onChange, value } }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-gray-700">
                          Select Unit *
                        </FormLabel>
                        <FormControl>
                          <SearchUnit
                            lineId={lineId}
                            token={token}
                            onChange={onChange}
                            value={value}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Choose the unit receiving this item
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            <FormField
              name="desc"
              control={control}
              render={({ field: { value, onBlur, onChange } }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700">
                    Remarks
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any additional notes or remarks..."
                      onBlur={onBlur}
                      onChange={onChange}
                      value={value}
                      className="min-h-[80px] text-sm resize-none"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Optional: Add any relevant information
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </form>

        {/* Fixed Footer */}
        <div className="sticky bottom-0 left-0 right-0 pt-4 mt-6 border-t bg-white">
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="h-9 px-4 text-sm"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="h-9 px-4 text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                  Processing...
                </div>
              ) : (
                "Confirm Dispense"
              )}
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default DispenseItem;
