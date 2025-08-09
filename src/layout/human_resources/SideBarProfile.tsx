import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, ChevronUp, LogOut, User } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
//
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

//utils
import { removeCookie } from "@/utils/cookies";

const SideBarProfile = () => {
  const [onOpen, setOnOpen] = useState(false);

  const nav = useNavigate();

  const handleLogut = () => {
    removeCookie("auth_token");
    nav("/auth");
  };
  return (
    <Popover>
      <PopoverContent className=" flex flex-col gap-1">
        <Button variant="outline">
          <User size={20} color="#292929" strokeWidth={1.5} />
          Profile
        </Button>
        <Button variant="outline" onClick={handleLogut}>
          <LogOut size={20} color="#292929" strokeWidth={1.5} />
          Logout
        </Button>
      </PopoverContent>
      <PopoverTrigger onClick={() => setOnOpen(!onOpen)} className="w-full">
        <div className="w-full grid grid-cols-5 p-2 bg-white items-center rounded border">
          <div className=" col-span-1 grid">
            <Avatar className=" m-auto">
              <AvatarImage sizes="lg" src="https://github.com/shadcn.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </div>
          <div className=" col-span-3 px-2">
            <p className="text-start font-medium text-sm">JudeThePogi</p>
            <p className="text-start text-xs">jude@gmail.com</p>
          </div>
          <div
            className=" p-2 cursor-pointer col-span-1"
            onClick={() => setOnOpen(!onOpen)}
          >
            {onOpen ? (
              <ChevronDown size={20} color="#292929" strokeWidth={1.5} />
            ) : (
              <ChevronUp size={20} color="#292929" strokeWidth={1.5} />
            )}
          </div>
        </div>
      </PopoverTrigger>
    </Popover>
  );
};

export default SideBarProfile;
