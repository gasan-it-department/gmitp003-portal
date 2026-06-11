import { twMerge } from "tailwind-merge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";

import type { SupplyStockTrack } from "@/interface/data";

interface Props {
  items: SupplyStockTrack[];
  onChange: (value: string) => void;
  value: string;
  className?: string;
  itemDisabled?: boolean;
}

/**
 * Render a single stock-batch row in the spec'd format:
 *   "1. Quantity: 100 - (1/piece) | Stock: 100 -> DBM (Supplier)"
 *   "3. Quantity: 100 - (1/box)   | Stock: 100"          (no supplier attached)
 *
 * The "(Supplier)" label is a literal kind-tag, not the supplier's own name.
 * Supplier slot is intentionally blank when the batch has no supplier
 * attached (legacy rows, manual adjustments).
 */
const formatRow = (item: SupplyStockTrack, index: number) => {
  const unit = (item.quality || "unit").toString().trim().toLowerCase();
  const left = `Quantity: ${item.quantity} - (${item.perQuantity}/${unit})`;
  const middle = `Stock: ${item.stock}`;
  const supplier = item.supplier?.name?.trim();
  return (
    <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
      <span className="text-gray-500 font-mono">{index + 1}.</span>
      <span className="font-medium">{left}</span>
      <span className="text-gray-400">|</span>
      <span className="font-medium">{middle}</span>
      {supplier ? (
        <>
          <span className="text-gray-400">-&gt;</span>
          <span className="text-blue-700 truncate font-medium">{supplier}</span>
          <span className="text-gray-400">(Supplier)</span>
        </>
      ) : null}
    </div>
  );
};

const SelectStockDispense = ({
  items,
  onChange,
  value,
  className,
  itemDisabled,
}: Props) => {
  const selected = items.find((i) => i.id === value);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={twMerge("w-full h-8 text-xs", className)}>
        <SelectValue placeholder="Select a stock batch">
          {selected ? (
            formatRow(selected, items.indexOf(selected))
          ) : (
            <span className="text-gray-400">Select a stock batch</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {items.length === 0 ? (
          <div className="px-2 py-1.5 text-[11px] text-gray-400 italic">
            No stock batches available
          </div>
        ) : (
          items.map((item, i) => (
            <SelectItem
              value={item.id}
              key={item.id}
              disabled={itemDisabled ? item.stock === 0 : false}
              className="py-2"
            >
              {formatRow(item, i)}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};

export default SelectStockDispense;
