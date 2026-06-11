import { useSearchParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BellDot, UserRound, X } from "lucide-react";

import UserNotification from "./UserNotification";
import UserSideProfile from "./UserSideProfile";

interface Props {
  onClose?: () => void;
}

const SideBarProfile = ({ onClose }: Props) => {
  const [params, setParams] = useSearchParams();
  const auth = useAuth();
  const currentTab = params.get("tab") || "notification";

  const handleChangeTab = (value: string) => {
    setParams(
      (prev) => {
        prev.set("tab", value);
        return prev;
      },
      { replace: true },
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden">
      <Tabs
        className="flex-1 min-h-0 flex flex-col"
        onValueChange={handleChangeTab}
        defaultValue={currentTab}
        value={currentTab}
      >
        {/* Tab strip */}
        <div className="px-2 py-1.5 border-b bg-gray-50 flex items-center gap-1.5 flex-shrink-0">
          <TabsList className="h-7 p-0.5 bg-white border flex-1">
            <TabsTrigger
              value="notification"
              className="h-6 px-2 text-[10px] gap-1.5 flex-1 data-[state=active]:text-blue-700"
            >
              <BellDot className="h-3 w-3" />
              Notification
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="h-6 px-2 text-[10px] gap-1.5 flex-1 data-[state=active]:text-blue-700"
            >
              <UserRound className="h-3 w-3" />
              Profile
            </TabsTrigger>
          </TabsList>
          {onClose && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 lg:hidden"
              onClick={onClose}
              title="Close"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <TabsContent
          value="notification"
          className="flex-1 min-h-0 m-0 focus-visible:outline-none overflow-hidden"
        >
          <UserNotification
            token={auth.token as string}
            userId={auth.userId as string}
          />
        </TabsContent>

        <TabsContent
          value="profile"
          className="flex-1 min-h-0 m-0 focus-visible:outline-none overflow-hidden"
        >
          <UserSideProfile />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SideBarProfile;
