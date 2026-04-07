import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { searchedChar } from "@/utils/element";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { archiveDocType } from "@/utils/helper";
import { Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  search: boolean;
  onChange: (...event: any[]) => void;
  defaultValue: number;
}

const DocumentTypeSelect = ({ search, onChange, defaultValue }: Props) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentVal = archiveDocType[defaultValue];

  useEffect(() => {
    if (open && search && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, search]);

  const list = () => {
    if (!query) return archiveDocType;
    return archiveDocType.filter((item) =>
      item.toLowerCase().includes(query.toLowerCase()),
    );
  };

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between"
        >
          {currentVal || "Select document type"}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        {search && (
          <div
            className="p-2 border-b"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <InputGroup>
              <InputGroupAddon>
                <Search className="h-4 w-4" />
              </InputGroupAddon>
              <InputGroupInput
                ref={inputRef}
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </InputGroup>
          </div>
        )}
        <div className="max-h-60 overflow-auto p-1">
          {list().length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              No results found
            </div>
          ) : (
            list().map((item, index) => (
              <div
                key={index}
                className={cn(
                  "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                  currentVal === item && "bg-accent",
                )}
                onClick={() => {
                  handleSelect(index.toString());
                }}
              >
                {searchedChar(query, item)}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DocumentTypeSelect;
