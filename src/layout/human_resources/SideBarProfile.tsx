import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronDown, ChevronUp, LogOut, User as UserIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

import { removeCookie } from "@/utils/cookies";

interface Props {
  name?: string;
  email?: string;
  avatarUrl?: string | null;
  initials?: string;
  collapsed?: boolean;
}

const SideBarProfile = ({
  name = "Account",
  email,
  avatarUrl,
  initials = "?",
  collapsed = false,
}: Props) => {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();

  const handleLogout = () => {
    removeCookie("auth_token");
    nav("/auth");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`w-full bg-white border rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2 ${
            collapsed ? "p-1.5 justify-center" : "p-2"
          }`}
        >
          <Avatar className="h-7 w-7 flex-shrink-0">
            {avatarUrl && <AvatarImage src={avatarUrl} />}
            <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
              {initials.toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          {!collapsed && (
            <>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium text-gray-900 truncate">
                  {name}
                </p>
                {email && (
                  <p className="text-[10px] text-gray-500 truncate">{email}</p>
                )}
              </div>
              {open ? (
                <ChevronUp className="h-3 w-3 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="h-3 w-3 text-gray-400 flex-shrink-0" />
              )}
            </>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent side="top" align="start" className="w-44 p-1">
        <div className="space-y-0.5">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 justify-start text-xs gap-2"
          >
            <UserIcon className="h-3 w-3" />
            Profile
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full h-7 justify-start text-xs gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="h-3 w-3" />
            Logout
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SideBarProfile;
