import React from "react";
import { useSearchParams } from "react-router";
//
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BellDot, LogOut, Megaphone, UserPen, UserRound } from "lucide-react";
import Announcement from "./Announcement";

const tabs = [
  { Icon: UserRound, path: "/" },
  { Icon: BellDot, path: "/notification" },
];
const SideBarProfile = () => {
  const [params, setParams] = useSearchParams({ tab: "" });

  const currentTabs = params.get("tab") || "";

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

  const handleRender = () => {
    if (currentTabs === "/") {
      return (
        <div className=" w-full h-full flex flex-col justify-between bg-white">
          <div className=" w-full px-4">
            <div className=" w-full p-2 mt-2 lg:mt-10 flex items-center justify-center">
              <Avatar className=" w-32 h-32">
                <AvatarImage sizes="lg" src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </div>

            <div className=" w-full p-2">
              <p className=" font-medium text-xl text-center">
                Jude Demnuvar L. Ribleza
              </p>
              <p className=" text-center text-sm">Office/Depart.: OM JO IT</p>
              <p className=" text-center text-sm">Position: OM JO IT</p>
              <p className="  text-center text-sm">ID/Code: OM-01</p>
            </div>
            <Button
              variant="outline"
              className=" w-full border cursor-pointer hover:border-neutral-600"
              size="sm"
            >
              <UserPen />
              Edit
            </Button>
          </div>

          <div className=" w-full p-2 ">
            <Button
              className=" w-full cursor-pointer"
              size="sm"
              variant="outline"
            >
              <LogOut />
              Logout
            </Button>
          </div>
        </div>
      );
    }
  };
  return (
    <div className="w-full h-full flex ">
      <div className=" w-4/5 h-full flex flex-col justify-between bg-white">
        {handleRender()}
      </div>
      <div className=" w-1/5 h-full ">
        {tabs.map((item, i) => (
          <div
            onClick={() => handleChangeParamgs("tab", item.path)}
            key={i}
            className=" w-full min-h-20 flex justify-center items-center"
            style={{
              backgroundColor: currentTabs === item.path ? "white" : "",
            }}
          >
            <item.Icon />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SideBarProfile;
