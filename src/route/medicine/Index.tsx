import { Outlet } from "react-router";
import { Pill, Menu, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
//
import useMedSideBar from "@/hooks/useMedSideBar";

const Index = () => {
  const { onOpen, setOnOpen } = useMedSideBar();
  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section - Compact */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b flex justify-between items-center">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
            <Pill className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">
              Drugs and Medicines
            </h1>
            <p className="text-xs text-gray-500">Inventory Management</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => setOnOpen()}
          variant="ghost"
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 mr-2 md:hidden"
        >
          {onOpen ? (
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          ) : (
            <Menu className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          )}
        </Button>
      </div>

      {/* Content Area */}
      <div className="h-[calc(100%-57px)] overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default Index;
