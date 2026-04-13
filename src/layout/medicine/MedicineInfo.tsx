import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { removeStorage } from "@/db/statements/storage";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import { Package, Calendar, Hash, AlertTriangle, Archive } from "lucide-react";
import { formatDate } from "@/utils/date";
import type { MedicineStorage } from "@/interface/data";
import ConfirmDelete from "../ConfirmDelete";
import Modal from "@/components/custom/Modal";

interface Props {
  item: MedicineStorage;
  token: string;
  lineId: string;
  userId: string;
}

const MedicineInfo = ({ item, token, lineId, userId }: Props) => {
  const [isOpen, setIsOpen] = useState(0);

  const nav = useNavigate();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: () => removeStorage(token, item.id, userId, lineId),
    onSuccess: () => {
      nav(-1);
    },
    onError: (err) => {
      toast.error("TRANSACTION FAILED", {
        description: err.message,
      });
    },
  });
  return (
    <div className="space-y-4">
      {/* Storage Overview Card */}
      <Card className="border shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600" />
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md">
                <Package className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-base font-semibold text-gray-900">
                Storage Overview
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              {item.refNumber}
            </Badge>
          </div>
          <CardDescription className="text-xs mt-1">
            Storage location details and configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500">
                Storage Name
              </label>
              <p className="text-sm font-medium text-gray-900 mt-0.5">
                {item.name}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Reference Number
              </label>
              <div className="flex items-center gap-1 mt-0.5">
                <Hash className="h-3 w-3 text-gray-400" />
                <p className="text-sm font-mono text-gray-700">
                  {item.refNumber}
                </p>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Created Date
              </label>
              <div className="flex items-center gap-1 mt-0.5">
                <Calendar className="h-3 w-3 text-gray-400" />
                <p className="text-sm text-gray-700">
                  {formatDate(item.timestamp)}
                </p>
              </div>
            </div>
          </div>

          {item.desc && (
            <div className="pt-2">
              <label className="text-xs font-medium text-gray-500">
                Description
              </label>
              <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded-md border">
                {item.desc}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-red-500 to-red-600" />
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-100 rounded-md">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <CardTitle className="text-sm font-semibold text-gray-900">
              Danger Zone
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Irreversible actions that cannot be undone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-red-50 rounded-md border border-red-100">
            <div>
              <p className="text-sm font-medium text-red-800">
                Remove Storage Location
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                This will permanently delete this storage location and all
                associated data.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="gap-2 bg-red-600 hover:bg-red-700"
              onClick={() => setIsOpen(1)}
            >
              <Archive className="h-4 w-4" />
              Remove Storage
            </Button>
          </div>
        </CardContent>
      </Card>
      <Modal
        title={undefined}
        children={
          <ConfirmDelete
            confirmation={"confirm"}
            setOnOpen={() => {
              if (isPending) return;
              setIsOpen(0);
            }}
            onFunction={async () => {
              mutateAsync();
            }}
            isLoading={isPending}
          />
        }
        onOpen={isOpen === 1}
        className={""}
        footer={1}
        setOnOpen={() => {
          if (isPending) return;
          setIsOpen(0);
        }}
      />
    </div>
  );
};

export default MedicineInfo;
