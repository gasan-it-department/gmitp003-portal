import { useParams, useSearchParams } from "react-router";
import { useDebounce } from "use-debounce";
import { type SuppliesProps } from "@/interface/data";
import { useState } from "react";

// Components
import SelectDataSet from "./SelectDataSet";
import DataSetItemSelect from "./DataSetItemSelect";
import AddItemOrder from "./AddItemOrder";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Search, Database, Package, ArrowRight } from "lucide-react";

const AddSupplyOrder = () => {
  const {} = useParams();
  const [text, setText] = useState("");
  const [selected, setSelected] = useState<SuppliesProps | null>(null);
  const [params, setParams] = useSearchParams({ dataSet: "" });

  const currentDataSet = params.get("dataSet");
  const [query] = useDebounce(text, 500);

  const handleChangeParams = (key: string, value: string) => {
    setParams(
      (prev) => {
        prev.set(key, value);
        return prev;
      },
      {
        replace: true,
      }
    );
  };

  const clearSelection = () => {
    setSelected(null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 p-4">
      {/* Left Panel - Data Set & Item Selection */}
      <Card className="flex-1 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Select Items
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Browse and select items to add to your order
              </p>
            </div>
            <SelectDataSet
              handleChangeParams={handleChangeParams}
              className="min-w-[180px]"
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-0">
          {/* Search Bar */}
          <div className="px-6 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={text}
                onChange={handleSearchChange}
                placeholder="Search items by name, description, or code..."
                className="pl-9 pr-8"
              />
              {text && (
                <button
                  onClick={() => setText("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Data Set Status */}
          <div className="px-6">
            {currentDataSet ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Active Dataset
                  </Badge>
                  <span className="text-sm text-muted-foreground truncate">
                    {currentDataSet}
                  </span>
                </div>
                {text && (
                  <span className="text-xs text-muted-foreground">
                    Searching for "{text}"
                  </span>
                )}
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800 flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Please select a dataset to browse items
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Items List */}
          <div className="h-[calc(100vh-280px)] overflow-auto px-2">
            {currentDataSet ? (
              <DataSetItemSelect
                id={currentDataSet}
                setSelected={setSelected}
                selected={selected}
                query={query}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Database className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium mb-2">
                  No dataset selected
                </p>
                <p className="text-sm text-muted-foreground">
                  Choose a dataset from the dropdown above to view items
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Right Panel - Item Details & Order Form */}
      <Card className="lg:w-1/3 flex flex-col overflow-hidden border-l">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Order Details
            </CardTitle>
            {selected && (
              <Badge variant="secondary" className="text-xs">
                Editing
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Configure quantity and details for the selected item
          </p>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto p-0">
          {selected ? (
            <div className="h-full flex flex-col">
              <div className="px-6 py-4 bg-muted/30 border-b">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">
                      {selected.item}
                    </h4>
                    {/* {selected.desc && (
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {selected.desc}
                      </p>
                    )} */}
                    <div className="flex items-center gap-3 mt-2">
                      {selected.code && (
                        <code className="text-xs bg-background px-2 py-1 rounded">
                          {selected.code}
                        </code>
                      )}
                      {/* {selected.category && (
                        <Badge variant="outline" className="text-xs">
                          {selected.category}
                        </Badge>
                      )} */}
                    </div>
                  </div>
                  <button
                    onClick={clearSelection}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="flex-1">
                <AddItemOrder selected={selected} setSelected={setSelected} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center px-6">
              <div className="relative mb-6">
                <Package className="h-16 w-16 text-muted-foreground/30" />
                <ArrowRight className="h-8 w-8 text-primary/50 absolute -right-10 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-muted-foreground font-medium mb-2">
                Select an item
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Choose an item from the list to configure order details
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary/30"></div>
                  <span>Browse items in the selected dataset</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary/30"></div>
                  <span>Click on an item to select it</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary/30"></div>
                  <span>Configure quantity and details here</span>
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
