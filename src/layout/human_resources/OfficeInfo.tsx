import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
//
import { deleteUnit } from "@/db/statements/unit";

import { Button } from "@/components/ui/button";
import ConfirmDelete from "../ConfirmDelete";
import { toast } from "sonner";
//icons
import {
  Building2,
  Mail,
  Calendar,
  Users,
  Edit,
  UserCircle,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import Modal from "@/components/custom/Modal";
//interface
import type { Department } from "@/interface/data";

interface Props {
  unit: Department;
  token: string;
  userId: string;
  lineId: string;
}

const OfficeInfo = ({ unit, lineId, userId, token }: Props) => {
  const [onOpen, setOpen] = useState(0);
  const nav = useNavigate();
  const queryClient = useQueryClient();
  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const { mutateAsync, isPending } = useMutation({
    mutationFn: () => deleteUnit(token, unit.id, userId, lineId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["departments", lineId],
        refetchType: "active",
      });
      nav(-1);
    },
    onError: () => {
      toast.error("TRANSACTION FAILED");
    },
  });

  return (
    <div className="w-full h-full p-6 bg-gray-50/30 overflow-auto">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-md">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{unit.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200"
                >
                  {unit._count?.users || 0} Members
                </Badge>
                {unit.email && (
                  <Badge variant="outline" className="bg-gray-50 text-gray-600">
                    <Mail className="w-3 h-3 mr-1" />
                    {unit.email}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Edit className="h-4 w-4" />
            Edit Office
          </Button>
        </div>

        {/* Description Card */}
        {unit.description && (
          <Card className="border border-gray-200 bg-white">
            <CardContent className="pt-6">
              <p className="text-gray-700 leading-relaxed">
                {unit.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-gray-200 bg-white">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">
                  {unit._count?.users || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-2 bg-purple-50 rounded-lg">
                <UserCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Department Head</p>
                <p className="text-base font-medium text-gray-900">
                  {unit.head
                    ? `${unit.head.firstName} ${unit.head.lastName}`
                    : "Not Assigned"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 bg-white">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="text-base font-medium text-gray-900">
                  {formatDate(unit.createdAt)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <div className="text-xs text-gray-400 text-center pt-4">
          Unit ID: {unit.id} • Last updated: {formatDate(unit.createdAt)}
        </div>

        {/* DANGER ZONE - Redesigned Section */}
        <div className=" pt-6 border-t-2 border-red-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-red-800">
                Danger Zone
              </h3>
              <p className="text-sm text-gray-500">
                Irreversible and destructive actions
              </p>
            </div>
          </div>

          <Card className="border-red-200 bg-red-50/30">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    Delete this unit
                  </h4>
                  <p className="text-sm text-gray-500">
                    Once you delete this unit, all associated data will be
                    permanently removed. This action cannot be undone.
                  </p>
                </div>
                <Button
                  size="default"
                  variant="destructive"
                  onClick={() => {
                    if (isPending) return;
                    setOpen(1);
                  }}
                  className="shrink-0 gap-2 shadow-sm hover:shadow-md transition-all"
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  {isPending ? "Deleting..." : "Delete Unit"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        title={undefined}
        children={
          <ConfirmDelete
            confirmation={"confirm"}
            setOnOpen={setOpen}
            onFunction={() => {
              mutateAsync();
            }}
            isLoading={isPending}
          />
        }
        footer={1}
        onOpen={onOpen === 1}
        className={""}
        setOnOpen={() => {
          if (isPending) return;
          setOpen(0);
        }}
      />
    </div>
  );
};

export default OfficeInfo;
