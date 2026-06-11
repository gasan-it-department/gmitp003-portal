import { useSearchParams, useParams } from "react-router";

import { useAuth } from "@/provider/ProtectedRoute";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Request from "@/layout/human_resources/document/Request";
import Rooms from "@/layout/human_resources/document/Rooms";

import { FolderArchive, FolderOpen, Inbox } from "lucide-react";

const Document = () => {
  const { lineId } = useParams();
  const auth = useAuth();
  const [params, setParams] = useSearchParams({ tab: "room" });
  const current = params.get("tab") || "room";

  const handleTab = (v: string) => {
    setParams(
      (prev) => {
        prev.set("tab", v);
        return prev;
      },
      { replace: true },
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">

      {/* Header strip */}
      <div className="bg-white border-b flex-shrink-0">
        <div className="px-3 py-2 flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 rounded-md flex-shrink-0">
            <Inbox className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs font-semibold text-gray-900 truncate">
              Document Management
            </h1>
            <p className="text-[10px] text-gray-500 leading-none mt-0.5">
              Manage rooms and document registration requests
            </p>
          </div>
        </div>
      </div>

      <Tabs
        value={current}
        onValueChange={handleTab}
        className="flex-1 min-h-0 flex flex-col"
      >
        <div className="bg-white border-b px-3 py-1.5 flex-shrink-0">
          <TabsList className="h-7 p-0.5 bg-gray-100">
            <TabsTrigger
              value="room"
              className="h-6 px-2 text-[10px] gap-1.5 data-[state=active]:text-blue-700"
            >
              <FolderOpen className="h-3 w-3" />
              Rooms
            </TabsTrigger>
            <TabsTrigger
              value="request"
              className="h-6 px-2 text-[10px] gap-1.5 data-[state=active]:text-blue-700"
            >
              <FolderArchive className="h-3 w-3" />
              Requests
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="room"
          className="flex-1 min-h-0 m-0 focus-visible:outline-none overflow-hidden"
        >
          <Rooms
            lineId={lineId as string}
            userId={auth.userId as string}
            token={auth.token as string}
          />
        </TabsContent>
        <TabsContent
          value="request"
          className="flex-1 min-h-0 m-0 focus-visible:outline-none overflow-hidden"
        >
          <Request
            lineId={lineId as string}
            userId={auth.userId as string}
            token={auth.token as string}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Document;
