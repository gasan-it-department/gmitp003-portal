import { useParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
//
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Request from "@/layout/human_resources/document/Request";
import Rooms from "@/layout/human_resources/document/Rooms";
import { FolderArchive, FolderOpen } from "lucide-react";

const Document = () => {
  const { lineId } = useParams();
  const auth = useAuth();

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-2 py-2">
        {/* Header Section */}
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
              <FolderArchive className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Document Management
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage rooms and document requests
              </p>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <Tabs defaultValue="room" className="w-full">
            <div className="border-b bg-gray-50/50 px-4 pt-2">
              <TabsList className="h-10 bg-transparent gap-1">
                <TabsTrigger
                  value="room"
                  className="h-8 px-3 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent rounded-none text-xs text-gray-600 hover:text-gray-900 transition-colors gap-1.5"
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                  Rooms
                </TabsTrigger>
                <TabsTrigger
                  value="request"
                  className="h-8 px-3 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent rounded-none text-xs text-gray-600 hover:text-gray-900 transition-colors gap-1.5"
                >
                  <FolderArchive className="h-3.5 w-3.5" />
                  Request
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-4">
              <TabsContent
                value="room"
                className="m-0 mt-0 focus-visible:outline-none"
              >
                <Rooms
                  lineId={lineId as string}
                  userId={auth.userId as string}
                  token={auth.token as string}
                />
              </TabsContent>
              <TabsContent
                value="request"
                className="m-0 mt-0 focus-visible:outline-none"
              >
                <Request
                  lineId={lineId as string}
                  userId={auth.userId as string}
                  token={auth.token as string}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Document;
