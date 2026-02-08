import { useState, useMemo } from "react";
import { Search } from "lucide-react";

// Icons & Components
import { unitOfMeasures } from "@/utils/helper";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface SelectUnitOfMeasureProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  defaultValue?: string;
}

const SelectUnitOfMeasure = ({
  value = "",
  onValueChange,
  placeholder = "Select unit...",
  disabled = false,
  className,
  defaultValue,
}: SelectUnitOfMeasureProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter units based on search query
  const filteredUnits = useMemo(() => {
    if (!searchQuery.trim()) {
      return unitOfMeasures;
    }

    const query = searchQuery.toLowerCase();
    return unitOfMeasures.filter((unit) => unit.toLowerCase().includes(query));
  }, [searchQuery]);

  const handleValueChange = (newValue: string) => {
    console.log("Value changed to:", newValue);
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  return (
    <Select
      defaultValue={defaultValue}
      value={value}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} className=" capitalize">
          {value || placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-72">
        <div className="sticky top-0 z-10 bg-background p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search units..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-sm"
              onClick={(e) => {
                e.stopPropagation();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.stopPropagation();
                }
              }}
            />
          </div>
        </div>

        {filteredUnits.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No units found
          </div>
        ) : (
          filteredUnits.map((unit) => (
            <SelectItem
              className=" capitalize"
              key={unit}
              value={unit}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {unit}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};

export default SelectUnitOfMeasure;
