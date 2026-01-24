import { memo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
//
import { removeStockInlist } from "@/db/statements/supply";
//components and layout
import { TableRow, TableCell } from "@/components/ui/table";
import Modal from "@/components/custom/Modal";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import DispenseItem from "../DispenseItem";
//utils
import { searchedChar } from "@/utils/element";

//
import { CircleX, HandHelping, Package } from "lucide-react";
//interfaces and Props
import type { SupplyStockTrack, ProtectedRouteProps } from "@/interface/data";

interface Props {
  item: SupplyStockTrack;
  index: number;
  query: string;
  lineId: string;
  listId: string;
  containerId: string;
  auth: ProtectedRouteProps;
}

const ListItem = ({
  item,
  index,
  query,
  containerId,
  lineId,
  listId,
  auth,
}: Props) => {
  const [onOpen, setOnOpen] = useState(0);

  const queryClient = useQueryClient();

  const stockStatus = item.stock > 10 ? "Good" : "Low";
  const stockColor = item.stock < 10 ? "text-red-600" : "text-green-600";
  const stockBgColor = item.stock < 10 ? "bg-red-50" : "bg-green-50";

  const handleRemove = useMutation({
    mutationFn: () =>
      removeStockInlist(
        item.id,
        auth.userId as string,
        lineId,
        listId,
        containerId,
        auth.token as string
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["supply-list", listId],
        refetchType: "active",
      });
    },
    onError: (err) => {
      toast.error("FAILED TO SUBMIT", {
        description: err.message,
      });
    },
  });

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-slate-50 transition-colors duration-150 border-b border-slate-100"
        onClick={() => setOnOpen(1)}
      >
        <TableCell className="py-3 px-4 text-slate-500 font-medium">
          {index}
        </TableCell>
        <TableCell className="py-3 px-4 font-mono text-sm text-slate-700">
          {item.supply.code || "N/A"}
        </TableCell>
        <TableCell className="py-3 px-4 font-medium text-slate-900">
          {searchedChar(query, item.supply.item)}
        </TableCell>
        {/* <TableCell className="py-3 px-4 text-slate-600">
            {item.brand.length > 0 ? (
              <span className="inline-flex items-center gap-1">
                {item.brand.map((brand, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 bg-slate-100 rounded"
                  >
                    {brand.brand}
                  </span>
                ))}
              </span>
            ) : (
              <span className="text-slate-400">-</span>
            )}
          </TableCell> */}
        <TableCell className="py-3 px-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                item.stock > 10 ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <span className="font-semibold">{item.stock}</span>
          </div>
        </TableCell>
        <TableCell className="py-3 px-4">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${stockBgColor} ${stockColor}`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                item.stock > 10 ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <span className="font-medium text-sm">{stockStatus}</span>
          </div>
        </TableCell>
      </TableRow>

      <Modal
        title="Item Details"
        onOpen={onOpen === 1}
        className="max-w-md"
        loading={handleRemove.isPending}
        setOnOpen={() => {
          setOnOpen(0);
        }}
        cancelTitle="Close"
      >
        <div className="space-y-6">
          {/* Header with item info */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-slate-900">
                  {item.supply.item}
                </h3>
                <p className="text-sm text-slate-500">
                  Ref: {item.supply.refNumber || "N/A"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <p className="text-slate-500">Current Stock</p>
                <p
                  className={`text-lg font-bold ${
                    item.stock < 10 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {item.stock} units
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-500">Status</p>
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${stockBgColor}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      item.stock > 10 ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></div>
                  <span className="font-medium">{stockStatus}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            {/* <Button
              variant="outline"
              className="w-full justify-start gap-3 py-6 text-slate-700 hover:text-slate-900 hover:bg-slate-50"
            >
              <Info className="w-4 h-4" />
              <div className="text-left">
                <p className="font-medium">View Full Details</p>
                <p className="text-xs text-slate-500">
                  Complete item information and history
                </p>
              </div>
            </Button> */}

            <Button
              variant="outline"
              className="w-full justify-start gap-3 py-6 text-blue-700 hover:text-blue-900 hover:bg-blue-50"
              onClick={() => setOnOpen(3)}
            >
              <HandHelping className="w-4 h-4" />
              <div className="text-left">
                <p className="font-medium">Dispense Item</p>
                <p className="text-xs text-slate-500">
                  Record item distribution
                </p>
              </div>
            </Button>

            <Button
              variant="destructive"
              className="w-full justify-start gap-3 py-6 cursor-pointer"
              onClick={() => setOnOpen(4)}
            >
              <CircleX className="w-4 h-4" />
              <div className="text-left">
                <p className="font-medium">Remove Item</p>
                <p className="text-xs text-gray-200">
                  Permanently delete from inventory
                </p>
              </div>
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        title="Remove Item"
        onOpen={onOpen === 4}
        className="max-w-md"
        footer={1}
        setOnOpen={() => {
          if (handleRemove.isPending) return;
          setOnOpen(0);
        }}
        onFunction={() => {
          handleRemove.mutateAsync();
        }}
      >
        <div className="space-y-6">
          {/* Warning Icon and Message */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-3 bg-red-100 rounded-full">
              <CircleX className="w-8 h-8 text-red-600" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-900">
                Confirm Removal
              </h3>
              <p className="text-sm text-slate-600">
                Are you sure you want to remove this item from inventory? This
                action cannot be undone.
              </p>
            </div>
          </div>

          {/* Item Details (optional, helps user confirm) */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Item:</span>
              <span className="font-medium text-slate-900">
                {item.supply.item}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Reference:</span>
              <span className="font-mono text-sm text-slate-700">
                {item.supply.refNumber || "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Current Stock:</span>
              <span
                className={`font-semibold ${
                  item.stock < 10 ? "text-red-600" : "text-green-600"
                }`}
              >
                {item.stock} units
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 border-slate-300 hover:bg-slate-50"
              onClick={() => {
                if (handleRemove.isPending) return;
                setOnOpen(0);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (handleRemove.isPending) return;
                // Add your remove item function here
                handleRemove.mutateAsync();
                console.log("Removing item:", item);
                setOnOpen(0);
              }}
            >
              Remove Item
            </Button>
          </div>

          {/* Warning Note */}
          <div className="text-xs text-slate-500 text-center pt-2">
            Note: This will permanently delete all records associated with this
            item.
          </div>
        </div>
      </Modal>

      <Modal
        title={undefined}
        onOpen={onOpen === 3}
        footer={1}
        className={" overflow-auto"}
        setOnOpen={function (): void | Promise<void> {
          throw new Error("Function not implemented.");
        }}
      >
        <DispenseItem
          queryKey="supply-list"
          item={item}
          lineId={lineId}
          userId={auth.userId as string}
          token={auth.token as string}
          setOnOpen={() => setOnOpen(0)}
          listId={listId}
          containerId={containerId}
        />
      </Modal>
    </>
  );
};

export default memo(ListItem);
