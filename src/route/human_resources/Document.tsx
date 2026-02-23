import { useParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
//
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Request from "@/layout/human_resources/document/Request";
const Document = () => {
  const { lineId } = useParams();
  const auth = useAuth();
  return (
    <div className=" w-full h-full">
      <Tabs defaultValue="room">
        <div className=" w-full h-[10%]">
          <TabsList>
            <TabsTrigger value="room">Rooms</TabsTrigger>
            <TabsTrigger value="request">Request</TabsTrigger>
          </TabsList>
        </div>
        <div className=" w-full h-[90%]">
          <TabsContent value="request">
            <Request
              lineId={lineId as string}
              userId={auth.userId as string}
              token={auth.token as string}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default Document;
