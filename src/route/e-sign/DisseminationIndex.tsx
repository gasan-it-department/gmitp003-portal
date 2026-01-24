import { Send, FileText } from "lucide-react";
import { Outlet } from "react-router";

const DisseminationIndex = () => {
  return (
    <div className=" w-full h-full overflow-auto relative">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Send className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Document Dissemination
              </h1>
              <p className="text-sm text-gray-500">
                Manage document distribution and tracking
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-2 bg-gray-50 rounded-lg">
            <FileText className="h-4 w-4 text-gray-600" />
          </div>
          <p className="text-sm text-gray-600">
            Track document distribution, monitor signatures, and manage document
            workflows
          </p>
        </div>
      </div>

      <Outlet />
    </div>
  );
};

export default DisseminationIndex;
