import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  getDataSetData,
  handleExportDataSetSupplies,
  deleteDataSet,
} from "@/db/statement";
import { useForm } from "react-hook-form";
import { useAuth } from "@/provider/ProtectedRoute";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/db/axios";
import hotkeys from "hotkeys-js";

import {
  type SuppliesDataSetProps,
  type AddNewSupplyProps,
} from "@/interface/data";
import { AddNewSupplySchema } from "@/interface/zod";

//
import { Button } from "@/components/ui/button";
import DataSetSupplies from "@/layout/supplies/DataSetSupplies";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Modal from "@/components/custom/Modal";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

//icons
import {
  EllipsisVertical,
  SquarePlus,
  CloudUpload,
  CopyCheck,
  Sheet,
  Trash2,
  Database,
  Package,
  AlertTriangle,
  Loader2,
  FileUp,
  Key,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const DataSet = () => {
  const [onOpen, setOnOpen] = useState(0);
  const [onSelect, setOnSelect] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);

  const auth = useAuth();
  const queryClient = useQueryClient();
  const nav = useNavigate();

  const form = useForm<AddNewSupplyProps>({
    resolver: zodResolver(AddNewSupplySchema),
    defaultValues: {
      comsumable: false,
      desc: "",
      name: "",
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    setError,
    setValue,
    control,
  } = form;

  const { dataSetId, lineId, containerId } = useParams();
  const { data, isFetching } = useQuery<{
    data: SuppliesDataSetProps;
  }>({
    queryFn: () => getDataSetData(auth.token as string, dataSetId as string),
    queryKey: ["dataSetData", dataSetId],
    enabled: !!dataSetId,
  });

  const handleSubmitFile = async () => {
    if (!file || !lineId || !dataSetId) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("lineId", lineId);
    formData.append("dataSetId", dataSetId);

    try {
      const response = await axios.post("/supply/upload-excel", formData, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "multipart/form-data",
        },
        transformRequest: (data) => data,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1),
          );
          setUploadProgress(percentCompleted);
        },
      });

      if (response.status !== 200) {
        throw new Error(response.data.message);
      }
      await queryClient.invalidateQueries({
        queryKey: ["dataSetSupplies", dataSetId],
        refetchType: "active",
      });
      return response.data;
    } catch (error) {
      console.error("Full error:", `${error}`);
      throw error;
    }
  };

  const { mutateAsync, isPending } = useMutation({
    mutationFn: handleSubmitFile,
    onError: (err) => {
      console.log(err);
    },
  });

  const onSubmit = async (data: AddNewSupplyProps) => {
    try {
      const response = await axios.post("/add-supply", {
        item: data.name,
        suppliesDataSetId: dataSetId,
        lineId: lineId,
        description: data.desc,
        consumable: data.comsumable,
      });

      if (response.status !== 200) {
        setError("root", { message: "Failed to add" });
        return;
      }
      await queryClient.invalidateQueries({
        queryKey: ["dataSetSupplies", dataSetId],
        refetchType: "active",
      });
      setValue("name", "");
      setValue("desc", "");
      setOnOpen(0);
    } catch (error) {
      console.log(error);
    }
  };

  hotkeys("ctrl+a", function (event) {
    event.preventDefault();
    setOnOpen(1);
  });

  const exportExcel = useMutation({
    mutationFn: () =>
      handleExportDataSetSupplies(
        dataSetId as string,
        auth.token as string,
        `${data?.data.title}-Items`,
      ),
    onError: (err) => {
      console.log(err);
    },
  });

  const deleteDateSetMutation = useMutation({
    mutationFn: () =>
      deleteDataSet(
        auth.token as string,
        data?.data.id as string,
        auth.userId as string,
        containerId as string,
        password,
      ),
    onError: (err) => {
      toast.error("Failed to delete", {
        closeButton: false,
        description: err.message,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["data-set-list", containerId],
        refetchType: "active",
      });
      nav(-1);
    },
  });

  if (isFetching) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
        <div className="p-4 space-y-4">
          <div className="border rounded-lg p-4 bg-white">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
          <div className="border rounded-lg bg-white overflow-hidden">
            <Skeleton className="h-64 w-full" />
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
            Data Set Not Found
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            The data set you're looking for doesn't exist.
          </p>
          <Button variant="outline" size="sm" onClick={() => nav(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section - Compact */}
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex-shrink-0">
                <Database className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center flex-wrap gap-2">
                  <h1 className="text-sm font-bold text-gray-900 truncate max-w-[180px] sm:max-w-none">
                    {data.data.title}
                  </h1>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    ID: {dataSetId?.slice(-8)}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {selected.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                  {selected.length} selected
                </Badge>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                    <EllipsisVertical className="h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="end">
                  <div className="space-y-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full justify-start gap-2 h-8 text-xs"
                      onClick={() => setOnOpen(1)}
                    >
                      <SquarePlus className="h-3.5 w-3.5" />
                      Add Manual
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full justify-start gap-2 h-8 text-xs"
                      onClick={() => setOnOpen(2)}
                    >
                      <CloudUpload className="h-3.5 w-3.5" />
                      Upload Excel
                    </Button>

                    <Separator className="my-1" />

                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full justify-start gap-2 h-8 text-xs"
                      onClick={() => exportExcel.mutateAsync()}
                      disabled={exportExcel.isPending}
                    >
                      {exportExcel.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sheet className="h-3.5 w-3.5" />
                      )}
                      Export to Excel
                    </Button>

                    <Separator className="my-1" />

                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full justify-start gap-2 h-8 text-xs"
                      onClick={() => setOnSelect(!onSelect)}
                    >
                      <CopyCheck className="h-3.5 w-3.5" />
                      {onSelect ? "Cancel Selection" : "Select Items"}
                    </Button>

                    <Separator className="my-1" />

                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full justify-start gap-2 h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setOnOpen(3)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete Data Set
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area - Compact */}
      <div className="p-3">
        <div className="border rounded-lg bg-white overflow-hidden">
          <DataSetSupplies
            onSelect={onSelect}
            selected={selected}
            setSelected={setSelected}
          />
        </div>
      </div>

      {/* Add Item Modal - Compact */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md">
              <Package className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold">Add New Item</span>
          </div>
        }
        footer={true}
        children={
          <div className="space-y-3 p-1">
            <div className="p-2 bg-blue-50 rounded-md border">
              <div className="flex items-center gap-2">
                <Database className="h-3.5 w-3.5 text-blue-600" />
                <div>
                  <p className="text-xs font-medium text-blue-800">
                    {data.data.title}
                  </p>
                </div>
              </div>
            </div>

            <Form {...form}>
              <FormField
                name="name"
                control={control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">
                      Item Name *
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter item name"
                        className="h-8 text-sm"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="desc"
                control={control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">
                      Description
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Add description"
                        className="h-8 text-sm"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="comsumable"
                control={control}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-2 space-y-0 rounded-md border p-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="h-3.5 w-3.5 mt-0.5"
                      />
                    </FormControl>
                    <div className="space-y-0.5 leading-none">
                      <FormLabel className="text-xs font-medium cursor-pointer">
                        Consumable Item
                      </FormLabel>
                      <p className="text-[10px] text-gray-500">
                        Item is meant to be consumed
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </Form>

            <div className="rounded-md bg-gray-50 p-2">
              <p className="text-[10px] text-gray-500">
                Press{" "}
                <kbd className="px-1 py-0.5 text-[10px] font-mono bg-white border rounded">
                  Ctrl
                </kbd>{" "}
                +{" "}
                <kbd className="px-1 py-0.5 text-[10px] font-mono bg-white border rounded">
                  A
                </kbd>{" "}
                to open
              </p>
            </div>
          </div>
        }
        onOpen={onOpen === 1}
        className="max-w-md w-[90vw]"
        setOnOpen={() => {
          if (isSubmitting) return;
          setOnOpen(0);
        }}
        onFunction={handleSubmit(onSubmit)}
        loading={isSubmitting}
        yesTitle="Add Item"
      />

      {/* Upload Excel Modal - Compact */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md">
              <FileUp className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold">Upload Excel File</span>
          </div>
        }
        footer={true}
        children={
          <div className="space-y-3 p-1">
            <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
              <div className="p-2 bg-blue-50 rounded-full inline-flex mb-2">
                <CloudUpload className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Upload Excel file (.xlsx, .xls)
              </p>

              <Input
                type="file"
                accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-xs h-8 cursor-pointer"
              />

              {file && (
                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sheet className="h-3.5 w-3.5 text-green-600" />
                      <div>
                        <p className="text-xs font-medium text-green-800">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-green-600">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFile(null)}
                      className="h-6 text-xs"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}

              {isPending && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Uploading: {uploadProgress}%
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-md bg-blue-50 border border-blue-200 p-2">
              <p className="text-[10px] text-blue-700">
                <span className="font-medium">File Requirements:</span> Includes
                columns: Item Name (required). Optional: Description, Consumable
                (true/false)
              </p>
            </div>
          </div>
        }
        onOpen={onOpen === 2}
        className="max-w-md w-[90vw] max-h-[85vh] overflow-auto"
        onFunction={() => mutateAsync()}
        setOnOpen={() => {
          if (isPending) return;
          setOnOpen(0);
        }}
        yesTitle="Upload File"
        loading={isPending}
      />

      {/* Delete Data Set Modal - Compact */}
      <Modal
        footer={true}
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-100 rounded-md">
              <Trash2 className="h-3.5 w-3.5 text-red-600" />
            </div>
            <span className="text-sm font-semibold">Delete Data Set</span>
          </div>
        }
        children={
          <div className="space-y-3 p-1">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-800 mb-1">
                Delete "{data.data.title}"
              </p>
              <p className="text-xs text-gray-500">
                This action cannot be undone.
              </p>
            </div>

            <div className="rounded-md bg-red-50 border border-red-200 p-2">
              <p className="text-[10px] text-red-700">
                <span className="font-medium">Warning:</span> All items in this
                data set will be permanently deleted.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Key className="h-3.5 w-3.5 text-gray-400" />
                <label className="text-xs font-medium text-gray-700">
                  Type{" "}
                  <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[10px] border">
                    CONFIRM
                  </span>{" "}
                  to proceed:
                </label>
              </div>
              <Input
                placeholder="Type CONFIRM here..."
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                className={`h-8 text-sm ${
                  password === "CONFIRM"
                    ? "border-green-300 bg-green-50"
                    : "border-gray-300"
                }`}
              />
              {password === "CONFIRM" && (
                <p className="text-[10px] text-green-600 flex items-center gap-1">
                  ✓ Confirmation accepted
                </p>
              )}
            </div>
          </div>
        }
        onOpen={onOpen === 3}
        className="max-w-md w-[90vw]"
        setOnOpen={() => {
          if (deleteDateSetMutation.isPending) return;
          setOnOpen(0);
        }}
        yesTitle="Delete Data Set"
        cancelTitle="Cancel"
        loading={deleteDateSetMutation.isPending}
        onFunction={() => deleteDateSetMutation.mutateAsync()}
      />
    </div>
  );
};

export default DataSet;
