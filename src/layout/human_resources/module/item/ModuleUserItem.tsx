import { useState, memo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

//
import { removeModuleAccess, updateModuleAccess } from "@/db/statements/module";

//
import { searchedChar } from "@/utils/element";
//
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { addModuleUserPrevilege } from "@/utils/helper";
//
import Modal from "@/components/custom/Modal";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

//
import {
  MoreVertical,
  UserX,
  UserCheck,
  ShieldOff,
  AlertCircle,
  Shield,
} from "lucide-react";

const moduleStatus = ["Suspended", "Active"];

//interface/props
import type { User } from "@/interface/data";

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

  const handleActionClick = (actionNumber: number) => {
    setOnOpen(actionNumber);
    setDropdownOpen(false);
  };

  const removeAccess = useMutation({
    mutationFn: () =>
      removeModuleAccess(token, item.id, userId, moduleId, lineId),
    onError: (err) => {
      console.log({ err });

      toast.error("TRANSACTION FAILED", {
        description: err.message,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["module-users", moduleId, lineId, query],
        refetchType: "active",
      });
      setOnOpen(0);

      toast.success("REMOVE SUCCESSFULLY");
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
        privilege
      ),
    onError: (err) => {
      console.log({ err });
      toast.error("TRANSACTION FAILED", {
        description: err.message,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["module-users", moduleId, lineId, query],
        refetchType: "active",
      });
      setOnOpen(0);
      toast.success("UDATE SUCCESSFULLY");
    },
  });

  return (
    <>
      <TableRow className="hover:bg-gray-50 transition-colors">
        <TableCell className="font-medium">{no + 1}</TableCell>
        <TableCell className="font-medium text-blue-600">
          {searchedChar(query, item.username)}
        </TableCell>
        <TableCell>{searchedChar(query, item.lastName)}</TableCell>
        <TableCell>{searchedChar(query, item.firstName)}</TableCell>
        <TableCell>
          {addModuleUserPrevilege[item.modules[0].privilege]}
        </TableCell>
        <TableCell>{moduleStatus[item.modules[0].status]}</TableCell>
        <TableCell className="text-right">
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48"
              onInteractOutside={() => setDropdownOpen(false)}
            >
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                onClick={() => handleActionClick(1)}
              >
                <UserX className="mr-2 h-4 w-4" />
                Remove from module
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 cursor-pointer"
                onClick={() => handleActionClick(2)}
              >
                <UserCheck className="mr-2 h-4 w-4" />
                {item.modules[0].status === 1
                  ? "Suspend user"
                  : "Activate user"}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                onClick={() => handleActionClick(3)}
              >
                <ShieldOff className="mr-2 h-4 w-4" />
                Change privilege
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {/* Remove Access Modal */}
      <Modal
        title={undefined}
        footer={1}
        loading={removeAccess.isPending}
        onOpen={onOpen === 1}
        className="max-w-md"
        onFunction={() => {
          removeAccess.mutateAsync();
        }}
        setOnOpen={() => {
          if (removeAccess.isPending) return;
          setOnOpen(0);
        }}
      >
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
            <UserX className="h-5 w-5 text-red-500" />
            <div className="flex-1">
              <p className="font-medium text-red-700">
                Remove User from Module
              </p>
              <p className="text-sm text-red-600 mt-1">
                This action will remove{" "}
                <span className="font-semibold">{item.username}</span> from
                accessing this module.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">User Details:</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>
                <span className="ml-2 font-medium">
                  {item.firstName} {item.lastName}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Username:</span>
                <span className="ml-2 font-medium">{item.username}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">
                  Current Privilege:
                  {item.modules[0].privilege}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              disabled={removeAccess.isPending}
              variant="outline"
              size="sm"
              onClick={() => setOnOpen(0)}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              disabled={removeAccess.isPending}
              variant="destructive"
              size="sm"
              onClick={() => {
                removeAccess.mutateAsync();
              }}
            >
              Remove User
            </Button>
          </div>
        </div>
      </Modal>

      {/* Suspend/Activate Access Modal */}
      <Modal
        footer={1}
        title={
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-5 w-5" />
            {item.modules[0].status === 1
              ? "Suspend Access"
              : "Activate Access"}
          </div>
        }
        onOpen={onOpen === 2}
        className="max-w-md"
        setOnOpen={() => {
          setOnOpen(0);
        }}
      >
        <div className="space-y-4 py-2">
          <div
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              item.modules[0].status === 1
                ? "bg-amber-50 border-amber-100"
                : "bg-green-50 border-green-100"
            }`}
          >
            <UserCheck
              className={`h-5 w-5 ${
                item.modules[0].status === 1
                  ? "text-amber-500"
                  : "text-green-500"
              }`}
            />
            <div className="flex-1">
              <p
                className={`font-medium ${
                  item.modules[0].status === 1
                    ? "text-amber-700"
                    : "text-green-700"
                }`}
              >
                {item.modules[0].status === 1
                  ? "Suspend User Access"
                  : "Activate User Access"}
              </p>
              <p
                className={`text-sm mt-1 ${
                  item.modules[0].status === 1
                    ? "text-amber-600"
                    : "text-green-600"
                }`}
              >
                {item.modules[0].status === 1
                  ? `Temporarily suspend ${item.username}'s access to this module.`
                  : `Restore ${item.username}'s access to this module.`}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="col-span-2">
                <span className="text-gray-500">User:</span>
                <span className="ml-2 font-medium">
                  {item.firstName} {item.lastName}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Current Status:</span>
                <span
                  className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    item.modules[0].status === 1
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {item.modules[0].status === 1 ? "Active" : "Suspended"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">New Status:</span>
                <span
                  className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    item.modules[0].status === 1
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {item.modules[0].status === 1 ? "Suspended" : "Active"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              disabled={updateAccess.isPending}
              variant="outline"
              size="sm"
              onClick={() => setOnOpen(0)}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              variant={item.modules[0].status === 1 ? "destructive" : "default"}
              size="sm"
              className={
                item.modules[0].status === 1
                  ? ""
                  : "bg-green-600 hover:bg-green-700"
              }
              onClick={() => {
                if (updateAccess.isPending) return;
                updateAccess.mutateAsync({ status: 0, privilege: undefined });
              }}
            >
              {item.modules[0].status === 1 ? "Suspend User" : "Activate User"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Update Privilege Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-blue-600">
            <Shield className="h-5 w-5" />D Update Privilege
          </div>
        }
        onOpen={onOpen === 3}
        className="max-w-md"
        setOnOpen={() => {
          setOnOpen(0);
        }}
        footer={1}
      >
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <ShieldOff className="h-5 w-5 text-blue-500" />
            <div className="flex-1">
              <p className="font-medium text-blue-700">Change User Privilege</p>
              <p className="text-sm text-blue-600 mt-1">
                Update access level for{" "}
                <span className="font-semibold">{item.username}</span>
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="col-span-2">
                <span className="text-gray-500">User:</span>
                <span className="ml-2 font-medium">
                  {item.firstName} {item.lastName}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Current Privilege:</span>
                {item.modules[0].privilege}
              </div>
              <div>
                <span className="text-gray-500">Module:</span>
                <span className="ml-2 font-medium capitalize">
                  {item.modules[0].moduleName}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="newPrivilege" className="text-sm font-medium">
              Select New Privilege Level
            </Label>
            <Select
              onValueChange={(e) => setPrevilege(parseInt(e, 2))}
              defaultValue={addModuleUserPrevilege[item.modules[0].privilege]}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select privilege level" />
              </SelectTrigger>
              <SelectContent>
                {addModuleUserPrevilege.map((option, i) => (
                  <SelectItem key={option.toString()} value={i.toString()}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full`} />
                      {option}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOnOpen(0)}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                if (updateAccess.isPending) return;
                updateAccess.mutateAsync({
                  status: undefined,
                  privilege: previlege,
                });
              }}
            >
              Update Privilege
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default memo(ModuleUserItem);
