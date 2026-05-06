import { useNavigate } from "react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  Loader2,
  AlertTriangle,
  Trash2,
  Info,
  Calendar,
  Folder,
  ShieldAlert,
  Database,
} from "lucide-react";

import { removeList } from "@/db/statements/container";
//
import { Button } from "@/components/ui/button";
import Modal from "@/components/custom/Modal";
import { toast } from "sonner";
import ConfirmDelete from "../ConfirmDelete";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
//stmt
import { getListData } from "@/db/statement";

//props and interface
import { type SupplyBatchProps } from "@/interface/data";
import { formatDate } from "@/utils/date";
import axios from "@/db/axios";
interface Props {
  listId: string | undefined;
  token: string | undefined;
  userId: string;
  lineId: string;
  containerId: string;
}

const SupplyOther = ({ listId, token, userId, lineId, containerId }: Props) => {
  const [onOpen, setOnOpen] = useState(0);
  const queryClient = useQueryClient();
  const nav = useNavigate();

  const { isFetching, data } = useQuery<{ data: SupplyBatchProps }>({
    queryKey: ["list", listId],
    queryFn: () => getListData(token as string, listId as string),
  });

  const handleRemoveList = useMutation({
    mutationFn: () =>
      removeList(token as string, listId as string, userId, lineId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["container", containerId],
        refetchType: "active",
      });
      nav(-1);
    },
    onError: (err) => {
      toast.error("TRANSACTION FAILED", {
        description: err.message,
      });
    },
    onMutate: () => {
      setOnOpen(1);
    },
  });

  const handlebackupdata = async () => {
    if (!lineId || !userId) {
      throw new Error("INVALID REQUIRED ID");
    }
    try {
      const response = await axios.post(
        "/line/inventory/back-up",
        {
          lineId: lineId,
          userId: userId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers["content-disposition"];
      let filename = "inventory-backup.json";

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const backupMutation = useMutation({
    mutationFn: handlebackupdata,
  });

  if (isFetching) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="space-y-3">
          <div className="border rounded-lg p-3 bg-white">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-full mt-2" />
            <Skeleton className="h-3 w-3/4 mt-1" />
          </div>
          <div className="border rounded-lg p-3 bg-white">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-28 mt-3" />
          </div>
          <div className="border rounded-lg p-3 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-10 w-full mt-2" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="border rounded-lg p-6 text-center bg-white max-w-md">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-700 mb-1">
            List Not Found
          </h3>
          <p className="text-sm text-gray-500">
            The list doesn't exist or you don't have permission.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-3 space-y-3">
        {/* List Information Card - Compact */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <Info className="h-3.5 w-3.5 text-blue-600" />
              <h3 className="text-xs font-semibold text-gray-800">
                List Information
              </h3>
            </div>
          </div>
          <div className="p-3">
            <div className="flex items-start gap-2">
              <div className="p-1.5 bg-gray-100 rounded-md">
                <Folder className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 mb-0.5">
                  {data.data.title}
                </h4>
                <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      Created: {formatDate(data.data.timestamp)}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    ID: {listId?.slice(-8)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Backup Card - Compact */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <Database className="h-3.5 w-3.5 text-blue-600" />
              <h3 className="text-xs font-semibold text-gray-800">Data</h3>
            </div>
          </div>
          <div className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-100 rounded-md">
                <Folder className="h-4 w-4 text-gray-600" />
              </div>
              <Button
                disabled={backupMutation.isPending}
                size="sm"
                onClick={() => backupMutation.mutateAsync()}
                className="gap-1.5 h-7 text-xs"
              >
                {backupMutation.isPending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Database className="h-3 w-3" />
                    Download Back-Up Data
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Danger Zone Card - Compact */}
        <div className="border border-red-200 rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b bg-red-50">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
              <div>
                <h3 className="text-xs font-semibold text-red-800">
                  Danger Zone
                </h3>
                <p className="text-[10px] text-red-600">Irreversible actions</p>
              </div>
            </div>
          </div>
          <div className="p-3 space-y-3">
            <div className="rounded-md bg-red-50 p-2 border border-red-200">
              <div className="flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-medium text-red-800">
                    Warning: This action cannot be undone
                  </p>
                  <p className="text-[10px] text-red-700 mt-0.5">
                    Deleting this list will permanently remove all associated
                    data.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-800">
                  List: {data.data.title}
                </p>
                <p className="text-[10px] text-gray-500">
                  Last updated: {formatDate(data.data.timestamp)}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5 h-7 text-xs"
                onClick={() => setOnOpen(1)}
                disabled={handleRemoveList.isPending}
              >
                {handleRemoveList.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
                Delete List
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal - Compact */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-100 rounded-md">
              <Trash2 className="h-3.5 w-3.5 text-red-600" />
            </div>
            <span className="text-sm font-semibold text-red-800">
              Delete List
            </span>
          </div>
        }
        children={
          <ConfirmDelete
            isLoading={handleRemoveList.isPending}
            confirmation={"confirm"}
            setOnOpen={setOnOpen}
            onFunction={() => {
              handleRemoveList.mutateAsync();
            }}
          />
        }
        loading={handleRemoveList.isPending}
        onOpen={onOpen === 1}
        className="max-w-md w-[90vw]"
        setOnOpen={() => {
          if (handleRemoveList.isPending) return;
          setOnOpen(0);
        }}
        footer={1}
      />
    </div>
  );
};

export default SupplyOther;
