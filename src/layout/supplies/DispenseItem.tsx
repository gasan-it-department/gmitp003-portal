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
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import SearchUser from "../SearchUser";
import SearchUnit from "../SearchUnit";
//
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
//schema and interfaces
import { DispenseItemSchema } from "@/interface/zod";
import {
  type DispenseItemProps,
  type SupplyStockTrack,
} from "@/interface/data";
interface Props {
  item: SupplyStockTrack;
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
      quantity: "0",
      toAccount: true,
      address: "user",
    },
  });

  const {
    handleSubmit,
    watch,
    control,
    formState: { isSubmitting },
    setValue,
  } = form;
  const toAccount = watch("toAccount", true);
  const address = watch("address");

  useEffect(() => {
    if (!toAccount) {
      setValue("unitId", undefined);
      setValue("userId", undefined);
    }
  }, [toAccount]);

  const onSubmit = async (data: DispenseItemProps) => {
    try {
      const response = await axios.post(
        "/supply/dispense",
        {
          id: item.id,
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
        }
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
          {/* Header section */}
          <div className="mb-6">
            <p className="text-lg font-semibold mb-2">
              Cabinet - Stock: {item.stock} units
            </p>
            <div className="font-medium text-sm text-gray-600 dark:text-gray-400">
              <p>Current Stock: {item.stock}</p>
            </div>
          </div>

          {/* Form fields section */}
          <div className="space-y-6">
            <FormField
              name="quantity"
              rules={{
                required: true,
                minLength: 1,
                min: 0.1,
                max: item.stock,
              }}
              render={({ field: { onBlur, onChange, value } }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      value={value}
                      onBlur={onBlur}
                      onChange={onChange}
                      placeholder="Enter quantity"
                      min={0.1}
                      max={item.stock}
                      step="0.1"
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="toAccount"
              control={control}
              render={({ field: { value, onBlur, onChange } }) => (
                <FormItem className="flex items-center space-x-2 mt-4">
                  <FormControl>
                    <Checkbox
                      id="noUser"
                      onBlur={onBlur}
                      checked={value}
                      onCheckedChange={onChange}
                      className="h-5 w-5"
                    />
                  </FormControl>
                  <label
                    htmlFor="noUser"
                    className="font-medium text-sm cursor-pointer"
                  >
                    To Account
                  </label>
                </FormItem>
              )}
            />

            {toAccount && (
              <div className="space-y-4">
                <FormField
                  name="address"
                  render={({ field: { onBlur, onChange, value } }) => (
                    <FormItem className="mt-4">
                      <FormControl>
                        <RadioGroup
                          disabled={toAccount ? false : true}
                          className="flex space-x-4"
                          onValueChange={onChange}
                          onBlur={onBlur}
                          value={value}
                          defaultValue="user"
                        >
                          <FormItem className="flex items-center space-x-2 cursor-pointer">
                            <FormControl>
                              <RadioGroupItem value="user" />
                            </FormControl>
                            <FormLabel className="cursor-pointer">
                              User
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 cursor-pointer">
                            <FormControl>
                              <RadioGroupItem value="unit" />
                            </FormControl>
                            <FormLabel className="cursor-pointer">
                              Unit
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {address === "user" ? (
                  <FormField
                    name="userId"
                    render={({ field: { onChange, value } }) => (
                      <FormItem>
                        <FormLabel>To User</FormLabel>
                        <FormControl>
                          <SearchUser
                            lineId={lineId}
                            token={token}
                            onChange={onChange}
                            value={value}
                          />
                        </FormControl>
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
                        <FormLabel>To Unit</FormLabel>
                        <FormControl>
                          <SearchUnit
                            lineId={lineId}
                            token={token}
                            onChange={onChange}
                            value={value}
                          />
                        </FormControl>
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
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter remarks"
                      onBlur={onBlur}
                      onChange={onChange}
                      value={value}
                      className="min-h-[80px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </form>

        {/* Fixed footer with buttons */}
        <div className="sticky bottom-0 left-0 right-0 pt-6 mt-6 border-t bg-white dark:bg-gray-900">
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="min-w-[80px]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="min-w-[80px]"
            >
              {isSubmitting ? "Processing..." : "Confirm"}
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default DispenseItem;
