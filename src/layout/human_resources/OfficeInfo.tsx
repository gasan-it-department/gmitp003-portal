import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { isAxiosError } from "axios";

import { deleteUnit } from "@/db/statements/unit";
import { updateUnit } from "@/db/statement";
import { AddUnitSchema } from "@/interface/zod";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Modal from "@/components/custom/Modal";
import ConfirmDelete from "../ConfirmDelete";

import {
  Building2,
  Mail,
  Calendar,
  Users,
  Edit,
  UserCircle,
  Trash2,
  AlertTriangle,
  Loader2,
  Hash,
} from "lucide-react";

import type { AddUnitProps, Department } from "@/interface/data";

interface Props {
  unit: Department;
  token: string;
  userId: string;
  lineId: string;
}

const surfaceErr = (err: unknown, fallback: string) =>
  isAxiosError(err)
    ? err.response?.data?.message ?? err.message
    : err instanceof Error
      ? err.message
      : fallback;

const fmtDate = (date?: string | null) =>
  date
    ? new Date(date).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

const OfficeInfo = ({ unit, lineId, userId, token }: Props) => {
  const [onOpen, setOnOpen] = useState(0); // 0 closed · 1 delete · 2 edit
  const nav = useNavigate();
  const queryClient = useQueryClient();

  const userCount = unit._count?.users ?? 0;
  const canDelete = userCount === 0;

  const editForm = useForm<AddUnitProps>({
    resolver: zodResolver(AddUnitSchema),
    defaultValues: {
      name: unit.name ?? "",
      description: unit.description ?? "",
    },
  });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["unit", unit.id] }),
      queryClient.invalidateQueries({ queryKey: ["departments", lineId] }),
    ]);
  };

  const editMut = useMutation({
    mutationFn: (vals: AddUnitProps) =>
      updateUnit(token, {
        id: unit.id,
        name: vals.name,
        description: vals.description,
        userId,
        lineId,
      }),
    onSuccess: async () => {
      await refresh();
      toast.success("Unit updated");
      setOnOpen(0);
    },
    onError: (err) => toast.error(surfaceErr(err, "Failed to update unit")),
  });

  const removeMut = useMutation({
    mutationFn: () => deleteUnit(token, unit.id, userId, lineId),
    onSuccess: async () => {
      await refresh();
      toast.success("Unit removed");
      nav(-1);
    },
    onError: (err) => toast.error(surfaceErr(err, "Failed to remove unit")),
  });

  const statTiles: {
    label: string;
    value: React.ReactNode;
    icon: React.ReactNode;
    accent: string;
  }[] = [
    {
      label: "Total Members",
      value: userCount,
      icon: <Users className="h-3 w-3 text-white" />,
      accent: "from-blue-500 to-blue-600",
    },
    {
      label: "Department Head",
      value: unit.head
        ? `${unit.head.firstName ?? ""} ${unit.head.lastName ?? ""}`.trim()
        : "Not assigned",
      icon: <UserCircle className="h-3 w-3 text-white" />,
      accent: "from-purple-500 to-purple-600",
    },
    {
      label: "Created",
      value: fmtDate(unit.createdAt),
      icon: <Calendar className="h-3 w-3 text-white" />,
      accent: "from-amber-500 to-amber-600",
    },
  ];

  return (
    <div className="w-full h-full overflow-auto p-3">
      <div className="max-w-4xl mx-auto space-y-3">

        {/* Identity card */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3 w-3 text-blue-500" />
              <h3 className="text-xs font-semibold text-gray-800">
                Office Information
              </h3>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px] gap-1.5"
              onClick={() => {
                editForm.reset({
                  name: unit.name ?? "",
                  description: unit.description ?? "",
                });
                setOnOpen(2);
              }}
            >
              <Edit className="h-3 w-3" />
              Edit
            </Button>
          </div>

          <div className="p-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 rounded">
                <Building2 className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {unit.name ?? "Untitled"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {userCount} member{userCount === 1 ? "" : "s"}
                  </Badge>
                  {unit.email && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      <Mail className="h-2.5 w-2.5 mr-0.5" />
                      {unit.email}
                    </Badge>
                  )}
                  <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                    <Hash className="h-2.5 w-2.5" />
                    <span className="font-mono">{unit.id.slice(0, 8)}</span>
                  </span>
                </div>
              </div>
            </div>

            {unit.description && (
              <p className="text-[11px] text-gray-700 leading-relaxed bg-gray-50 border rounded p-2">
                {unit.description}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {statTiles.map((t) => (
            <div
              key={t.label}
              className="border rounded-md bg-white p-2 overflow-hidden"
            >
              <div
                className={`h-0.5 bg-gradient-to-r ${t.accent} rounded-full mb-1.5`}
              />
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-medium text-gray-600">
                  {t.label}
                </p>
                <div className={`p-1 rounded bg-gradient-to-br ${t.accent}`}>
                  {t.icon}
                </div>
              </div>
              <p className="text-xs font-semibold text-gray-900 truncate">
                {t.value}
              </p>
            </div>
          ))}
        </div>

        {/* Danger zone */}
        <div className="border border-red-200 rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b border-red-100 bg-red-50 flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3 text-red-600" />
            <div>
              <h3 className="text-xs font-semibold text-red-900">
                Danger Zone
              </h3>
              <p className="text-[10px] text-red-700 leading-none mt-0.5">
                Irreversible actions
              </p>
            </div>
          </div>
          <div className="p-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2.5 bg-red-50 rounded-md border border-red-100">
              <div className="min-w-0">
                <p className="text-xs font-medium text-red-800">
                  Delete this unit
                </p>
                <p className="text-[10px] text-red-600 mt-0.5">
                  {canDelete
                    ? "Permanently removes the unit. The audit log entry stays."
                    : `Cannot delete — ${userCount} user${userCount === 1 ? "" : "s"} still assigned.`}
                </p>
              </div>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 text-[10px] gap-1.5 bg-red-600 hover:bg-red-700 flex-shrink-0"
                onClick={() => setOnOpen(1)}
                disabled={removeMut.isPending || !canDelete}
              >
                {removeMut.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
                Delete Unit
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      <Modal
        title={undefined}
        children={
          <ConfirmDelete
            title="Delete unit"
            confirmation="confirm"
            setOnOpen={() => {
              if (!removeMut.isPending) setOnOpen(0);
            }}
            onFunction={() => {
              if (!removeMut.isPending) removeMut.mutateAsync();
            }}
            isLoading={removeMut.isPending}
          />
        }
        footer={1}
        onOpen={onOpen === 1}
        className=""
        setOnOpen={() => {
          if (removeMut.isPending) return;
          setOnOpen(0);
        }}
      />

      {/* Edit modal */}
      <Modal
        title="Edit Unit"
        onOpen={onOpen === 2}
        className="max-w-md"
        setOnOpen={() => {
          if (editMut.isPending) return;
          setOnOpen(0);
        }}
        footer={true}
        yesTitle="Save Changes"
        onFunction={editForm.handleSubmit((v) => editMut.mutateAsync(v))}
        loading={editMut.isPending}
      >
        <Form {...editForm}>
          <div className="space-y-3">
            <FormField
              control={editForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold text-gray-700">
                    Name *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={editMut.isPending}
                      className="h-8 text-xs"
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />
            <FormField
              control={editForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold text-gray-700">
                    Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      disabled={editMut.isPending}
                      className="min-h-[80px] text-xs resize-y"
                    />
                  </FormControl>
                  <FormDescription className="text-[10px]">
                    Optional — describe this unit's role.
                  </FormDescription>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default OfficeInfo;
