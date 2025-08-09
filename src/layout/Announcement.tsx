import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { MessageCircleWarning, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
//
interface Props {
  fullWith: boolean;
}

const Announcement = ({ fullWith }: Props) => {
  return (
    <div className=" w-full h-full bg-white border border-neutral-400 rounded">
      <div className=" w-full h-[10%] p-2 ">
        <p className=" font-medium">Good Day!</p>
        <p className=" font-bold text-xl text-neutral-800">Announcements!</p>
      </div>
      <div className=" w-full h-[90%] p-2">
        <ScrollArea className=" w-full h-full overflow-auto">
          <Tabs defaultValue="important" className=" w-full h-full">
            <TabsList>
              <TabsTrigger
                value="important"
                className=" w-full lg:w-auto text-[#222831]"
              >
                <MessageCircleWarning />
                Important
              </TabsTrigger>
              <TabsTrigger
                value="other"
                className=" w-full lg:w-auto text-[#222831]"
              >
                <Info />
                Others
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="important"
              className=" w-full h-full bg-amber-200"
            >
              <Button size="sm" variant="link" className=" cursor-pointer">
                See 5 more
              </Button>
            </TabsContent>
          </Tabs>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>
    </div>
  );
};

export default Announcement;
