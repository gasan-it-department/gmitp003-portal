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
//import ConfirmDelete from "@/layout/ConfirmDelete";
import SelectStockDispense from "@/layout/SelectStockDispense";
//utils
import { searchedChar } from "@/utils/element";

//
import { CircleX, HandHelping, Package, ChevronRight } from "lucide-react";
//interfaces and Props
import type { SuppliesProps, ProtectedRouteProps } from "@/interface/data";

interface Props {
  item: SuppliesProps;
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
  const [itemId, setItemId] = useState("");

  const queryClient = useQueryClient();

  const stockStatus = item.totalStock > 10 ? "Good" : "Low";
  const stockColor = item.totalStock < 10 ? "text-red-600" : "text-green-600";
  const stockBgColor = item.totalStock < 10 ? "bg-red-50" : "bg-green-50";

  const handleRemove = useMutation({
    mutationFn: () =>
      removeStockInlist(
        itemId,
        auth.userId as string,
        lineId,
        listId,
        containerId,
        auth.token as string,
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
        className="cursor-pointer hover:bg-gray-50 transition-colors group"
        onClick={() => setOnOpen(1)}
      >
        <TableCell className="py-2 text-xs text-gray-500 font-medium w-12">
          {index}
        </TableCell>
        <TableCell className="py-2 text-sm font-medium text-gray-800">
          {searchedChar(query, item.item)}
        </TableCell>
        <TableCell className="py-2">
          <div className="flex items-center gap-1.5">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                item.totalStock > 10 ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <span className="text-sm font-semibold text-gray-700">
              {item.totalStock}
            </span>
          </div>
        </TableCell>
        <TableCell className="py-2">
          <div
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${stockBgColor} ${stockColor} text-xs font-medium`}
          >
            <div
              className={`w-1 h-1 rounded-full ${
                item.totalStock > 10 ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <span>{stockStatus}</span>
          </div>
        </TableCell>
      </TableRow>

      {/* Item Details Modal - Compact */}
      <Modal
        title={item.item}
        onOpen={onOpen === 1}
        className="max-w-md w-[90vw]"
        loading={handleRemove.isPending}
        setOnOpen={() => {
          setOnOpen(0);
        }}
        cancelTitle="Close"
      >
        <div className="space-y-4 p-1">
          {/* Stock Info Card */}
          <div className="bg-gray-50 rounded-md p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-md">
                <Package className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Reference</p>
                <p className="text-xs font-mono text-gray-600">
                  {item.refNumber || "N/A"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
              <div>
                <p className="text-[10px] text-gray-500">Current Stock</p>
                <p className={`text-base font-bold ${stockColor}`}>
                  {item.totalStock} units
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Status</p>
                <div
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${stockBgColor} text-xs font-medium ${stockColor}`}
                >
                  <div
                    className={`w-1 h-1 rounded-full ${
                      item.totalStock > 10 ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></div>
                  {stockStatus}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-between gap-3 py-2 h-auto text-blue-700 hover:text-blue-900 hover:bg-blue-50 border-blue-200"
              onClick={() => setOnOpen(3)}
            >
              <div className="flex items-center gap-2">
                <HandHelping className="w-3.5 h-3.5" />
                <div className="text-left">
                  <p className="text-sm font-medium">Dispense Item</p>
                  <p className="text-[10px] text-blue-500">
                    Record item distribution
                  </p>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>

            <Button
              variant="destructive"
              className="w-full justify-between gap-3 py-2 h-auto"
              onClick={() => setOnOpen(4)}
            >
              <div className="flex items-center gap-2">
                <CircleX className="w-3.5 h-3.5" />
                <div className="text-left">
                  <p className="text-sm font-medium">Collapse Item Stock</p>
                  <p className="text-[10px] text-red-200">
                    Permanently remove from list
                  </p>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Modal>

      {/* Collapse Item Modal - Compact */}
      <Modal
        title={`Collapse Item - ${item.item}`}
        onOpen={onOpen === 4}
        className="max-w-md w-[90vw]"
        footer={true}
        setOnOpen={() => {
          if (handleRemove.isPending) return;
          setOnOpen(0);
        }}
        onFunction={() => {
          handleRemove.mutateAsync();
        }}
        yesTitle="Confirm Collapse"
        loading={handleRemove.isPending}
      >
        <div className="space-y-3 p-1">
          <div className="bg-amber-50 border border-amber-200 rounded-md p-2">
            <p className="text-[10px] text-amber-700 text-center">
              ⚠️ This action cannot be undone. Select the stock to collapse:
            </p>
          </div>
          <SelectStockDispense
            items={item.SupplyStockTrack}
            onChange={(e) => setItemId(e)}
            value={itemId}
            className="w-full"
          />
        </div>
      </Modal>

      {/* Dispense Item Modal */}
      <Modal
        title="Dispense Item"
        onOpen={onOpen === 3}
        footer={false}
        className="max-w-lg w-[95vw] overflow-auto max-h-[90vh]"
        setOnOpen={() => setOnOpen(0)}
        cancelTitle="Close"
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
