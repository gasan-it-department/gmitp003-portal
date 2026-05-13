import { Outlet } from "react-router";
import { Stethoscope } from "lucide-react";

const DiagnoseIndex = () => {
  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="px-3 py-2 flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md">
            <Stethoscope className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h1 className="text-xs font-semibold text-gray-900">Diagnose</h1>
            <p className="text-[10px] text-gray-500 leading-none mt-0.5">
              Record patient diagnoses
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="h-[calc(100%-45px)] overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default DiagnoseIndex;
