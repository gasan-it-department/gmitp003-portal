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
  ShieldCheck,
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
  /** True when this user already has the module — show a badge, not "Add". */
  alreadyHasAccess?: boolean;
}

const EmployeeItem = ({
  item,
  query,
  module,
  token,
  lineId,
  currUserId,
  alreadyHasAccess,
}: Props) => {
  const [onOpen, setOnOpen] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  // SNAPSHOT of the person whose Add button was clicked. The list can
  // refetch/reorder underneath an open modal (debounced search), so the
  // modal and the grant request read from this frozen copy — never from
  // the live row prop, which may silently become a different user.
  const [target, setTarget] = useState<UserProps | null>(null);
  const queryClient = useQueryClient();
  const { moduleId } = useParams();

  const person = target ?? item;

  const grant = async () => {
    setSubmitting(true);
    try {
      const response = await axios.post(
        "/module/add/acces",
        {
          userId: person.id,
          // Double-key: the server refuses the grant if this username and
          // the id don't belong to the SAME account — a stale or mismatched
          // list can never grant the wrong person.
          username: person.username,
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
      // The API echoes WHO the grant actually landed on. The identity the
      // admin verified on screen is the @USERNAME (it's on the confirm
      // button) — so a different id with the SAME username is fine: the
      // server resolved a stale cached id to the person's current account.
      // Only a different USERNAME is a real mismatch.
      const grantee = response.data?.grantee as
        | { id: string; username?: string | null }
        | undefined;
      if (
        grantee?.username &&
        person.username &&
        grantee.username !== person.username
      ) {
        toast.error("Grant mismatch — please report this", {
          description: `The server processed @${grantee.username} but you selected @${person.username}. Refresh the page.`,
          duration: 12000,
        });
        return;
      }
      if (response.data?.alreadyHad) {
        toast.info(
          response.data?.message ??
            "This user already has access to this module.",
        );
      } else {
        toast.success(response.data?.message ?? "Module access granted");
      }
      setOnOpen(0);

      // Flip THIS row from the server's own answer (truth-from-response) —
      // even if a refetch lags or is scoped oddly, the badge reflects what
      // the server just confirmed it did.
      const markedId = grantee?.id ?? person.id;
      queryClient.setQueryData(
        ["module-member-ids", moduleId, lineId],
        (old: { list?: Array<{ id: string }> } | undefined) => {
          const list = old?.list ?? [];
          if (list.some((u) => u.id === markedId)) return old;
          return { ...(old ?? {}), list: [...list, { id: markedId }] };
        },
      );

      // Refresh the module-users list so the new user shows up immediately,
      // and the add-page member set so this row flips to "Has access".
      await queryClient.invalidateQueries({
        queryKey: ["module-users", moduleId, lineId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["module-member-ids", moduleId, lineId],
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

        {alreadyHasAccess ? (
          <Badge
            variant="outline"
            className="h-7 px-2.5 text-[10px] gap-1 bg-emerald-50 text-emerald-700 border-emerald-200 flex-shrink-0 flex items-center"
          >
            <ShieldCheck className="h-3 w-3" />
            Has access
          </Badge>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              // Freeze WHO was clicked before opening the modal — the list
              // may refetch and put a different user under this row.
              setTarget(item);
              setOnOpen(1);
            }}
            className="h-7 px-2.5 text-[10px] gap-1.5 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 flex-shrink-0"
          >
            <UserPlus className="h-3 w-3" />
            Add
          </Button>
        )}
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
          setTarget(null);
        }}
        className="max-w-sm"
        footer={true}
        onFunction={grant}
        loading={submitting}
        yesTitle={`Grant to @${person.username}`}
      >
        <div className="space-y-3 p-1">
          {/* User card — rendered from the SNAPSHOT taken at click time */}
          <div className="border rounded-lg bg-gray-50 p-3 flex items-center gap-2.5">
            <Avatar className="h-10 w-10">
              {person.userProfilePictures && (
                <AvatarImage src={person.userProfilePictures.file_url} />
              )}
              <AvatarFallback className="text-xs font-medium bg-blue-100 text-blue-700">
                {getInitials(person.firstName)}
                {getInitials(person.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">
                {`${person.firstName ?? ""} ${person.lastName ?? ""}`.trim()}
              </p>
              {/* The account that will receive access — impossible to miss */}
              <p className="text-sm font-bold text-blue-700 flex items-center gap-0.5">
                <AtSign className="h-3.5 w-3.5" />
                {person.username}
              </p>
              {person.email && (
                <p className="text-[10px] text-gray-500 truncate flex items-center gap-1">
                  <Mail className="h-2.5 w-2.5" />
                  {person.email}
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
            module access to the account{" "}
            <span className="font-semibold text-gray-700">
              @{person.username}
            </span>{" "}
            only. Check the username before confirming.
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
