import { useParams, useSearchParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import Dispensary from "./Dispensary";
import DispensaryProgress from "@/layout/medicine/DispensaryProgress";
import { ClipboardList, Activity } from "lucide-react";

const PrescriptionData = () => {
  const [params, setParams] = useSearchParams({ tabs: "dispense" });
  const { prescriptionId } = useParams();
  const auth = useAuth();
  const currentTabs = params.get("tabs") || "dispense";

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
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100">
      <Tabs
        className="w-full h-full flex flex-col"
        defaultValue="dispense"
        onValueChange={(e) => handleChangeParams("tabs", e)}
        value={currentTabs}
      >
        {/* Tabs Navigation - Compact */}
        <div className="border-b bg-white/50 px-4">
          <TabsList className="h-9 bg-transparent gap-0">
            <TabsTrigger
              value="dispense"
              className="h-9 px-3 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent rounded-none text-xs text-gray-600 hover:text-gray-900 transition-colors gap-1.5"
            >
              <ClipboardList className="h-3.5 w-3.5" />
              <span>Dispense</span>
            </TabsTrigger>
            <TabsTrigger
              value="progress"
              className="h-9 px-3 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent rounded-none text-xs text-gray-600 hover:text-gray-900 transition-colors gap-1.5"
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Progress</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <TabsContent
            value="dispense"
            className="h-full m-0 p-4 focus-visible:outline-none"
          >
            <div className="h-full">
              <Dispensary
                id={prescriptionId}
                token={auth.token as string}
                userId={auth.userId as string}
              />
            </div>
          </TabsContent>

          <TabsContent
            value="progress"
            className="h-full m-0 p-4 focus-visible:outline-none"
          >
            <div className="h-full">
              <DispensaryProgress id={prescriptionId} token={auth.token} />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default PrescriptionData;
