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
      },
    );
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <Tabs
        className="w-full h-full flex flex-col"
        defaultValue="dispense"
        onValueChange={(e) => handleChangeParams("tabs", e)}
        value={currentTabs}
      >
        {/* Header with tabs - responsive */}
        <div className="flex-shrink-0 border-b bg-card px-4 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between">
            <TabsList className="grid w-full sm:w-[300px] grid-cols-2">
              <TabsTrigger
                value="dispense"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm sm:text-base"
              >
                Dispense
              </TabsTrigger>
              <TabsTrigger
                value="progress"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm sm:text-base"
              >
                Progress
              </TabsTrigger>
            </TabsList>

            {/* Prescription ID badge - hidden on very small screens */}
            <div className="text-xs sm:text-sm text-muted-foreground hidden xs:block">
              <span className="hidden sm:inline">Prescription ID: </span>
              <span className="font-mono font-medium break-all">
                {prescriptionId}
              </span>
            </div>
          </div>
        </div>

        {/* Content area - responsive padding */}
        <div className="flex-1 min-h-0 bg-background overflow-auto">
          <TabsContent
            value="dispense"
            className="h-full m-0 p-3 sm:p-4 md:p-6"
          >
            <div className="h-full rounded-lg border bg-card shadow-sm overflow-auto">
              <Dispensary
                id={prescriptionId}
                token={auth.token as string}
                userId={auth.userId as string}
              />
            </div>
          </TabsContent>

          <TabsContent
            value="progress"
            className="h-full m-0 p-3 sm:p-4 md:p-6"
          >
            <div className="h-full rounded-lg border bg-card shadow-sm overflow-auto">
              <DispensaryProgress id={prescriptionId} token={auth.token} />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default PrescriptionData;
