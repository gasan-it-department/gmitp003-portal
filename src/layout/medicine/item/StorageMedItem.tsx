import { memo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
//import axios from "@/db/axios";
import { useQueryClient, useMutation } from "@tanstack/react-query";

//
import { removeStock } from "@/db/statements/supply";

import { formatPureDate } from "@/utils/date";
import { TableRow, TableCell } from "@/components/ui/table";
import Modal from "@/components/custom/Modal";
import CollapseMedicineStock from "../CollapseMedicineStock";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { toast } from "sonner";
//icons
import { FolderSync, Package, AlertTriangle } from "lucide-react";

//interface/schema/props
import type {
  Medicine,
  ProtectedRouteProps,
  TransferMedStorageProps,
} from "@/interface/data";
import { TransferMedStorageSchema } from "@/interface/zod";
import SelectStorage from "@/layout/SelectStorage";
import { Input } from "@/components/ui/input";

interface Props {
  item: Medicine;
  no: number;
  onMultiSelect: boolean;
  lineId: string;
  auth: ProtectedRouteProps;
  storageId: string;
}

const StorageMedItem = ({
  item,
  no,
  onMultiSelect,
  lineId,
  auth,
  storageId,
}: Props) => {
  const [onOpen, setOnOpen] = useState(0);
  const queryClient = useQueryClient();
  const currentDate = new Date().toISOString();

  // Determine status color
  const getStatusColor = () => {
    if (item.totalStock <= 0) return "bg-red-100 text-red-800 border-red-200";
    if (item.totalStock < 10)
      return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-green-100 text-green-800 border-green-200";
  };

  const getExpirationCountStatus = () => {
    if (!item.stockToExpire) return "border-gray-300 bg-white";

    if (item.stockToExpire > 0) return "border-red-300 bg-red-50";
    return "border-gray-300";
  };

  const getExpirationStatus = (exp: string | undefined) => {
    if (exp && exp > currentDate) return "border-gray-300";
    else {
      return "border-red-300 bg-red-50";
    }
  };

  const transferForm = useForm<TransferMedStorageProps>({
    resolver: zodResolver(TransferMedStorageSchema),
    defaultValues: {
      quantity: "0",
    },
  });

  // const handleTransfer = async (data: TransferMedStorageProps) => {
  //   if (!auth.userId) throw new Error("");
  //   const quantity = parseInt(data.quantity, 10);
  //   const actualQuantity = item.perQuantity * quantity;
  //   if (actualQuantity > item.actualStock) {
  //     return transferForm.setError("quantity", { message: "INVALID QUANTITY" });
  //   }
  //   try {
  //     const response = await axios.patch(
  //       "/medicine/transfer",
  //       {
  //         departId: data.departId,
  //         quantity: parseInt(data.quantity, 10),
  //         fromId: item.medicineStorageId,
  //         userId: auth.userId,
  //         stockId: item.id,
  //       },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${auth.token}`,
  //           "Content-Type": "application/json",
  //           Accept: "application/json",
  //           "X-Requested-With": "XMLHttpRequest",
  //           "Cache-Control": "no-cache, no-store, must-revalidate",
  //         },
  //       },
  //     );

  //     if (response.status !== 200) {
  //       throw new Error(response.data.message);
  //     }
  //     await queryClient.invalidateQueries({
  //       queryKey: ["medStorage-list", item.medicineStorageId],
  //     });
  //     toast.success("Successfully transfered");
  //     setOnOpen(0);
  //   } catch (error) {
  //     console.log(error);

  //     toast.error("FAILED TO SUBMIT");
  //   }
  // };

  const handleRemoveStock = useMutation({
    mutationFn: () =>
      removeStock(auth.token as string, item.id, auth.userId as string),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        //queryKey: ["medStorage-list", item.medicineStorageId],
      });
      setOnOpen(0);
    },
    onError: (error) => {
      toast.error("FAILED TO SUBMIT", {
        description: error.message,
      });
    },
  });

  return (
    <>
      <TableRow
        className="hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => setOnOpen(1)}
      >
        {onMultiSelect && (
          <TableCell className="w-12">
            <div className="flex items-center justify-center">
              <Checkbox className="border-gray-300" />
            </div>
          </TableCell>
        )}

        <TableCell className="font-medium text-gray-700 text-center">
          {no}
        </TableCell>

        <TableCell>
          <div className="font-mono text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block">
            {item.serialNumber}
          </div>
        </TableCell>

        <TableCell>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-500" />
            <span className="font-medium">{item.name}</span>
          </div>
        </TableCell>

        <TableCell>
          <div className="flex items-center justify-between">
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor()}`}
            >
              {item.totalStock}
            </span>
          </div>
        </TableCell>

        {/* <TableCell className="text-gray-600">
          <div className="space-y-1">
            <div className="font-medium">{item.quality}</div>
            <div className="text-xs text-gray-500">
              Per Unit: {item.perQuantity}
            </div>
          </div>
        </TableCell> */}

        <TableCell>
          <div
            className={`px-3 py-2 rounded border ${getExpirationCountStatus()}`}
          >
            <span>{item.stockToExpire}</span>
          </div>
        </TableCell>

        <TableCell>
          <Badge className="font-medium">
            {item.totalStock <= 0
              ? "Out of Stock"
              : item.totalStock < 10
                ? "Low Stock"
                : "In Stock"}
          </Badge>
        </TableCell>
      </TableRow>

      <Modal
        title={item.name}
        onOpen={onOpen === 1}
        setOnOpen={() => setOnOpen(0)}
        className="max-w-md w-full max-h-[90vh]"
      >
        <div className="space-y-3 p-0 w-full">
          {/* Stock Information Section */}
          <div className="bg-gray-50 rounded-md p-3 w-full">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Serial Number</p>
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {item.serialNumber}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Current Stock</p>
                <p className="text-lg font-bold text-gray-900">
                  {item.totalStock}
                </p>
              </div>

              <div className="col-span-2">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  All Stocks
                </p>
                <div className="w-full flex flex-col gap-1.5 max-h-[200px] overflow-auto">
                  {item.MedicineStock.map((stock, i) => (
                    <div
                      key={stock.id}
                      className={`w-full rounded border p-2 ${getExpirationStatus(stock.expiration as string | undefined)}`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium">
                          {i + 1}. Total: {stock.actualStock} | Unit:{" "}
                          {stock.perQuantity}/{stock.quality}
                        </span>
                        <p className="text-[10px] text-gray-500">
                          Exp: {formatPureDate(stock.expiration as string)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              variant="outline"
              className="w-full justify-start gap-2 h-9 text-sm"
              onClick={() => setOnOpen(2)}
            >
              <FolderSync className="h-3.5 w-3.5" />
              Transfer to Another Storage
            </Button>
            <CollapseMedicineStock
              stocks={item.MedicineStock}
              token={auth.token as string}
              userId={auth.userId as string}
              id={item.id}
              queryClient={queryClient}
              storageId={storageId}
            />
          </div>
        </div>
      </Modal>

      <Modal
        title="Transfer Medicine"
        onOpen={onOpen === 2}
        setOnOpen={() => {
          if (handleRemoveStock.isPending) return;
          setOnOpen(0);
        }}
        className="max-w-md overflow-auto"
        // onFunction={transferForm.handleSubmit(handleTransfer)}
        loading={transferForm.formState.isSubmitting}
        footer={true}
      >
        <div className="space-y-6">
          {/* Current Stock Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Available Stock</p>
                <p className="text-xl font-semibold text-gray-800">
                  {item.totalStock}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Quality</p>
                {/* <p className="text-lg font-medium text-gray-800">
                  {item.quality}
                </p> */}
              </div>
              <div>
                <p className="text-sm text-gray-500">Per Quantity</p>
                {/* <p className="text-lg font-medium text-gray-800">
                  {item.perQuantity}
                </p> */}
              </div>
              <div>
                <p className="text-sm text-gray-500">Serial</p>
                {/* <p className="font-mono text-blue-600">
                  {item.medicine.serialNumber}
                </p> */}
              </div>
            </div>
          </div>

          {/* Transfer Form */}
          <Form {...transferForm}>
            <div className="space-y-4">
              <FormField
                control={transferForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Transfer Quantity
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        max={item.totalStock}
                        placeholder="Enter amount"
                        className="h-11"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={transferForm.control}
                name="departId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Destination Storage
                    </FormLabel>
                    <FormControl>
                      <SelectStorage
                        onChange={field.onChange}
                        lineId={lineId}
                        currentValue={field.value}
                        token={auth.token as string}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </Form>
        </div>
      </Modal>

      <Modal
        title="Remove Medicine"
        onOpen={onOpen === 3}
        setOnOpen={() => setOnOpen(0)}
        className="max-w-md"
        footer={1}
        loading={handleRemoveStock.isPending}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800">
                Warning: Destructive Action
              </p>
              <p className="text-sm text-red-600 mt-0.5">
                This will permanently delete all stock data associated with this
                medicine.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">
              You are about to remove:
            </h4>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              This action cannot be undone. All stock records, expiration dates,
              and quantity data will be permanently deleted.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setOnOpen(0)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                if (handleRemoveStock.isPending) return;
                handleRemoveStock.mutateAsync();
              }}
            >
              Remove Medicine
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default memo(StorageMedItem);
