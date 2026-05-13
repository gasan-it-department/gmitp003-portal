import { Outlet } from "react-router";
import { ClipboardList } from "lucide-react";

const PatientsIndex = () => {
  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b flex items-center gap-3 px-4 py-2">
        <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
          <ClipboardList className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-gray-900">
            Patients Record
          </h1>
          <p className="text-xs text-gray-500">Medical Records Management</p>
        </div>
      </div>

      {/* Content */}
      <div className="h-[calc(100%-57px)] overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default PatientsIndex;
