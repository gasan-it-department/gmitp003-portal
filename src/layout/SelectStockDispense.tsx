import { twMerge } from "tailwind-merge";
//
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";

import type { SupplyStockTrack } from "@/interface/data";
//
interface Props {
  items: SupplyStockTrack[];
  onChange: (value: string) => void;
  value: string;
  className: string;
  itemDisabled?: boolean;
}

const SelectStockDispense = ({
  items,
  onChange,
  value,
  className,
  itemDisabled,
}: Props) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={twMerge("w-full", className)}>
        <SelectValue placeholder="Select an item" />
      </SelectTrigger>
      <SelectContent>
        {items.map((item, i) => (
          <SelectItem
            value={item.id}
            key={item.id}
            disabled={itemDisabled ? item.stock === 0 : false}
          >
            {i + 1}. Quantity: {item.quantity} - ({item.perQuantity}/
            {item.quality}) | Stock: {item.stock}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default SelectStockDispense;
