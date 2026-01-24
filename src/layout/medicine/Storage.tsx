import {} from "react";
import { useAuth } from "@/provider/ProtectedRoute";

//
import { useParams } from "react-router";

//
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import StorageMedList from "./StorageMedList";
//icons
import { ArrowLeftRight, ListCheck, Info } from "lucide-react";

const Storage = () => {
  const { storageId, lineId } = useParams();
  const auth = useAuth();
  return (
    <div className=" w-full h-full">
      <Tabs defaultValue="list" className=" w-full h-full">
        <div className=" w-full h-1/12">
          <TabsList defaultValue="list">
            <TabsTrigger value="list">
              <ListCheck />
              List
            </TabsTrigger>
            <TabsTrigger value="transactions">
              <ArrowLeftRight />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="info">
              <Info />
              Info
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list" className=" w-full h-11/12">
          <StorageMedList
            auth={auth}
            storageId={storageId}
            lineId={lineId as string}
          />
        </TabsContent>

        <TabsContent value="info" className=" w-full h-11/12"></TabsContent>
      </Tabs>
    </div>
  );
};

export default Storage;
