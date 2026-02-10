import { useParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
//components
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import List from "./report/List";
import Timebased from "./report/Timebased";
//icons
import { ScrollText, CalendarDays } from "lucide-react";

const SupplyReport = () => {
  const { listId, containerId, lineId } = useParams();
  const auth = useAuth();
  return (
    <div className=" w-full h-full ">
      <Tabs className=" w-full h-full" defaultValue="list">
        <div className=" w-full  border border-neutral-300 border-x-0">
          <TabsList>
            <TabsTrigger className=" border shadow-none" value="list">
              <ScrollText />
              List
            </TabsTrigger>
            <TabsTrigger value="time-base" disabled={true}>
              <CalendarDays />
              Time-Based
            </TabsTrigger>
            <TabsTrigger value="items"></TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="list">
          <List
            id={listId}
            auth={auth}
            containerId={containerId as string}
            lineId={lineId as string}
            listId={listId as string}
          />
        </TabsContent>
        <TabsContent value="time-base">
          <Timebased auth={auth} id={listId} lineId={lineId as string} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SupplyReport;
