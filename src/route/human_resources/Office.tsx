import { useParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
//
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BriefcaseBusiness, Group, Users } from "lucide-react";

//
import OfficePersonnel from "@/layout/human_resources/OfficePersonnel";
import OfficePostion from "@/layout/human_resources/OfficePostion";
const Office = () => {
  const { id } = useParams();
  const auth = useAuth();
  return (
    <div className=" w-full h-full">
      <div className=" w-full h-1/4 bg-white">
        <Button size="sm">Create</Button>
      </div>
      <div className=" w-full h-3/4">
        <Tabs defaultValue="personnel">
          <TabsList className=" p-0">
            <TabsTrigger
              value="personnel"
              className=" rounded-none cursor-pointer"
            >
              <Users color="#292929" strokeWidth={1.5} />
              Personnel
            </TabsTrigger>
            <TabsTrigger
              value="position"
              className=" rounded-none cursor-pointer"
            >
              <BriefcaseBusiness color="#292929" strokeWidth={1.5} />
              Position
            </TabsTrigger>
            <TabsTrigger value="group" className=" rounded-none cursor-pointer">
              <Group color="#292929" strokeWidth={1.5} />
              Team
            </TabsTrigger>
          </TabsList>
          <TabsContent value="personnel" className="w-full h-full">
            <OfficePersonnel />
          </TabsContent>
          <TabsContent value="position" className="w-full h-full">
            <OfficePostion id={id as string} token={auth.token as string} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Office;
