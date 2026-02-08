import { memo } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
//import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, User } from "lucide-react";

import type { User as UserProps } from "@/interface/data";

interface Props {
  item: UserProps;
  query: string;
  onSelect: (user: UserProps) => void;
}

const UserItem = ({ item, onSelect }: Props) => {
  return (
    <Card
      className="w-full border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
      onClick={() => onSelect(item)}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <Avatar className="h-10 w-10 border border-gray-200">
            <AvatarImage
              src={item.userProfilePictures?.file_url}
              alt={`${item.firstName} ${item.lastName}`}
            />
            <AvatarFallback className="bg-blue-50 text-blue-600">
              das
            </AvatarFallback>
          </Avatar>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            {/* Name */}
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900 truncate">
                {item.firstName} {item.lastName}
              </h3>
            </div>

            {/* Username & Email */}
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <User className="h-3 w-3" />
                <span className="truncate">{item.username}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Mail className="h-3 w-3" />
                <span className="truncate">{item.email}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(UserItem);
