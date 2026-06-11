import { Outlet } from "react-router";
import { Pill } from "lucide-react";

const Index = () => {
  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Header strip */}
      <div className="bg-white border-b flex-shrink-0">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-blue-600 rounded-md flex-shrink-0">
              <Pill className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-semibold text-gray-900 truncate">
                Drugs &amp; Medicines
              </h1>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                Inventory &amp; dispensary management
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            <span className="text-[10px] text-gray-600 font-medium">
              Operational
            </span>
          </div>
        </div>
      </div>

      {/* Routed content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default Index;
