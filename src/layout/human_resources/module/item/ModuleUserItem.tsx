import { useState, memo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { removeModuleAccess, updateModuleAccess } from "@/db/statements/module";
import { addModuleUserPrevilege } from "@/utils/helper";
import { searchedChar } from "@/utils/element";

import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Modal from "@/components/custom/Modal";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  MoreVertical,
  UserX,
  UserCheck,
  ShieldOff,
  AlertCircle,
  Shield,
  Loader2,
} from "lucide-react";

import type { User } from "@/interface/data";

const moduleStatus = ["Suspended", "Active"];

interface Props {
  item: User;
  no: number;
  token: string;
  userId: string;
  lineId: string;
  moduleId: string;
  query: string;
}

const ModuleUserItem = ({
  item,
  no,
  token,
  userId,
  lineId,
  moduleId,
  query,
}: Props) => {
  const queryClient = useQueryClient();
  const [onOpen, setOnOpen] = useState(0);
  const [previlege, setPrevilege] = useState(item.modules[0].privilege);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currentStatus = item.modules[0].status; // 0 = Suspended, 1 = Active
  const isActive = currentStatus === 1;
  const newStatus = isActive ? 0 : 1; // toggle target

  const handleActionClick = (actionNumber: number) => {
    setOnOpen(actionNumber);
    setDropdownOpen(false);
  };

  const invalidateUsers = () =>
    queryClient.invalidateQueries({
      queryKey: ["module-users", moduleId, lineId, query],
      refetchType: "active",
    });

  const removeAccess = useMutation({
    mutationFn: () =>
      removeModuleAccess(token, item.id, userId, moduleId, lineId),
    onError: (err) => {
      toast.error("Failed to remove access", { description: err.message });
    },
    onSuccess: async () => {
      await invalidateUsers();
      setOnOpen(0);
      toast.success("User removed from module");
    },
  });

  const updateAccess = useMutation({
    mutationFn: ({
      status,
      privilege,
    }: {
      status: number | undefined;
      privilege: number | undefined;
    }) =>
      updateModuleAccess(
        token,
        item.id,
        userId,
        moduleId,
        lineId,
        status,
        privilege,
      ),
    onError: (err) => {
      toast.error("Update failed", { description: err.message });
    },
    onSuccess: async () => {
      await invalidateUsers();
      setOnOpen(0);
      toast.success("Updated successfully");
    },
  });

  return (
    <>
      <TableRow className="hover:bg-gray-50 transition-colors border-b">
        <TableCell className="px-3 py-2 text-xs text-gray-500 font-medium">
          {no + 1}
        </TableCell>
        <TableCell className="px-3 py-2 text-xs font-medium text-blue-600">
          {searchedChar(query, item.username)}
        </TableCell>
        <TableCell className="px-3 py-2 text-xs text-gray-800">
          {searchedChar(query, item.lastName)}
        </TableCell>
        <TableCell className="px-3 py-2 text-xs text-gray-800">
          {searchedChar(query, item.firstName)}
        </TableCell>
        <TableCell className="px-3 py-2">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {addModuleUserPrevilege[item.modules[0].privilege] ?? "—"}
          </Badge>
        </TableCell>
        <TableCell className="px-3 py-2">
          <Badge
            variant={isActive ? "default" : "destructive"}
            className="text-[10px] px-1.5 py-0"
          >
            {moduleStatus[currentStatus] ?? "Unknown"}
          </Badge>
        </TableCell>
        <TableCell className="px-3 py-2 text-right">
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="text-[10px]">
                Actions
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                onClick={() => handleActionClick(3)}
              >
                <Shield className="mr-2 h-3.5 w-3.5" />
                Change privilege
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 cursor-pointer"
                onClick={() => handleActionClick(2)}
              >
                <UserCheck className="mr-2 h-3.5 w-3.5" />
                {isActive ? "Suspend user" : "Activate user"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                onClick={() => handleActionClick(1)}
              >
                <UserX className="mr-2 h-3.5 w-3.5" />
                Remove from module
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {/* ── Remove Access Modal ────────────────────────────────────────── */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-50 rounded-md">
              <UserX className="h-3.5 w-3.5 text-red-600" />
            </div>
            <span className="text-sm font-semibold">Remove User from Module</span>
          </div>
        }
        footer={1}
        loading={removeAccess.isPending}
        onOpen={onOpen === 1}
        className="max-w-sm"
        onFunction={() => {
          if (!removeAccess.isPending) removeAccess.mutateAsync();
        }}
        setOnOpen={() => {
          if (removeAccess.isPending) return;
          setOnOpen(0);
        }}
      >
        <div className="space-y-3 p-1">
          <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-100 rounded-md">
            <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-red-700">
              <span className="font-medium">{item.username}</span> will lose
              access to this module immediately. This action cannot be undone.
            </p>
          </div>

          <div className="border rounded-lg bg-gray-50 p-2.5 space-y-1.5">
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="text-gray-500">Name</span>
                <p className="text-xs font-medium text-gray-800">
                  {item.firstName} {item.lastName}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Username</span>
                <p className="text-xs font-medium text-gray-800">
                  @{item.username}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Current Privilege</span>
                <p className="text-xs font-medium text-gray-800">
                  {addModuleUserPrevilege[item.modules[0].privilege] ?? "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              disabled={removeAccess.isPending}
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOnOpen(0)}
            >
              Cancel
            </Button>
            <Button
              disabled={removeAccess.isPending}
              variant="destructive"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={() => removeAccess.mutateAsync()}
            >
              {removeAccess.isPending && (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
              Remove User
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Suspend / Activate Modal ───────────────────────────────────── */}
      <Modal
        footer={1}
        title={
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-md ${
                isActive ? "bg-amber-50" : "bg-green-50"
              }`}
            >
              <UserCheck
                className={`h-3.5 w-3.5 ${
                  isActive ? "text-amber-600" : "text-green-600"
                }`}
              />
            </div>
            <span className="text-sm font-semibold">
              {isActive ? "Suspend Access" : "Activate Access"}
            </span>
          </div>
        }
        onOpen={onOpen === 2}
        className="max-w-sm"
        setOnOpen={() => {
          if (updateAccess.isPending) return;
          setOnOpen(0);
        }}
      >
        <div className="space-y-3 p-1">
          <div
            className={`flex items-start gap-2 p-2.5 rounded-md border ${
              isActive
                ? "bg-amber-50 border-amber-100"
                : "bg-green-50 border-green-100"
            }`}
          >
            <AlertCircle
              className={`h-3.5 w-3.5 flex-shrink-0 mt-0.5 ${
                isActive ? "text-amber-500" : "text-green-500"
              }`}
            />
            <p
              className={`text-[10px] ${
                isActive ? "text-amber-700" : "text-green-700"
              }`}
            >
              {isActive
                ? `Temporarily suspend ${item.username}'s access to this module.`
                : `Restore ${item.username}'s access to this module.`}
            </p>
          </div>

          <div className="border rounded-lg bg-gray-50 p-2.5">
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="col-span-2">
                <span className="text-gray-500">User</span>
                <p className="text-xs font-medium text-gray-800">
                  {item.firstName} {item.lastName}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Current</span>
                <p>
                  <Badge
                    variant={isActive ? "default" : "destructive"}
                    className="text-[10px] px-1.5 py-0 mt-0.5"
                  >
                    {moduleStatus[currentStatus]}
                  </Badge>
                </p>
              </div>
              <div>
                <span className="text-gray-500">New</span>
                <p>
                  <Badge
                    variant={isActive ? "destructive" : "default"}
                    className="text-[10px] px-1.5 py-0 mt-0.5"
                  >
                    {moduleStatus[newStatus]}
                  </Badge>
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              disabled={updateAccess.isPending}
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOnOpen(0)}
            >
              Cancel
            </Button>
            <Button
              disabled={updateAccess.isPending}
              variant={isActive ? "destructive" : "default"}
              size="sm"
              className={`h-7 text-xs gap-1.5 ${
                isActive ? "" : "bg-green-600 hover:bg-green-700"
              }`}
              onClick={() =>
                updateAccess.mutateAsync({
                  status: newStatus,
                  privilege: undefined,
                })
              }
            >
              {updateAccess.isPending && (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
              {isActive ? "Suspend User" : "Activate User"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Update Privilege Modal ─────────────────────────────────────── */}
      <Modal
        footer={1}
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded-md">
              <Shield className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <span className="text-sm font-semibold">Update Privilege</span>
          </div>
        }
        onOpen={onOpen === 3}
        className="max-w-sm"
        setOnOpen={() => {
          if (updateAccess.isPending) return;
          setOnOpen(0);
        }}
      >
        <div className="space-y-3 p-1">
          <div className="flex items-start gap-2 p-2.5 bg-blue-50 border border-blue-100 rounded-md">
            <ShieldOff className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-700">
              Change access level for{" "}
              <span className="font-medium">{item.username}</span>
            </p>
          </div>

          <div className="border rounded-lg bg-gray-50 p-2.5">
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="col-span-2">
                <span className="text-gray-500">User</span>
                <p className="text-xs font-medium text-gray-800">
                  {item.firstName} {item.lastName}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Current</span>
                <p className="text-xs font-medium text-gray-800">
                  {addModuleUserPrevilege[item.modules[0].privilege] ?? "—"}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Module</span>
                <p className="text-xs font-medium text-gray-800 capitalize">
                  {item.modules[0].moduleName}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="newPrivilege"
              className="text-[10px] font-semibold text-gray-700"
            >
              New Privilege Level
            </Label>
            <Select
              value={String(previlege)}
              onValueChange={(v) => setPrevilege(parseInt(v, 10))}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select privilege" />
              </SelectTrigger>
              <SelectContent>
                {addModuleUserPrevilege.map((option, i) => (
                  <SelectItem key={i} value={String(i)} className="text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${
                          i === 0 ? "bg-blue-500" : "bg-amber-500"
                        }`}
                      />
                      {option}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              disabled={updateAccess.isPending}
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOnOpen(0)}
            >
              Cancel
            </Button>
            <Button
              disabled={
                updateAccess.isPending || previlege === item.modules[0].privilege
              }
              size="sm"
              className="h-7 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700"
              onClick={() =>
                updateAccess.mutateAsync({
                  status: undefined,
                  privilege: previlege,
                })
              }
            >
              {updateAccess.isPending && (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
              Update Privilege
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default memo(ModuleUserItem);
