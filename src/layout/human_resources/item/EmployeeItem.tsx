import { memo, useState } from "react";
import { useNavigate } from "react-router";
import { searchedChar } from "@/utils/element";
import { viewUserProfile } from "@/db/statement";

import { TableRow, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { type User } from "@/interface/data";

interface Props {
  item: User;
  no: number;
  query: string;
  token: string;
  userId: string;
}

const initials = (u: User) =>
  `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.toUpperCase() || "?";

const EmployeeItem = ({ item, no, query, token, userId }: Props) => {
  const nav = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);

  const goToProfile = async () => {
    if (isNavigating) return;
    setIsNavigating(true);
    // Best-effort view tracking — never block navigation on it
    try {
      await viewUserProfile(token, item.id, userId);
    } catch {
      /* analytics-only call; ignore failure */
    }
    nav(`${item.id}`);
  };

  return (
    <TableRow
      onClick={goToProfile}
      className={`hover:bg-gray-50 cursor-pointer transition-colors ${
        isNavigating ? "opacity-50" : ""
      }`}
    >
      <TableCell className="px-3 py-2 text-xs text-gray-500 font-medium">
        {no}
      </TableCell>
      <TableCell className="px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            {item.userProfilePictures && (
              <AvatarImage src={item.userProfilePictures.file_url} />
            )}
            <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
              {initials(item)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-gray-800 truncate">
            {searchedChar(query, item.lastName) || "—"}
          </span>
        </div>
      </TableCell>
      <TableCell className="px-3 py-2 text-xs text-gray-800">
        {searchedChar(query, item.firstName) || "—"}
      </TableCell>
      <TableCell className="px-3 py-2 text-xs text-gray-600">
        {item.middleName ? searchedChar(query, item.middleName) : (
          <span className="text-gray-400">—</span>
        )}
      </TableCell>
      <TableCell className="px-3 py-2 text-xs text-blue-600">
        {item.username ? `@${searchedChar(query, item.username)}` : (
          <span className="text-gray-400">—</span>
        )}
      </TableCell>
      <TableCell className="px-3 py-2 text-xs text-gray-700">
        {item.department?.name || <span className="text-gray-400">—</span>}
      </TableCell>
      <TableCell className="px-3 py-2 text-xs text-gray-700">
        {item?.PositionSlot?.pos?.name ||
          item?.Position?.name || <span className="text-gray-400">—</span>}
      </TableCell>
    </TableRow>
  );
};

export default memo(EmployeeItem);
