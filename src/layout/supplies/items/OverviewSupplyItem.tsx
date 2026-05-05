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
import { Card, CardContent } from "@/components/ui/card";
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
        color: "bg-red-100 text-red-800 border-red-200",
      };
    if (item.totalStock <= 5)
      return {
        label: "Very Low",
        color: "bg-red-100 text-red-800 border-red-200",
      };
    if (item.totalStock <= 10)
      return {
        label: "Low",
        color: "bg-amber-100 text-amber-800 border-amber-200",
      };
    if (item.totalStock <= 20)
      return {
        label: "Moderate",
        color: "bg-blue-100 text-blue-800 border-blue-200",
      };
    return {
      label: "In Stock",
      color: "bg-green-100 text-green-800 border-green-200",
    };
  };

  const stockStatus = getStockStatus();
  // const latestPrice = item.price?.[item.price.length - 1]?.price || 0;
  // const totalValue = item.stock * latestPrice;

  return (
    <>
      <TableRow
        className={`group hover:bg-gray-50/80 cursor-pointer transition-all duration-200 ${
          isSelected
            ? "bg-blue-50/50 border-l-4 border-l-blue-500 shadow-sm"
            : "border-l-4 border-l-transparent hover:border-l-gray-200"
        }`}
        onClick={() => setOnOpen(1)}
      >
        <TableCell className="py-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                isSelected
                  ? "bg-blue-500 scale-125"
                  : "bg-gray-300 group-hover:bg-gray-400"
              }`}
            />
            <span
              className={`font-medium text-sm ${isSelected ? "text-blue-700" : "text-gray-700"}`}
            >
              {index + 1}
            </span>
          </div>
        </TableCell>

        <TableCell className="py-4">
          <div className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-mono text-xs font-medium text-gray-600">
              {item.refNumber}
            </span>
          </div>
        </TableCell>

        <TableCell className="py-4">
          <div className="space-y-1">
            <p
              className={`font-semibold text-sm ${isSelected ? "text-blue-900" : "text-gray-900"}`}
            >
              {item.item}
            </p>
            {item.description && (
              <p className="text-xs text-gray-500 line-clamp-1 max-w-xs">
                {item.description}
              </p>
            )}
          </div>
        </TableCell>

        <TableCell className="py-4">
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

        <TableCell className="py-4">
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold text-gray-900">
              {item.totalStock}
            </span>
            <span className="text-xs text-gray-400">units</span>
          </div>
        </TableCell>

        <TableCell className="py-4">
          <Badge className={`${stockStatus.color} border font-normal`}>
            {stockStatus.label}
          </Badge>
        </TableCell>
      </TableRow>

      {/* Item Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
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
        className="max-w-2xl"
        setOnOpen={() => setOnOpen(0)}
        footer={false}
      >
        <div className="space-y-6">
          {/* Stock Warning */}
          {item.totalStock <= 10 && (
            <Card className="border-0 bg-gradient-to-r from-red-50 to-red-50/50 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-red-100 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-red-800">
                      Low Stock Alert
                    </p>
                    <p className="text-sm text-red-700 mt-1 leading-relaxed">
                      This item is low on stock (
                      <span className="font-bold">{item.totalStock}</span> units
                      remaining). Please consider initiating a restock request.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Item Information */}
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="p-1.5 bg-gray-100 rounded-lg">
                      <Info className="w-4 h-4 text-gray-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">
                      Item Information
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Current Total Stock
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {item.totalStock}{" "}
                        <span className="text-sm font-normal text-gray-500">
                          units
                        </span>
                      </p>
                      <div className="w-full flex flex-col gap-2 mt-3">
                        {item.SupplyStockTrack.map((item, i) => (
                          <div
                            key={item.id}
                            className="w-full flex items-center text-sm"
                          >
                            <span className="text-gray-500 w-6">{i + 1}.</span>
                            <span className="text-gray-700">
                              Quantity: {item.quantity} ({item.perQuantity}/
                              {item.quality})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {item.description && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Description
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-11 gap-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all"
              onClick={() => setOnOpen(2)}
            >
              <LogOut className="w-4 h-4" />
              Dispense Item
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
        className="max-w-xl overflow-auto w-full h-full md:min-w-xl"
        setOnOpen={() => setOnOpen(0)}
        footer={1}
      />
    </>
  );
};

export default memo(OverviewSupplyItem);
