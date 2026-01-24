import {} from "react";
import { useSearchParams, useParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
//
import { Info, History } from "lucide-react";
//
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ApplicationProgress from "@/layout/human_resources/ApplicationProgress";
import ApplicationData from "@/layout/human_resources/ApplicationData";

const ApplicationInfo = () => {
  const [params, setParams] = useSearchParams({ tab: "data" });
  const { applicationId, lineId } = useParams();

  const currentTab = params.get("tab") || "data";
  const auth = useAuth();

  const handleChangeParmas = (key: string, value: string) => {
    setParams(
      (prev) => {
        prev.set(key, value);
        return prev;
      },
      { replace: true }
    );
  };
  return (
    <div className=" w-full h-full">
      <Tabs
        className=" w-full h-full"
        defaultValue={currentTab}
        onValueChange={(e) => handleChangeParmas("tab", e)}
      >
        <div className=" w-full h-[10%] flex items-center">
          <TabsList>
            <TabsTrigger value="data">
              <Info />
              Information
            </TabsTrigger>
            <TabsTrigger value="progress">
              <History />
              Progress & Communication
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent className=" w-full h-[90%]" value="data">
          <ApplicationData applicationId={applicationId} />
        </TabsContent>
        <TabsContent
          className=" w-full h-[90%] p-2 overflow-auto"
          value="progress"
        >
          <ApplicationProgress
            lineId={lineId as string}
            userId={auth.userId as string}
            token={auth.token as string}
            applicationId={applicationId as string}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApplicationInfo;
