import { useQuery } from "@tanstack/react-query";

//
import { newInboxCount } from "@/db/statement";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

//
import { Inbox } from "lucide-react";

//
import MedInbox from "./MedInbox";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
//

interface Props {
  lineId: string | undefined;
  token: string | undefined;
}

const Notification = ({ lineId, token }: Props) => {
  const { data, isFetching } = useQuery<{ message: "OK"; count: number }>({
    queryKey: ["newInboxCount"],
    queryFn: () => newInboxCount(token, lineId),
    enabled: !!lineId || !!token,
  });

  return (
    <div className=" w-full h-full">
      <Tabs defaultValue="inbox" className=" w-full h-full">
        <TabsList className=" w-full p-1 h-[10%]">
          <TabsTrigger value="inbox" className=" relative">
            <Inbox />
            Inbox
            {isFetching ? (
              <Spinner />
            ) : (
              data && (
                <Badge
                  variant="destructive"
                  style={{
                    position: "absolute",
                    marginTop: -20,
                    right: 2,
                  }}
                >
                  {data.count}
                </Badge>
              )
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="inbox" className=" w-full h-[90%] overflow-auto">
          <MedInbox lineId={lineId} token={token} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Notification;
