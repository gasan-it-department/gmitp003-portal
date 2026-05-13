import { useSearchParams, useParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, Pen } from "lucide-react";
import DispensaryOut from "../medicine/DispensaryOut";
import PrescribeTransactionList from "@/layout/prescribe/Transaction";

const PrescribeHome = () => {
  const [params, setParams] = useSearchParams({ tab: "prescribe" });
  const { lineId } = useParams();
  const auth = useAuth();

  const handleChangeTab = (value: string) => {
    setParams((prev) => { prev.set("tab", value); return prev; }, { replace: true });
  };

  const currentTab = params.get("tab") || "prescribe";

  return (
    <div className="w-full h-full flex flex-col">
      <Tabs
        value={currentTab}
        className="w-full h-full flex flex-col"
        onValueChange={handleChangeTab}
      >
        {/* Compact tab bar */}
        <div className="border-b bg-white px-3 flex-shrink-0">
          <TabsList className="h-8 bg-transparent gap-0 p-0">
            <TabsTrigger
              value="prescribe"
              className="h-8 px-3 text-[10px] font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent text-gray-500 hover:text-gray-700 transition-colors gap-1.5"
            >
              <Pen className="h-3 w-3" />
              Form
            </TabsTrigger>
            <TabsTrigger
              value="transaction"
              className="h-8 px-3 text-[10px] font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent text-gray-500 hover:text-gray-700 transition-colors gap-1.5"
            >
              <History className="h-3 w-3" />
              Transactions
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <TabsContent className="w-full h-full p-0 m-0" value="prescribe">
            <DispensaryOut />
          </TabsContent>
          <TabsContent className="w-full h-full p-0 m-0" value="transaction">
            <PrescribeTransactionList
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
