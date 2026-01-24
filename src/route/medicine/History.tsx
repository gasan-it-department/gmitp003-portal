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
      }
    );
  };

  return (
    <div className=" w-full h-full ">
      <Tabs
        className=" w-full h-full"
        onValueChange={(e) => handleChangeParams("tab", e)}
        value={currentTab}
      >
        <div className=" w-full h-[10%]">
          <TabsList>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="prescriptions" className=" w-full h-[90%]">
          <Prescriptions />
        </TabsContent>
        <TabsContent value="logs" className=" w-full h-[90%]">
          <MedicineLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default History;
