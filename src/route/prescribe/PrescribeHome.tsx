import { useSearchParams, useParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, Pen } from "lucide-react";
import DispensaryOut from "../medicine/DispensaryOut";
import Transaction from "@/layout/prescribe/Transaction";

const PrescribeHome = () => {
  const [params, setParams] = useSearchParams({ tab: "prescribe" });
  const { lineId } = useParams();
  const auth = useAuth();

  const handelChangeParams = (key: string, value: string) => {
    setParams(
      (prev) => {
        prev.set(key, value);
        return prev;
      },
      { replace: true },
    );
  };
  const currentTab = params.get("tab") || "prescribe";

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Tabs
        value={currentTab}
        className="w-full h-full flex flex-col"
        defaultValue="prescribe"
        onValueChange={(e) => handelChangeParams("tab", e)}
      >
        {/* Tabs Navigation - Compact */}
        <div className="border-b bg-white/50 px-4">
          <TabsList className="h-9 bg-transparent gap-0">
            <TabsTrigger
              value="prescribe"
              className="h-9 px-3 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent rounded-none text-xs text-gray-600 hover:text-gray-900 transition-colors gap-1.5"
            >
              <Pen className="h-3.5 w-3.5" />
              <span>Form</span>
            </TabsTrigger>
            <TabsTrigger
              value="transaction"
              className="h-9 px-3 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent rounded-none text-xs text-gray-600 hover:text-gray-900 transition-colors gap-1.5"
            >
              <History className="h-3.5 w-3.5" />
              <span>Transaction</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <TabsContent className="w-full h-full p-0 m-0" value="prescribe">
            <DispensaryOut />
          </TabsContent>
          <TabsContent className="w-full h-full p-0 m-0" value="transaction">
            <Transaction
              token={auth.token as string}
              lineId={lineId as string}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default PrescribeHome;
