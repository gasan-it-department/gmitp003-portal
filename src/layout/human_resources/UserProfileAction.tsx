import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { suspendAccount } from "@/db/statement";
import { sendResetLink } from "@/db/statements/account";
import { Button } from "@/components/ui/button";
import Modal from "@/components/custom/Modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  CirclePause,
  EllipsisVertical,
  Trash,
  UserX,
  ShieldAlert,
  Archive,
  Key,
  AlertTriangle,
  //Ban,
  Info,
  Mail,
} from "lucide-react";

interface Props {
  lineId: string;
  userId: string;
  token: string;
  accountId: string;
  userName?: string;
}

const UserProfileAction = ({
  lineId,
  userId,
  token,
  accountId,
  userName = "User",
}: Props) => {
  const [onOpen, setOnOpen] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: () => suspendAccount(token, userId, lineId, accountId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["user-data", userId],
        refetchType: "active",
      });
      toast.success("Account suspended successfully!");
      setOnOpen(0);
    },
    onError: () => {
      toast.error("Failed to suspend account");
    },
  });

  const resetPasswordLink = useMutation({
    mutationFn: () => sendResetLink(token, userId, accountId, lineId),
    onSuccess: async () => {
      toast.success("Successfully sent!");
      setOnOpen(0);
    },
    onError: () => {
      toast.error("Failed to send reset link");
    },
  });

  const handleSuspendAccount = () => {
    mutateAsync();
  };

  // Close dropdown when modal opens
  useEffect(() => {
    if (onOpen === 1) {
      setDropdownOpen(false);
    }
  }, [onOpen]);

  return (
    <div ref={dropdownRef}>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-neutral-100 data-[state=open]:bg-neutral-100"
          >
            <EllipsisVertical className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48"
          sideOffset={8}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {/* Account Management Section */}
          <div className="px-2 py-1.5">
            <p className="text-xs font-medium text-gray-900">
              Account Management
            </p>
          </div>

          <DropdownMenuItem
            className="cursor-pointer py-2.5 focus:bg-red-50 focus:text-red-600"
            onClick={() => {
              setOnOpen(1);
              setDropdownOpen(false);
            }}
            disabled={isPending}
          >
            <CirclePause className="mr-2 h-4 w-4 text-gray-500" />
            <div className="flex flex-col items-start">
              <span>Suspend Account</span>
              <span className="text-xs text-gray-500 mt-0.5">
                Temporarily disable access
              </span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer py-2.5 focus:bg-red-50 focus:text-red-600"
            onClick={() => setDropdownOpen(false)}
          >
            <UserX className="mr-2 h-4 w-4 text-gray-500" />
            <div className="flex flex-col items-start">
              <span>Deactivate Account</span>
              <span className="text-xs text-gray-500 mt-0.5">
                Permanently disable account
              </span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Data Management Section */}
          <div className="px-2 py-1.5">
            <p className="text-xs font-medium text-gray-900">Data Management</p>
          </div>

          <DropdownMenuItem
            className="cursor-pointer py-2.5 focus:bg-red-50 focus:text-red-600"
            onClick={() => setDropdownOpen(false)}
          >
            <Trash className="mr-2 h-4 w-4 text-gray-500" />
            <div className="flex flex-col items-start">
              <span>Delete User Data</span>
              <span className="text-xs text-gray-500 mt-0.5">
                Remove all personal information
              </span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer py-2.5 focus:bg-amber-50 focus:text-amber-600"
            onClick={() => setDropdownOpen(false)}
          >
            <Archive className="mr-2 h-4 w-4 text-gray-500" />
            <div className="flex flex-col items-start">
              <span>Archive Data</span>
              <span className="text-xs text-gray-500 mt-0.5">
                Move to archive storage
              </span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Security Section */}
          <div className="px-2 py-1.5">
            <p className="text-xs font-medium text-gray-900">Security</p>
          </div>

          <DropdownMenuItem
            className="cursor-pointer py-2.5 focus:bg-blue-50 focus:text-blue-600"
            onClick={() => {
              setOnOpen(2);
              setDropdownOpen(false);
            }}
          >
            <ShieldAlert className="mr-2 h-4 w-4 text-gray-500" />
            <div className="flex flex-col items-start">
              <span>Reset Password</span>
              <span className="text-xs text-gray-500 mt-0.5">
                Force password reset
              </span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer py-2.5 focus:bg-blue-50 focus:text-blue-600"
            onClick={() => setDropdownOpen(false)}
          >
            <Key className="mr-2 h-4 w-4 text-gray-500" />
            <div className="flex flex-col items-start">
              <span>Reset 2FA</span>
              <span className="text-xs text-gray-500 mt-0.5">
                Reset two-factor authentication
              </span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* View Options */}
          <DropdownMenuItem
            className="cursor-pointer py-2.5"
            onClick={() => setDropdownOpen(false)}
          >
            <div className="flex flex-col items-start w-full">
              <span>View Activity Log</span>
              <span className="text-xs text-gray-500 mt-0.5">
                See all user actions
              </span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer py-2.5"
            onClick={() => setDropdownOpen(false)}
          >
            <div className="flex flex-col items-start w-full">
              <span>View Permissions</span>
              <span className="text-xs text-gray-500 mt-0.5">
                Check access levels
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Modal
        title=""
        onOpen={onOpen === 1}
        loading={isPending}
        className="max-w-md"
        setOnOpen={() => {
          if (isPending) return;
          setOnOpen(0);
        }}
        footer={true}
        onFunction={handleSuspendAccount}
      >
        <div className="flex flex-col items-center text-center p-2">
          {/* Warning Icon */}
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Suspend Account
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-6">
            You are about to suspend{" "}
            <span className="font-semibold">{userName}</span>'s account. The
            user will lose access to the system until the suspension is lifted.
          </p>

          {/* Warning Box */}
          <div className="w-full bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 mb-1">
                  Important
                </p>
                <ul className="text-xs text-amber-700 space-y-1 list-disc pl-4">
                  <li>User cannot log in during suspension</li>
                  <li>All active sessions will be terminated</li>
                  <li>Data remains intact for future reactivation</li>
                  <li>Administrators can reverse this action</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
        </div>
      </Modal>

      <Modal
        title=""
        onOpen={onOpen === 2}
        loading={resetPasswordLink.isPending}
        className="max-w-md"
        setOnOpen={() => {
          if (isPending) return;
          setOnOpen(0);
        }}
        footer={true}
        onFunction={() => {
          if (resetPasswordLink.isPending) return;
          resetPasswordLink.mutateAsync();
        }}
      >
        <div className="flex flex-col items-center text-center p-2">
          {/* Email Icon */}
          <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 mb-4">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Send Password Reset Link
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-6">
            A password reset link will be sent to{" "}
            <span className="font-semibold text-blue-600">user</span>'s email
            address.
          </p>

          {/* Information Box */}
          <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 mb-1">
                  What happens next
                </p>
                <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
                  <li>User receives email with password reset link</li>
                  <li>User will be forced to create new password</li>
                  <li>Current sessions remain active until password reset</li>
                  <li>This action is logged in the audit trail</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserProfileAction;
