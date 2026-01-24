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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file, file.name);

    try {
      const response = await axios.post("/add-supply-excel", formData, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
        transformRequest: (data) => data,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploadProgress(percentCompleted);
        },
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
        `${data?.data.title}-Items`
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
        password
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
      <div className="w-full h-full flex flex-col gap-6 p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardContent className="p-0">
            <Skeleton className="h-64 w-full" />
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
          Data Set Not Found
        </h3>
        <p className="text-sm text-gray-500 max-w-md text-center">
          The data set you're looking for doesn't exist or you don't have
          permission to access it.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => nav(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-50/30">
      {/* Header Section */}
      <div className="p-6 border-b bg-white shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Database className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-800">
                  {data.data.title}
                </h1>
                <Badge variant="outline" className="font-mono text-xs">
                  ID: {dataSetId?.slice(-8)}
                </Badge>
              </div>
              {/* <p className="text-sm text-gray-500">
                {data.data.description || "Manage items in this data set"}
              </p> */}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selected.length > 0 && (
              <Badge variant="secondary" className="text-sm">
                {selected.length} selected
              </Badge>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2">
                  <EllipsisVertical className="h-4 w-4" />
                  Actions
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="end">
                <div className="space-y-2">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500 px-1">
                      Add Item
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full justify-start gap-2"
                      onClick={() => setOnOpen(1)}
                    >
                      <SquarePlus className="h-4 w-4" />
                      <span>Add Manual</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full justify-start gap-2"
                      onClick={() => setOnOpen(2)}
                    >
                      <CloudUpload className="h-4 w-4" />
                      <span>Upload Excel</span>
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500 px-1">
                      Export
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full justify-start gap-2"
                      onClick={() => exportExcel.mutateAsync()}
                      disabled={exportExcel.isPending}
                    >
                      {exportExcel.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sheet className="h-4 w-4" />
                      )}
                      <span>Export to Excel</span>
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500 px-1">
                      Actions
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full justify-start gap-2"
                      onClick={() => setOnSelect(!onSelect)}
                    >
                      <CopyCheck className="h-4 w-4" />
                      <span>
                        {onSelect ? "Cancel Selection" : "Select Items"}
                      </span>
                    </Button>
                  </div>

                  <Separator />

                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setOnOpen(3)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Data Set</span>
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-6">
        <Card className="border shadow-sm">
          <CardContent className="p-0">
            <DataSetSupplies
              onSelect={onSelect}
              selected={selected}
              setSelected={setSelected}
            />
          </CardContent>
        </Card>
      </div>

      {/* Add Item Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-lg font-semibold">Add New Item</span>
          </div>
        }
        footer={true}
        children={
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg border">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    {data.data.title}
                  </p>
                  <p className="text-xs text-blue-600">
                    Add a new item to this data set
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
                    <FormLabel className="text-sm font-medium">
                      Item Name *
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter item name"
                        className="bg-gray-50"
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
                    <FormLabel className="text-sm font-medium">
                      Description (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Add description, notes, or specifications"
                        className="bg-gray-50"
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
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium cursor-pointer">
                        Consumable Item
                      </FormLabel>
                      <p className="text-xs text-gray-500">
                        Check this if the item is meant to be consumed (e.g.,
                        office supplies, medical supplies)
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </Form>

            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">
                Press{" "}
                <kbd className="px-2 py-1 text-xs font-mono bg-white border rounded">
                  Ctrl
                </kbd>{" "}
                +{" "}
                <kbd className="px-2 py-1 text-xs font-mono bg-white border rounded">
                  A
                </kbd>{" "}
                to quickly open this form
              </p>
            </div>
          </div>
        }
        onOpen={onOpen === 1}
        className="max-w-md"
        setOnOpen={() => {
          if (isSubmitting) return;
          setOnOpen(0);
        }}
        onFunction={handleSubmit(onSubmit)}
        loading={isSubmitting}
        yesTitle="Add Item"
      />

      {/* Upload Excel Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileUp className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-lg font-semibold">Upload Excel File</span>
          </div>
        }
        footer={true}
        children={
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="p-3 bg-blue-50 rounded-full inline-flex mb-4">
                <CloudUpload className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Upload Excel File
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Upload an Excel file (.xlsx, .xls) with your items data
              </p>

              <Input
                type="file"
                accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />

              {file && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Sheet className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-sm text-green-800">
                          {file.name}
                        </p>
                        <p className="text-xs text-green-600">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFile(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}

              {isPending && (
                <div className="mt-6">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Uploading: {uploadProgress}%
                  </p>
                </div>
              )}

              <p className="text-xs text-gray-400 mt-6">
                Supported formats: .xlsx, .xls (Max 10MB)
              </p>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <p className="font-medium text-sm mb-1">File Requirements</p>
                <ul className="text-xs space-y-1">
                  <li>• File must include columns: Item Name (required)</li>
                  <li>
                    • Optional columns: Description, Consumable (true/false)
                  </li>
                  <li>• First row should contain column headers</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        }
        onOpen={onOpen === 2}
        className="max-w-2xl"
        onFunction={() => mutateAsync()}
        setOnOpen={() => {
          if (isPending) return;
          setOnOpen(0);
        }}
        yesTitle="Upload File"
        loading={isPending}
      />

      {/* Delete Data Set Modal */}
      <Modal
        footer={true}
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <span className="text-lg font-semibold text-red-800">
              Delete Data Set
            </span>
          </div>
        }
        children={
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-red-50 rounded-full mb-4">
                <AlertTriangle className="h-12 w-12 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Delete "{data.data.title}"
              </h3>
              <p className="text-sm text-gray-600">
                This action cannot be undone. All items in this data set will be
                permanently deleted.
              </p>
            </div>

            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                <p className="font-medium mb-1">Critical Warning</p>
                <p className="text-sm">
                  All items and data associated with this data set will be
                  permanently deleted. This action cannot be reversed.
                </p>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-3 mb-2">
                  <Database className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-800">
                      {data.data.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      ID: {dataSetId?.slice(-8)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-gray-400" />
                  <label className="text-sm font-medium text-gray-700">
                    Type{" "}
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded border">
                      CONFIRM
                    </span>{" "}
                    to proceed:
                  </label>
                </div>
                <Input
                  placeholder="Type CONFIRM here..."
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  className={`${
                    password === "CONFIRM"
                      ? "border-green-300 bg-green-50"
                      : "border-gray-300"
                  }`}
                />
                {password === "CONFIRM" && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    ✓ Confirmation accepted. You may proceed.
                  </p>
                )}
              </div>
            </div>
          </div>
        }
        onOpen={onOpen === 3}
        className="max-w-lg"
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
