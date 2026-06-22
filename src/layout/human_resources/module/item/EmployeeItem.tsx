import { memo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axios from "@/db/axios";
import { useParams } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Modal from "@/components/custom/Modal";
import {
  Mail,
  Building,
  Shield,
  UserPlus,
  AtSign,
  Loader2,
} from "lucide-react";

import { getInitials } from "@/utils/helper";
import { searchedChar } from "@/utils/element";

import type { User as UserProps } from "@/interface/data";

interface Props {
  item: UserProps;
  module: string;
  query: string;
  token: string;
  lineId: string;
  currUserId: string;
}

const EmployeeItem = ({
  item,
  query,
  module,
  token,
  lineId,
  currUserId,
}: Props) => {
  const [onOpen, setOnOpen] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { moduleId } = useParams();

  const grant = async () => {
    setSubmitting(true);
    try {
      const response = await axios.post(
        "/module/add/acces",
        {
          userId: item.id,
          lineId,
          module,
          currUserId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        },
      );

      if (response.status !== 200) {
        toast.error("Failed", { description: response.data.message });
        return;
      }
      toast.success("Module access granted");
      setOnOpen(0);

      // Refresh the module-users list so the new user shows up immediately
      await queryClient.invalidateQueries({
        queryKey: ["module-users", moduleId, lineId],
      });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        (err instanceof Error ? err.message : "Failed to submit");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const fullName = `${item.firstName ?? ""} ${item.lastName ?? ""}`.trim();

  return (
    <>
      <div className="border rounded-lg bg-white hover:border-blue-200 hover:bg-blue-50/30 transition-all px-3 py-2.5 flex items-center gap-2.5">
        <Avatar className="h-8 w-8 flex-shrink-0">
          {item.userProfilePictures && (
            <AvatarImage src={item.userProfilePictures.file_url} />
          )}
          <AvatarFallback className="text-[10px] font-medium bg-blue-100 text-blue-700">
            {getInitials(item.firstName)}
            {getInitials(item.lastName)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-900 truncate">
            {searchedChar(query, item.firstName)}{" "}
            {searchedChar(query, item.lastName)}
            {item.middleName && ` ${searchedChar(query, item.middleName)}`}
            {item.suffix && `, ${item.suffix}`}
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
            <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
              <AtSign className="h-2.5 w-2.5" />
              {searchedChar(query, item.username)}
            </span>
            {item.email && (
              <span className="text-[10px] text-gray-500 flex items-center gap-0.5 truncate max-w-[180px]">
                <Mail className="h-2.5 w-2.5" />
                {searchedChar(query, item.email)}
              </span>
            )}
            {item.department && (
              <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                <Building className="h-2.5 w-2.5" />
                {item.department.name}
              </span>
            )}
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setOnOpen(1)}
          className="h-7 px-2.5 text-[10px] gap-1.5 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 flex-shrink-0"
        >
          <UserPlus className="h-3 w-3" />
          Add
        </Button>
      </div>

      {/* Grant Access Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded-md">
              <Shield className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <span className="text-sm font-semibold">Grant Module Access</span>
          </div>
        }
        onOpen={onOpen === 1}
        setOnOpen={() => {
          if (submitting) return;
          setOnOpen(0);
        }}
        className="max-w-sm"
        footer={true}
        onFunction={grant}
        loading={submitting}
        yesTitle="Grant Access"
      >
        <div className="space-y-3 p-1">
          {/* User card */}
          <div className="border rounded-lg bg-gray-50 p-3 flex items-center gap-2.5">
            <Avatar className="h-10 w-10">
              {item.userProfilePictures && (
                <AvatarImage src={item.userProfilePictures.file_url} />
              )}
              <AvatarFallback className="text-xs font-medium bg-blue-100 text-blue-700">
                {getInitials(item.firstName)}
                {getInitials(item.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">
                {fullName}
              </p>
              {item.email && (
                <p className="text-[10px] text-gray-500 truncate flex items-center gap-1">
                  <Mail className="h-2.5 w-2.5" />
                  {item.email}
                </p>
              )}
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 mt-1 bg-blue-50 text-blue-700 border-blue-200 capitalize"
              >
                {module}
              </Badge>
            </div>
          </div>

          <p className="text-[11px] text-gray-500">
            This grants <span className="font-medium capitalize">{module}</span>{" "}
            module access to {fullName || "this user"}.
          </p>

          {submitting && (
            <div className="flex items-center justify-center gap-1.5 py-1 text-gray-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-[10px]">Granting access...</span>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default memo(EmployeeItem);
