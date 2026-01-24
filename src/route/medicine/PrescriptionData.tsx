import { useParams, useSearchParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";

//
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import Dispensary from "./Dispensary";
import DispensaryProgress from "@/layout/medicine/DispensaryProgress";

//interfacs/props/schema
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
      }
    );
  };

  return (
    <div className="w-full h-full">
      <Tabs
        className="w-full h-full"
        defaultValue="dispense"
        onValueChange={(e) => handleChangeParams("tabs", e)}
        value={currentTabs}
      >
        <div className=" w-full h-[10%] border border-neutral-300 flex items-center">
          <TabsList>
            <TabsTrigger value="dispense">Dispense</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dispense" className=" w-full h-[90%]">
          <Dispensary
            id={prescriptionId}
            token={auth.token}
            userId={auth.userId as string}
          />
        </TabsContent>

        <TabsContent value="progress" className=" w-full h-[90%]">
          <DispensaryProgress id={prescriptionId} token={auth.token} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PrescriptionData;
