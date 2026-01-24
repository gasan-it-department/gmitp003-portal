import React from "react";

//
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";

//
import { Logs, UsersRound, Inbox as InboxIcon } from "lucide-react";

//
import Inbox from "./Inbox";
import People from "./People";
import Audit from "./Audit";

const Home = () => {
  return (
    <div className=" w-full h-full">
      <Tabs className=" w-full h-full" defaultValue="admin">
        <div className=" w-full h-[10%]">
          <p className=" font-medium text-lg ml-4">Manage</p>
          <TabsList>
            <TabsTrigger value="inbox">
              <InboxIcon />
              Inbox
            </TabsTrigger>
            <TabsTrigger value="people">
              <UsersRound />
              People
            </TabsTrigger>

            <TabsTrigger value="audit">
              <Logs />
              Audit
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="inbox" className=" w-full h-[90%]">
          <Inbox />
        </TabsContent>
        <TabsContent value="people" className=" w-full h-[90%]">
          <People />
        </TabsContent>
        <TabsContent value="audit" className=" w-full h-[90%]">
          <Audit />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Home;
