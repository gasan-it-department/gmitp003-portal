import { useMutation, type QueryClient } from "@tanstack/react-query";
import {
  upadateRequestStatus,
  deleteDocumentRoomRequest,
} from "@/db/statements/document";
import { useNavigate } from "react-router";

import { TableCell, TableRow } from "@/components/ui/table";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  MapPin,
  MoreVertical,
  Trash,
  Info,
} from "lucide-react";
import { memo, useState } from "react";
import Modal from "@/components/custom/Modal";
import type { RoomRegistration } from "@/interface/data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import ConfirmDelete from "@/layout/ConfirmDelete";

interface Props {
  item: RoomRegistration;
  userId: string;
  lineId: string;
  token: string;
  queryClient: QueryClient;
}

const RoomRequestItem = ({
  item,
  token,
  userId,
  lineId,
  queryClient,
}: Props) => {
  const [onOpen, setOnOpen] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const nav = useNavigate();

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 1:
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 2:
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700">
            Unknown
          </Badge>
        );
    }
  };

  const handleDeleteClick = () => {
    // Close dropdown first
    setDropdownOpen(false);
    // Small timeout to ensure dropdown closes before modal opens
    setTimeout(() => {
      setOnOpen(1);
    }, 100);
  };

  const updateRequestStatus = useMutation({
    mutationFn: ({ status }: { status: number }) =>
      upadateRequestStatus(token, item.id, lineId, userId, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["room-request", lineId],
        refetchType: "active",
      });
      setOnOpen(0);
    },
    onError: (err) => {
      toast.error("TRANSACTION FAILED", {
        description: err.message,
      });
    },
  });

  const deleteRequestMutation = useMutation({
    mutationFn: () => deleteDocumentRoomRequest(token, item.id, userId, lineId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["room-request", lineId],
        refetchType: "active",
      });
      setOnOpen(0);
    },
    onError: (err) => {
      toast.error("TRANSACTION FAILED", {
        description: err.message,
      });
    },
  });

  return (
    <>
      <TableRow className="hover:bg-gray-50 transition-colors">
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="font-mono text-sm">
              {item.id.substring(0, 8)}...
            </span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <p className="font-medium truncate">
                {item.user?.firstName || "Unknown User"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {item.user?.email}
              </p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="max-w-[200px]">
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <span className="truncate">{item.address}</span>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline">{item.line?.name || "N/A"}</Badge>
        </TableCell>
        <TableCell>{getStatusBadge(item.status)}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span className="text-sm">
              {item.timestamp
                ? new Date(item.timestamp).toLocaleDateString()
                : "N/A"}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex -space-x-2">
            {item.receivers?.slice(0, 3).map((receiver) => (
              <Avatar
                key={receiver.id}
                className="w-6 h-6 border-2 border-white"
              >
                {/* <AvatarFallback className="text-xs">
                  {receiver.name?.[0] || "?"}
                </AvatarFallback> */}
              </Avatar>
            ))}
            {item.receivers?.length > 3 && (
              <Avatar className="w-6 h-6 border-2 border-white bg-gray-100">
                <AvatarFallback className="text-xs">
                  +{item.receivers.length - 3}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </TableCell>
        <TableCell className="text-right">
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => nav(`request/${item.id}`)}>
                <Info />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 flex items-center"
                onClick={handleDeleteClick}
              >
                <Trash />
                Delete Request
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      <Modal
        title={undefined}
        onOpen={onOpen === 1}
        footer={1}
        setOnOpen={() => setOnOpen(0)}
        className="z-[9999]"
      >
        <ConfirmDelete
          confirmation={"confirm"}
          setOnOpen={setOnOpen}
          onFunction={() => {
            if (deleteRequestMutation.isPending) return;
            deleteRequestMutation.mutateAsync();
          }}
          isLoading={deleteRequestMutation.isPending}
        />
      </Modal>

      <Modal
        title="Approve request"
        onOpen={onOpen === 2}
        className={""}
        setOnOpen={() => {
          if (updateRequestStatus.isPending) return;

          setOnOpen(0);
        }}
      >
        <div className=" w-full"></div>
      </Modal>
    </>
  );
};

export default memo(RoomRequestItem);
