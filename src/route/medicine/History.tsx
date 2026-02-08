import {} from "react";
import { useSearchParams } from "react-router";

//
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import Prescriptions from "./Prescriptions";
import MedicineLogs from "./MedicineLogs";

const History = () => {
  const [params, setParams] = useSearchParams({ tab: "prescriptions" });

  const currentTab = params.get("tab") || "prescriptions";

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

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      {/* Header for mobile */}
      <div className="md:hidden px-4 py-3 bg-white border-b">
        <h1 className="text-lg font-semibold text-gray-900">History</h1>
        <p className="text-sm text-gray-500">
          View prescriptions and medicine logs
        </p>
      </div>

      <Tabs
        className="w-full h-full flex flex-col"
        onValueChange={(e) => handleChangeParams("tab", e)}
        value={currentTab}
      >
        {/* Tab Navigation */}
        <div className="w-full border-b bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <TabsList className="w-full md:w-auto h-auto p-1 bg-transparent">
              <div className="flex flex-nowrap overflow-x-auto md:overflow-visible scrollbar-hide">
                <TabsTrigger
                  value="prescriptions"
                  className="flex-1 md:flex-none min-w-[140px] md:min-w-auto px-4 py-3 md:py-2 text-sm font-medium rounded-none md:rounded-md data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none data-[state=active]:text-blue-600 hover:text-blue-600"
                >
                  <span className="flex items-center gap-2">
                    <svg
                      className="hidden sm:inline h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Prescriptions
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="logs"
                  className="flex-1 md:flex-none min-w-[140px] md:min-w-auto px-4 py-3 md:py-2 text-sm font-medium rounded-none md:rounded-md data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none data-[state=active]:text-blue-600 hover:text-blue-600"
                >
                  <span className="flex items-center gap-2">
                    <svg
                      className="hidden sm:inline h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    Medicine Logs
                  </span>
                </TabsTrigger>
              </div>
            </TabsList>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <TabsContent
            value="prescriptions"
            className="w-full h-full p-0 m-0 data-[state=active]:animate-none"
          >
            <div className="w-full h-full p-4 md:p-6">
              <Prescriptions />
            </div>
          </TabsContent>
          <TabsContent
            value="logs"
            className="w-full h-full p-0 m-0 data-[state=active]:animate-none"
          >
            <div className="w-full h-full p-4 md:p-6">
              <MedicineLogs />
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Mobile bottom indicator */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600"></div>
    </div>
  );
};

export default History;
