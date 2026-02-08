import { useSearchParams } from "react-router";
import { useDebounce } from "use-debounce";
import { type SuppliesProps } from "@/interface/data";
import { useState, useRef, useEffect } from "react";

// Components
import SelectDataSet from "./SelectDataSet";
import DataSetItemSelect from "./DataSetItemSelect";
import AddItemOrder from "./AddItemOrder";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Search, Database, Package, ArrowRight, X } from "lucide-react";

const AddSupplyOrder = () => {
  const [text, setText] = useState("");
  const [selected, setSelected] = useState<SuppliesProps | null>(null);
  const [params, setParams] = useSearchParams({ dataSet: "" });
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const [availableHeight, setAvailableHeight] = useState(400);

  const currentDataSet = params.get("dataSet");
  const [query] = useDebounce(text, 500);

  // Calculate available height for items list
  useEffect(() => {
    const updateHeight = () => {
      if (leftPanelRef.current) {
        const headerHeight = 80; // Approximate header height
        const searchHeight = 60; // Search bar + status height
        const padding = 32; // Additional padding
        const viewportHeight = window.innerHeight;
        const calculatedHeight =
          viewportHeight - headerHeight - searchHeight - padding;

        setAvailableHeight(Math.max(calculatedHeight, 200)); // Minimum 200px
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);

    return () => {
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  const handleChangeParams = (key: string, value: string) => {
    setParams(
      (prev) => {
        prev.set(key, value);
        return prev;
      },
      {
        replace: true,
      },
    );
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-3 sm:gap-4 p-2 sm:p-3 md:p-4">
      {/* Left Panel - Data Set & Item Selection */}
      <Card className="flex-1 overflow-hidden" ref={leftPanelRef}>
        <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="space-y-1">
              <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <Database className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Select Items
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Browse and select items to add to your order
              </p>
            </div>
            <SelectDataSet
              handleChangeParams={handleChangeParams}
              className="w-full sm:w-auto min-w-0"
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-3 sm:space-y-4 p-0 h-full">
          {/* Search Bar */}
          <div className="px-3 sm:px-4 md:px-6 pb-1 sm:pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                value={text}
                onChange={handleSearchChange}
                placeholder="Search items by name, description, or code..."
                className="pl-8 sm:pl-9 pr-7 sm:pr-8 h-9 sm:h-10 text-xs sm:text-sm"
              />
              {text && (
                <button
                  onClick={() => setText("")}
                  className="absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Data Set Status */}
          <div className="px-3 sm:px-4 md:px-6">
            {currentDataSet ? (
              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge
                    variant="outline"
                    className="text-xs whitespace-nowrap"
                  >
                    Active Dataset
                  </Badge>
                  <span className="text-xs sm:text-sm text-muted-foreground truncate min-w-0">
                    {currentDataSet}
                  </span>
                </div>
                {text && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    Searching for "{text}"
                  </span>
                )}
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 sm:p-3">
                <p className="text-xs sm:text-sm text-amber-800 flex items-center gap-1.5 sm:gap-2">
                  <Database className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  Please select a dataset to browse items
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Items List - Dynamic Height */}
          <div
            className="overflow-auto px-1 sm:px-2"
            style={{ height: `${availableHeight}px` }}
          >
            {currentDataSet ? (
              <DataSetItemSelect
                id={currentDataSet}
                setSelected={setSelected}
                selected={selected}
                query={query}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <Database className="h-10 w-10 sm:h-16 sm:w-16 text-muted-foreground/30 mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground font-medium mb-1 sm:mb-2">
                  No dataset selected
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Choose a dataset from the dropdown above to view items
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Right Panel - Item Details & Order Form */}
      <Card className="w-full lg:w-1/3 flex flex-col overflow-hidden border-l-0 lg:border-l">
        <CardHeader className="pb-1 sm:pb-2 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1 min-w-0">
              <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <span className="truncate">Order Details</span>
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                Configure quantity and details for the selected item
              </p>
            </div>
            {selected && (
              <Badge variant="secondary" className="text-xs flex-shrink-0 ml-2">
                Editing
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto p-0">
          {selected ? (
            <div className="h-full flex flex-col">
              <div className="flex-1 p-3 sm:p-4 md:p-6">
                <AddItemOrder selected={selected} setSelected={setSelected} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-3 sm:px-4 md:px-6 py-2">
              <div className="relative mb-4 sm:mb-6">
                <Package className="h-10 w-10 sm:h-16 sm:w-16 text-muted-foreground/30" />
                <ArrowRight className="hidden lg:block h-6 w-6 sm:h-8 sm:w-8 text-primary/50 absolute -right-8 sm:-right-10 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-sm sm:text-base text-muted-foreground font-medium mb-1.5 sm:mb-2">
                Select an item
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                Choose an item from the list to configure order details
              </p>
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary/30 flex-shrink-0"></div>
                  <span className="text-left">
                    Browse items in the selected dataset
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary/30 flex-shrink-0"></div>
                  <span className="text-left">
                    Click on an item to select it
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary/30 flex-shrink-0"></div>
                  <span className="text-left">
                    Configure quantity and details here
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AddSupplyOrder;
