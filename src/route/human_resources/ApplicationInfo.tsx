import { useSearchParams, useParams, useNavigate } from "react-router";
import { Info, History, ArrowLeft, FileText } from "lucide-react";

import { useAuth } from "@/provider/ProtectedRoute";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

import ApplicationProgress from "@/layout/human_resources/ApplicationProgress";
import ApplicationData from "@/layout/human_resources/ApplicationData";

const ApplicationInfo = () => {
  const [params, setParams] = useSearchParams({ tab: "data" });
  const { applicationId, lineId } = useParams();
  const nav = useNavigate();
  const auth = useAuth();

  const currentTab = params.get("tab") || "data";

  const handleChangeTab = (value: string) => {
    setParams(
      (prev) => {
        prev.set("tab", value);
        return prev;
      },
      { replace: true },
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <div className="bg-white border-b flex-shrink-0">
        <div className="px-3 py-2 flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={() => nav(-1)}
          >
            <ArrowLeft className="h-3 w-3" />
          </Button>
          <div className="p-1.5 bg-blue-600 rounded-md flex-shrink-0">
            <FileText className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs font-semibold text-gray-900 truncate">
              Application Details
            </h1>
            <p className="text-[10px] text-gray-500 leading-none mt-0.5 font-mono truncate">
              #{applicationId?.slice(-8) ?? "—"}
            </p>
          </div>
        </div>
      </div>

      <Tabs
        className="flex-1 min-h-0 flex flex-col"
        value={currentTab}
        onValueChange={handleChangeTab}
      >
        <div className="bg-white border-b px-3 py-1.5 flex-shrink-0">
          <TabsList className="h-7 p-0.5 bg-gray-100">
            <TabsTrigger
              value="data"
              className="h-6 px-2 text-[10px] gap-1.5 data-[state=active]:text-blue-700"
            >
              <Info className="h-3 w-3" />
              Information
            </TabsTrigger>
            <TabsTrigger
              value="progress"
              className="h-6 px-2 text-[10px] gap-1.5 data-[state=active]:text-blue-700"
            >
              <History className="h-3 w-3" />
              Progress &amp; Communication
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="data"
          className="flex-1 min-h-0 m-0 focus-visible:outline-none overflow-hidden"
        >
          <ApplicationData applicationId={applicationId} />
        </TabsContent>
        <TabsContent
          value="progress"
          className="flex-1 min-h-0 m-0 focus-visible:outline-none overflow-hidden"
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
