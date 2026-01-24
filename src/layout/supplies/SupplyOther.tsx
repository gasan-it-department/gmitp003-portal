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
} from "lucide-react";

import { removeList } from "@/db/statements/container";
//
import { Button } from "@/components/ui/button";
import Modal from "@/components/custom/Modal";
import { toast } from "sonner";
import ConfirmDelete from "../ConfirmDelete";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

//stmt
import { getListData } from "@/db/statement";

//props and interface
import { type SupplyBatchProps } from "@/interface/data";
import { formatDate } from "@/utils/date";
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

  if (isFetching) {
    return (
      <div className="w-full h-full flex flex-col gap-4 p-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6">
        <div className="p-4 bg-gray-100 rounded-full mb-4">
          <AlertTriangle className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          List Not Found
        </h3>
        <p className="text-sm text-gray-500 max-w-md text-center">
          The list you're looking for doesn't exist or you don't have permission
          to access it.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col gap-6 p-6">
      {/* List Information Card */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Info className="h-5 w-5 text-blue-600" />
            </div>
            <CardTitle className="text-lg font-semibold">
              List Information
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <Folder className="h-6 w-6 text-gray-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 text-lg mb-1">
                {data.data.title}
              </h3>
              {/* {data.data.description && (
                <p className="text-sm text-gray-600 mb-3">
                  {data.data.description}
                </p>
              )} */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Created: {formatDate(data.data.timestamp)}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  ID: {listId?.slice(-8)}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone Card */}
      <Card className="border border-red-200 shadow-sm">
        <CardHeader className="pb-3 border-b bg-red-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ShieldAlert className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-red-800">
                Danger Zone
              </CardTitle>
              <p className="text-sm text-red-600">
                Irreversible actions - proceed with caution
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              <p className="font-medium mb-1">
                Warning: This action cannot be undone
              </p>
              <p className="text-sm">
                Deleting this list will permanently remove all associated data
                including:
              </p>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-800">
              Data that will be deleted:
            </h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
                All items within this list
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
                Order history and transactions
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
                Activity logs and audit trail
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
                User access permissions
              </li>
            </ul>
          </div>

          <Separator className="my-2" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">
                List: {data.data.title}
              </p>
              <p className="text-xs text-gray-500">
                Last updated: {formatDate(data.data.timestamp)}
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={() => setOnOpen(1)}
              disabled={handleRemoveList.isPending}
            >
              {handleRemoveList.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete List
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <span className="text-lg font-semibold text-red-800">
              Delete List
            </span>
          </div>
        }
        children={
          <ConfirmDelete
            isLoading={handleRemoveList.isPending}
            confirmation={"confirmn"}
            setOnOpen={setOnOpen}
            onFunction={() => {
              handleRemoveList.mutateAsync();
            }}
          />
        }
        loading={handleRemoveList.isPending}
        onOpen={onOpen === 1}
        className="max-w-lg"
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
