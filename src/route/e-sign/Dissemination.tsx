import {} from "react";
import { useSearchParams } from "react-router";
//
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import DisseminationInbox from "@/layout/e-sign/DisseminationInbox";
import DisseminationOutbox from "@/layout/e-sign/DisseminationOutbox";
//icons
import { Inbox, ExternalLink } from "lucide-react";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const Dissemination = () => {
  const [params, setParams] = useSearchParams({ tab: "inbox" });

  const currentTab = params.get("tab") || "inbox";

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
    <div className="w-full h-full flex flex-col bg-white">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs
          defaultValue={currentTab}
          className="h-full"
          onValueChange={(e) => handleChangeParams("tab", e)}
        >
          <div className="px-6 pt-4 border-b border-gray-200 bg-white">
            <TabsList className="bg-gray-100 p-1 w-fit">
              <TabsTrigger
                value="inbox"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <Inbox className="h-4 w-4" />
                  <span>Inbox</span>
                  <Badge variant="outline" className="ml-1 text-xs">
                    24
                  </Badge>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="outbox"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  <span>Outbox</span>
                  <Badge variant="outline" className="ml-1 text-xs">
                    42
                  </Badge>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content Container */}
          <div className="h-[calc(100%-60px)]">
            <TabsContent value="inbox" className="h-full m-0">
              <DisseminationInbox />
            </TabsContent>
            <TabsContent value="outbox" className="h-full m-0">
              <DisseminationOutbox />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Dissemination;
