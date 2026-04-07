//
import { Badge } from "@/components/ui/badge";
import { Archive } from "lucide-react";
import { Outlet } from "react-router";

//interface

const Index = () => {
  return (
    <div className=" w-full h-screen bg-neutral-100 overflow-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sticky top-0 bg-white z-50 p-2">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg shadow-sm flex-shrink-0">
            <Archive className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0 ">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight leading-tight">
              Municipal Document Management System (DMS)
            </h1>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50 mb-1 sm:mb-2 text-xs inline-flex items-center">
            <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
            System Operational
          </Badge>
        </div>
      </div>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default Index;
