import { useSearchParams } from "react-router";
import { useDebounce } from "use-debounce";
import { useState } from "react";

import { type SuppliesProps } from "@/interface/data";

// Components
import SelectDataSet from "./SelectDataSet";
import DataSetItemSelect from "./DataSetItemSelect";
import AddItemOrder from "./AddItemOrder";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Search,
  Database,
  Package,
  ArrowRight,
  X,
  ShoppingCart,
  AlertTriangle,
} from "lucide-react";

const AddSupplyOrder = () => {
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
      { replace: true },
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-3 flex-1 min-h-0">
        <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-3">

          {/* ── Left Panel: Item picker ──────────────────────────────────── */}
          <div className="border rounded-lg bg-white overflow-hidden flex flex-col min-h-0">
            {/* Header */}
            <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Database className="h-3 w-3 text-blue-500" />
                <div>
                  <h3 className="text-xs font-semibold text-gray-800">Select Items</h3>
                  <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                    Browse items from a dataset
                  </p>
                </div>
              </div>
              <SelectDataSet
                handleChangeParams={handleChangeParams}
                className="w-44"
              />
            </div>

            {/* Search + dataset status */}
            <div className="px-3 py-2 border-b space-y-2 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Search items by name, description, or code..."
                  className="pl-7 pr-7 h-8 text-xs"
                />
                {text && (
                  <button
                    type="button"
                    onClick={() => setText("")}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {currentDataSet ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    Active Dataset
                  </Badge>
                  <span className="text-[10px] text-gray-500 truncate">
                    {currentDataSet}
                  </span>
                  {text && (
                    <>
                      <span className="text-[10px] text-gray-300">·</span>
                      <span className="text-[10px] text-gray-500">
                        Searching “{text}”
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-start gap-1.5 p-2 bg-amber-50 border border-amber-100 rounded-md">
                  <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700">
                    Select a dataset to browse items.
                  </p>
                </div>
              )}
            </div>

            {/* Items list (scrollable) */}
            <div className="flex-1 overflow-auto">
              {currentDataSet ? (
                <DataSetItemSelect
                  id={currentDataSet}
                  setSelected={setSelected}
                  selected={selected}
                  query={query}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                  <Database className="h-7 w-7 text-gray-300 mb-2" />
                  <p className="text-xs font-medium text-gray-500">
                    No dataset selected
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Choose a dataset from the dropdown above
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Right Panel: Order details ───────────────────────────────── */}
          <div className="border rounded-lg bg-white overflow-hidden flex flex-col min-h-0">
            <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <ShoppingCart className="h-3 w-3 text-blue-500" />
                <div>
                  <h3 className="text-xs font-semibold text-gray-800">Order Details</h3>
                  <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                    Configure quantity & notes
                  </p>
                </div>
              </div>
              {selected && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  Editing
                </Badge>
              )}
            </div>

            <div className="flex-1 overflow-auto">
              {selected ? (
                <div className="p-3">
                  <AddItemOrder selected={selected} setSelected={setSelected} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
                  <div className="relative mb-3">
                    <Package className="h-8 w-8 text-gray-300" />
                    <ArrowRight className="hidden lg:block h-3.5 w-3.5 text-blue-500/50 absolute -left-6 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-xs font-medium text-gray-600 mb-0.5">
                    Select an item
                  </p>
                  <p className="text-[10px] text-gray-400 mb-3">
                    Choose one from the list to configure order details
                  </p>
                  <ul className="space-y-1 text-[10px] text-gray-500 text-left">
                    <li className="flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-blue-400 flex-shrink-0" />
                      Browse items in the selected dataset
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-blue-400 flex-shrink-0" />
                      Click an item to select it
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-blue-400 flex-shrink-0" />
                      Configure quantity and notes here
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AddSupplyOrder;
