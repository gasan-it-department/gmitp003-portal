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
  Building,
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
import { type SupplyStockTrack } from "@/interface/data";

interface Props {
  index: number;
  item: SupplyStockTrack;
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
    if (item.stock === 0)
      return { label: "Out of Stock", color: "bg-red-100 text-red-800" };
    if (item.stock <= 5)
      return { label: "Very Low", color: "bg-red-100 text-red-800" };
    if (item.stock <= 10)
      return { label: "Low", color: "bg-amber-100 text-amber-800" };
    if (item.stock <= 20)
      return { label: "Moderate", color: "bg-blue-100 text-blue-800" };
    return { label: "In Stock", color: "bg-green-100 text-green-800" };
  };

  const stockStatus = getStockStatus();
  // const latestPrice = item.price?.[item.price.length - 1]?.price || 0;
  // const totalValue = item.stock * latestPrice;
  const primaryBrand = item.brand?.[0];

  return (
    <>
      <TableRow
        className={`hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
          isSelected ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
        }`}
        onClick={() => setOnOpen(1)}
      >
        <TableCell className="py-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isSelected ? "bg-blue-500" : "bg-gray-300"
              }`}
            />
            <span className="font-medium">{index + 1}</span>
          </div>
        </TableCell>

        <TableCell className="py-3">
          <div className="flex items-center gap-2">
            <Tag className="w-3 h-3 text-gray-500" />
            <span className="font-mono text-sm">{item.supply.refNumber}</span>
          </div>
        </TableCell>

        <TableCell className="py-3">
          <div className="space-y-1">
            <p className="font-medium text-gray-900">{item.supply.item}</p>
            {item.supply.description && (
              <p className="text-xs text-gray-500 truncate max-w-xs">
                {item.supply.description}
              </p>
            )}
          </div>
        </TableCell>

        <TableCell className="py-3">
          <div className="flex flex-wrap gap-1">
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
          </div>
        </TableCell>

        <TableCell className="py-3">
          <div className="flex items-center gap-2">
            <div>
              <span className="font-medium text-gray-900">{item.stock}</span>
              <span className="text-xs text-gray-500">units</span>
            </div>
          </div>
        </TableCell>

        <TableCell className="py-3">
          <div className="flex items-center gap-2">
            <Badge className={stockStatus.color}>{stockStatus.label}</Badge>
          </div>
        </TableCell>
      </TableRow>

      {/* Item Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {item.supply.item}
              </h3>
              <p className="text-sm text-gray-500">
                {primaryBrand?.brand ? `${primaryBrand.brand} • ` : ""}
                Ref: {item.supply.refNumber}
              </p>
            </div>
          </div>
        }
        onOpen={onOpen === 1}
        className="max-w-lg"
        setOnOpen={() => setOnOpen(0)}
        footer={false}
      >
        <div className="space-y-4">
          {/* Stock Warning */}
          {item.stock <= 10 && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">Low Stock Alert</p>
                    <p className="text-sm text-red-700 mt-1">
                      This item is low on stock ({item.stock} units remaining).
                      Please consider initiating a restock request.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Item Information */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4 text-gray-500" />
                    <h4 className="font-medium text-gray-900">
                      Item Information
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Current Stock</p>
                      <p className="text-xl font-bold text-gray-900">
                        {item.stock} units
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Reference Number</p>
                      <p className="text-lg font-semibold text-gray-900 font-mono">
                        {item.supply.refNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Unit Price</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {/* ₱{latestPrice.toLocaleString()} */}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Value</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {/* ₱{totalValue.toLocaleString()} */}
                      </p>
                    </div>
                  </div>
                </div>

                {item.brand.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Brands</p>
                    <div className="flex flex-wrap gap-2">
                      {item.brand.map((brand, idx) => (
                        <Badge key={idx} variant="secondary" className="gap-1">
                          <Building className="w-3 h-3" />
                          {brand.brand}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {item.supply.description && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Description</p>
                    <p className="text-sm text-gray-700">
                      {item.supply.description}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-11 gap-2"
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
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <LogOut className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Dispense Item
              </h3>
              <p className="text-sm text-gray-500">
                {item.supply.item} • Stock: {item.stock} units
              </p>
            </div>
          </div>
        }
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
