import {} from "react";
import { useSearchParams, useParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
//
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
//
import { History, Pen } from "lucide-react";
//
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
    <div className="w-full h-full flex flex-col">
      <Tabs
        value={currentTab}
        className="w-full h-full flex flex-col"
        defaultValue="prescribe"
        onValueChange={(e) => handelChangeParams("tab", e)}
      >
        <div className="w-full border-b px-4 py-3">
          <TabsList className="w-full max-w-md">
            <TabsTrigger
              value="prescribe"
              className="flex items-center gap-2 px-4 py-2"
            >
              <Pen className="h-4 w-4" />
              <span>Form</span>
            </TabsTrigger>
            <TabsTrigger
              value="transaction"
              className="flex items-center gap-2 px-4 py-2"
            >
              <History className="h-4 w-4" />
              <span>Transaction</span>
            </TabsTrigger>
          </TabsList>
        </div>

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
          <TabsContent className="w-full h-full p-0 m-0" value="inbox">
            {/* Inbox content would go here */}
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              Inbox content
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default PrescribeHome;
