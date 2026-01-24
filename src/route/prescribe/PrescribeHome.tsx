import {} from "react";
import { useSearchParams, useParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
//
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

//
import { History, Pen, Inbox } from "lucide-react";

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
      { replace: true }
    );
  };
  const currentTab = params.get("tab") || "precribe";
  return (
    <div className=" w-full h-full">
      <Tabs
        value={currentTab}
        className=" w-full h-full"
        defaultValue="prescribe"
        onValueChange={(e) => handelChangeParams("tab", e)}
      >
        <div className=" w-full h-[10%] flex items-center border border-x-0 border-t-0">
          <TabsList>
            <TabsTrigger value="prescribe">
              <Pen />
              Form
            </TabsTrigger>
            <TabsTrigger value="inbox">
              <Inbox />
              Inbox
            </TabsTrigger>
            <TabsTrigger value="transaction">
              <History />
              Transaction
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent className=" w-full h-[90%]" value="prescribe">
          <DispensaryOut />
        </TabsContent>
        <TabsContent className=" w-full h-[90%]" value="transaction">
          <Transaction token={auth.token as string} lineId={lineId as string} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PrescribeHome;
