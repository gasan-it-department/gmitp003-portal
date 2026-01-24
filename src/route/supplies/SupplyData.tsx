import {} from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
//
import { supplyData } from "@/db/statements/supply";

//
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";

//interface/schema/props
import type { SupplyStockTrack } from "@/interface/data";

const SupplyData = () => {
  const { supplyStockId } = useParams();
  const auth = useAuth();
  const { data, isFetching } = useQuery<SupplyStockTrack>({
    queryKey: ["supply-data", supplyStockId],
    queryFn: () => supplyData(auth.token as string, supplyStockId as string),
    enabled: !!supplyStockId,
  });

  if (isFetching) {
    return;
  }

  if (!data) return;

  return (
    <div className=" w-full h-full">
      <div className=" w-full ">
        <p>{data.supply.item || "N/A"}</p>
      </div>
      <Tabs>
        <TabsList>
          <TabsTrigger value="received">Recieved Records</TabsTrigger>
          <TabsTrigger value="dispense">Dispense History</TabsTrigger>
        </TabsList>
        <TabsContent value="received"></TabsContent>
        <TabsContent value="dispense"></TabsContent>
      </Tabs>
    </div>
  );
};

export default SupplyData;
