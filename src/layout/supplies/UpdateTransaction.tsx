import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/db/axios";
//

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Modal from "@/components/custom/Modal";
import {
  Form,
  FormControl,
  FormItem,
  FormMessage,
  FormLabel,
  FormField,
  FormDescription,
} from "@/components/ui/form";
import SearchUnit from "../SearchUnit";
//import SearchUser from "../SearchUser";
import { Edit2 } from "lucide-react";

//
import type {
  SupplyDispenseRecordProps,
  UpdateTransactionProps,
} from "@/interface/data"; //ash bading
import { UpdateTransactionSchema } from "@/interface/zod";

interface Props {
  item: SupplyDispenseRecordProps;
  userId: string;
  token: string;
  lineId: string;
}

const UpdateTransaction = ({ item, userId, token, lineId }: Props) => {
  const [onOpen, setOnOpen] = useState(0);

  const form = useForm<UpdateTransactionProps>({
    resolver: zodResolver(UpdateTransactionSchema),
    defaultValues: {
      unitId: item.departmentId || undefined,
      userId: item.userId || undefined,
      quantity: "0",
      toAccount: item.departmentId || item.userId ? true : false,
    },
  });

  const {
    formState: { isSubmitting },
    handleSubmit,
    setError,
    control,
    watch,
  } = form;

  const toAccount = watch("toAccount");
  const address = watch("address");

  const onSubmit = async (data: UpdateTransactionProps) => {
    let toUpdate: any = {};
    let haveUpdate = 0;

    if (!userId) return;

    try {
      if (data.unitId && data.unitId !== item.departmentId) {
        toUpdate.unitId = data.unitId;
        haveUpdate += 1;
      }
      if (data.userId && data.userId !== item.userId) {
        toUpdate.userId = data.userId;
        haveUpdate += 1;
      }
      if (data.quantity && data.quantity !== item.quantity) {
        toUpdate.quantity = data.quantity;
        haveUpdate += 1;
      }

      if (haveUpdate === 0) {
        throw new Error("Update something");
      }

      const response = await axios.patch(
        "/supply/transaction/update",
        { ...toUpdate },
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

      setOnOpen(0);
    } catch (error) {
      setError("root", { message: (error as Error).message });
    }
  };
  return (
    <>
      <Button onClick={() => setOnOpen(1)} size="sm">
        <Edit2 />
        Edit
      </Button>
      <Modal
        onFunction={handleSubmit(onSubmit)}
        title={undefined}
        onOpen={onOpen === 1}
        className={""}
        setOnOpen={() => {
          setOnOpen(0);
        }}
        loading={isSubmitting}
      >
        <div>
          <Form {...form}>
            <FormField
              control={control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

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
                          <SearchUnit
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
          </Form>
        </div>
      </Modal>
    </>
  );
};

export default UpdateTransaction;
