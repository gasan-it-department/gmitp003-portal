import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  BookUser,
  Component,
  Gauge,
  LandPlot,
  Server,
  Logs,
} from "lucide-react";

//tabs
import Dashboard from "./admin-panel/Dashboard";
import Areas from "./admin-panel/Areas";
import Account from "./admin-panel/Account";
import Lines from "./admin-panel/Lines";

const AdminPanel = () => {
  return (
    <div className=" w-full h-screen">
      <Tabs className=" w-full h-full">
        <TabsList defaultValue="Dasboard">
          <TabsTrigger value="Dasboard">
            <Gauge /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="Account">
            <BookUser />
            Account
          </TabsTrigger>
          <TabsTrigger value="Module">
            <Component />
            Module
          </TabsTrigger>
          <TabsTrigger value="Line">
            <Server />
            Line
          </TabsTrigger>
          <TabsTrigger value="Area">
            <LandPlot />
            Areas
          </TabsTrigger>
          <TabsTrigger value="Logs">
            <Logs />
            Logs
          </TabsTrigger>
        </TabsList>
        <TabsContent value="Dasboard" className=" w-full h-full">
          <Dashboard />
        </TabsContent>
        <TabsContent value="Account" className=" w-full h-full">
          <Account />
        </TabsContent>
        <TabsContent value="Line" className=" w-full h-full">
          <Lines />
        </TabsContent>
        <TabsContent value="Areas" className=" w-full h-full">
          <Lines />
        </TabsContent>
        <TabsContent value="Areas" className=" w-full h-full">
          <Lines />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
