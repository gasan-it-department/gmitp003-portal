import { memo, useState, useEffect } from "react";
///import { useNavigate } from "react-router";
import hotkeys from "hotkeys-js";
import {
  Package,
  Tag,
  AlertTriangle,
  // Eye,
  LogOut,
  Info,
  // ChevronRight,
} from "lucide-react";
//
import { TableRow, TableCell } from "@/components/ui/table";
import Modal from "@/components/custom/Modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DispenseItem from "../DispenseItem";
//
import { type SuppliesProps } from "@/interface/data";

interface Props {
  index: number;
  item: SuppliesProps;
  onSelect: number;
  lineId: string;
  token: string;
  userId: string;
  listId: string;
  containerId: string;
}

const OverviewSupplyItem = ({
  item,
  index,
  onSelect,
  lineId,
  token,
  userId,
  listId,
  containerId,
}: Props) => {
  const [onOpen, setOnOpen] = useState(0);
  const [isSelected, setIsSelected] = useState(false);
  // const nav = useNavigate();

  useEffect(() => {
    setIsSelected(onSelect === index);
  }, [onSelect, index]);

  useEffect(() => {
    const handleEnter = (event: KeyboardEvent) => {
      if (isSelected) {
        event.preventDefault();
        setOnOpen(1);
      }
    };

    hotkeys("enter", handleEnter);

    return () => {
      hotkeys.unbind("enter", handleEnter);
    };
  }, [isSelected]);

  const getStockStatus = () => {
    if (item.totalStock === 0)
      return {
        label: "Out of Stock",
        color: "bg-red-50 text-red-700 border-red-200",
      };
    if (item.totalStock <= 5)
      return {
        label: "Very Low",
        color: "bg-red-50 text-red-700 border-red-200",
      };
    if (item.totalStock <= 10)
      return {
        label: "Low",
        color: "bg-amber-50 text-amber-700 border-amber-200",
      };
    if (item.totalStock <= 20)
      return {
        label: "Moderate",
        color: "bg-blue-50 text-blue-700 border-blue-200",
      };
    return {
      label: "In Stock",
      color: "bg-green-50 text-green-700 border-green-200",
    };
  };

  const stockStatus = getStockStatus();
  // const latestPrice = item.price?.[item.price.length - 1]?.price || 0;
  // const totalValue = item.stock * latestPrice;

  return (
    <>
      <TableRow
        className={`group hover:bg-gray-50 cursor-pointer transition-colors ${
          isSelected
            ? "bg-blue-50 border-l-2 border-l-blue-500"
            : "border-l-2 border-l-transparent"
        }`}
        onClick={() => setOnOpen(1)}
      >
        <TableCell className="py-2 pl-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                isSelected
                  ? "bg-blue-500"
                  : "bg-gray-300 group-hover:bg-gray-400"
              }`}
            />
            <span
              className={`text-xs font-medium ${isSelected ? "text-blue-700" : "text-gray-600"}`}
            >
              {index + 1}
            </span>
          </div>
        </TableCell>

        <TableCell className="py-2">
          <div className="flex items-center gap-1.5">
            <Tag className="w-3 h-3 text-gray-400" />
            <span className="font-mono text-[10px] font-medium text-gray-500">
              {item.refNumber}
            </span>
          </div>
        </TableCell>

        <TableCell className="py-2">
          <div className="space-y-0.5">
            <p
              className={`text-sm font-medium ${isSelected ? "text-blue-800" : "text-gray-800"}`}
            >
              {item.item}
            </p>
            {item.description && (
              <p className="text-[10px] text-gray-500 line-clamp-1 max-w-xs">
                {item.description}
              </p>
            )}
          </div>
        </TableCell>

        <TableCell className="py-2">
          {/* <div className="flex flex-wrap gap-1">
            {item.brand.slice(0, 2).map((brand, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                <Building className="w-3 h-3 mr-1" />
                {brand.brand}
              </Badge>
            ))}
            {item.brand.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{item.brand.length - 2} more
              </Badge>
            )}
            {item.brand.length === 0 && (
              <span className="text-sm text-gray-400">No brands</span>
            )}
          </div> */}
        </TableCell>

        <TableCell className="py-2 text-center">
          <div className="flex items-baseline justify-center gap-0.5">
            <span className="text-sm font-bold text-gray-800">
              {item.totalStock}
            </span>
            <span className="text-[10px] text-gray-400">u</span>
          </div>
        </TableCell>

        <TableCell className="py-2">
          <Badge
            className={`${stockStatus.color} border text-[10px] px-2 py-0 font-normal`}
          >
            {stockStatus.label}
          </Badge>
        </TableCell>
      </TableRow>

      {/* Item Details Modal - Compact */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded-md">
              <Package className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-800 line-clamp-1">
                {item.item}
              </h3>
              {/* <p className="text-sm text-gray-500 mt-0.5">
                {primaryBrand?.brand ? `${primaryBrand.brand} • ` : ""}
                Ref: {item.supply.refNumber}
              </p> */}
            </div>
          </div>
        }
        onOpen={onOpen === 1}
        className="max-w-md w-[90vw]"
        setOnOpen={() => setOnOpen(0)}
        footer={false}
      >
        <div className="space-y-3">
          {/* Stock Warning - Compact */}
          {item.totalStock <= 10 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold text-red-800">
                    Low Stock Alert
                  </p>
                  <p className="text-[10px] text-red-700 mt-0.5">
                    Only <span className="font-bold">{item.totalStock}</span>{" "}
                    units remaining
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Item Information - Compact */}
          <div className="border rounded-md bg-white overflow-hidden">
            <div className="px-3 py-2 border-b bg-gray-50">
              <div className="flex items-center gap-1.5">
                <Info className="w-3 h-3 text-gray-500" />
                <h4 className="text-xs font-medium text-gray-700">
                  Item Information
                </h4>
              </div>
            </div>
            <div className="p-3 space-y-3">
              <div>
                <p className="text-[10px] font-medium text-gray-500">
                  Current Stock
                </p>
                <p className="text-lg font-bold text-gray-800">
                  {item.totalStock}{" "}
                  <span className="text-xs font-normal text-gray-400">
                    units
                  </span>
                </p>
                <div className="space-y-1 mt-2">
                  {item.SupplyStockTrack.map((stock, i) => (
                    <div
                      key={stock.id}
                      className="flex items-center gap-2 text-xs"
                    >
                      <span className="text-gray-400 w-5">{i + 1}.</span>
                      <span className="text-gray-600">
                        Qty: {stock.quantity} ({stock.perQuantity}/
                        {stock.quality})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {item.description && (
                <div className="pt-2 border-t">
                  <p className="text-[10px] font-medium text-gray-500 mb-1">
                    Description
                  </p>
                  <p className="text-xs text-gray-600">{item.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons - Compact */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1 h-8 gap-1.5 text-xs"
              onClick={() => setOnOpen(2)}
            >
              <LogOut className="w-3 h-3" />
              Dispense
            </Button>

            {/* <Button
              variant="outline"
              className="flex-1 h-11 gap-2"
              onClick={() => nav(`/supplies/${item.id}`)}
            >
              <Eye className="w-4 h-4" />
              View Details
              <ChevronRight className="w-4 h-4" />
            </Button> */}
          </div>
        </div>
      </Modal>

      {/* Dispense Modal */}
      <Modal
        title={undefined}
        children={
          <DispenseItem
            queryKey="listSupplyOverview"
            item={item}
            lineId={lineId}
            userId={userId}
            token={token}
            setOnOpen={setOnOpen}
            listId={listId}
            containerId={containerId}
          />
        }
        onOpen={onOpen === 2}
        className="max-w-lg w-[95vw] overflow-auto max-h-[90vh]"
        setOnOpen={() => setOnOpen(0)}
        footer={false}
      />
    </>
  );
};

export default memo(OverviewSupplyItem);
