// import React from "react";
import { useSearchParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
//
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserNotification from "./UserNotification";
import UserSideProfile from "./UserSideProfile";
import { BellDot, UserRound } from "lucide-react";

const SideBarProfile = () => {
  const [params, setParams] = useSearchParams({ tab: "" });

  const currentTabs = params.get("tab") || "notification";
  const auth = useAuth();

  const handleChangeParamgs = (key: string, value: string) => {
    setParams(
      (prev) => {
        prev.set(key, value);
        return prev;
      },
      {
        replace: true,
      }
    );
  };

  return (
    <div className="w-full h-full flex ">
      <Tabs
        className=" w-full h-full"
        onValueChange={(e) => handleChangeParamgs("tab", e)}
        defaultValue={currentTabs}
        value={currentTabs}
      >
        <TabsList className=" w-full h-[10%]">
          <TabsTrigger value="notification">
            <BellDot />
            Notification
          </TabsTrigger>
          <TabsTrigger value="profile">
            <UserRound />
            Profile
          </TabsTrigger>
        </TabsList>
        <TabsContent
          value="notification"
          className=" w-full h-[90%] overflow-auto"
        >
          <UserNotification
            token={auth.token as string}
            userId={auth.userId as string}
          />
        </TabsContent>

        <TabsContent value="profile" className=" w-full h-[90%] overflow-auto">
          <UserSideProfile />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SideBarProfile;
