import { useState, memo, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import axios from "@/db/axios";
//db/statements
import { removeRequirements, removePostJobRequirements } from "@/db/statement";
//components/layouts
import {
  Item,
  ItemActions,
  ItemTitle,
  ItemContent,
  ItemFooter,
  ItemHeader,
} from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Modal from "@/components/custom/Modal";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { ButtonGroup } from "@/components/ui/button-group";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
//icons
import {
  Trash,
  File,
  X,
  Pencil,
  Paperclip,
  Folder,
  Download,
  AlertTriangle,
} from "lucide-react";

//interface/props
import { JobApplicationRequirements } from "@/interface/zod";
import type {
  JobPostRequirementsProps,
  JobApplicationRequirementsProps,
} from "@/interface/data";

interface Props {
  item: JobPostRequirementsProps;
  no: number;
  token: string;
  disabled: boolean;
}

const PostJobRequirementItem = ({ item, no, token, disabled }: Props) => {
  const [onOpen, setOnOpen] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<JobApplicationRequirementsProps>({
    resolver: zodResolver(JobApplicationRequirements),
    defaultValues: {
      title: item.title,
      assets: [],
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    control,
    watch,
    setValue,
  } = form;

  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: () => removeRequirements(token, item.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["jobPostRequirements", item.jobPostId],
        refetchType: "active",
      });
      setOnOpen(0);
      toast.success("Requirement removed successfully");
    },
    onError: (error) => {
      toast.error("Failed to remove requirement", {
        description: error.message,
      });
    },
  });

  const removeAssets = useMutation({
    mutationFn: (id: string) => removePostJobRequirements(token, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["jobPostRequirements", item.jobPostId],
        refetchType: "active",
      });
      toast.success("File removed successfully");
    },
    onError: (error) => {
      toast.error("Failed to remove file", {
        description: error.message,
      });
    },
  });

  const assets = watch("assets");

  const handleRemoveFile = (fileIndex: number) => {
    const currentAssets = [...assets];
    const updatedAssets = currentAssets.filter(
      (_, index) => index !== fileIndex,
    );
    setValue("assets", updatedAssets);
  };

  const handleFileAdd = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const currentAssets = [...assets];
      const newFiles = Array.from(files);
      setValue("assets", [...currentAssets, ...newFiles]);
      toast.success(`${newFiles.length} file(s) added`);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setValue("assets", []);
    setValue("title", item.title);
  };

  const onSubmit = async (data: JobApplicationRequirementsProps) => {
    if (!item.jobPostId) {
      return toast.warning("Invalid requirement ID");
    }
    try {
      const formData = new FormData();
      formData.append("id", item.id);
      formData.append("title", data.title);

      data.assets.forEach((file: File) => {
        formData.append("files", file);
      });

      const response = await axios.patch(
        "/application/update-job/requirement",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status !== 200) {
        throw new Error(response.data.message);
      }
      toast.success("Requirement updated successfully");
      await queryClient.invalidateQueries({
        queryKey: ["jobPostRequirements", item.jobPostId],
        refetchType: "active",
      });
      setOnOpen(0);
    } catch (error) {
      if (isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to update requirement";

        toast.error("Update failed", {
          description: errorMessage,
        });
      } else if (error instanceof Error) {
        toast.error("Update failed", {
          description: error.message,
        });
      } else {
        toast.error("Update failed", {
          description: "An unexpected error occurred",
        });
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <>
      <Card className="bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
        <CardContent className="p-0">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    #{no + 1}
                  </Badge>
                  <ItemTitle className="text-lg font-semibold text-gray-900">
                    {item.title}
                  </ItemTitle>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Paperclip className="w-4 h-4" />
                  <span>
                    {item.asset.length} file{item.asset.length !== 1 ? "s" : ""}{" "}
                    attached
                  </span>
                </div>
              </div>

              <ItemActions className="flex gap-1">
                <Button
                  disabled={disabled}
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setOnOpen(2)}
                  className="gap-2 hover:border-blue-300 hover:bg-blue-50"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  disabled={disabled}
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => setOnOpen(1)}
                  className="gap-2 hover:bg-red-600"
                >
                  <Trash className="w-4 h-4" />
                  Delete
                </Button>
              </ItemActions>
            </div>
          </div>

          <ItemContent className="p-4">
            {item.asset.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <File className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-gray-600 font-medium">No files attached</p>
                <p className="text-gray-500 text-sm mt-1">
                  Add files to this requirement
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {item.asset.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <File className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.fileName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(parseInt(file.fileSize, 10))}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                        onClick={() => window.open(file.fileUrl, "_blank")}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={removeAssets.isPending}
                        onClick={() => removeAssets.mutateAsync(file.id)}
                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                      >
                        {removeAssets.isPending ? (
                          <Spinner className="w-4 h-4" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ItemContent>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Delete Requirement
          </div>
        }
        onOpen={onOpen === 1}
        className="max-w-md"
        setOnOpen={() => setOnOpen(0)}
        footer={true}
        onFunction={() => mutateAsync()}
        loading={isPending}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">
              This action cannot be undone. The requirement and all associated
              files will be permanently removed.
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="font-medium text-gray-900">{item.title}</p>
            <p className="text-sm text-gray-600 mt-1">
              {item.asset.length} file{item.asset.length !== 1 ? "s" : ""} will
              be deleted
            </p>
          </div>
        </div>
      </Modal>

      {/* Update Requirement Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Pencil className="w-5 h-5" />
            Update Requirement
          </div>
        }
        onOpen={onOpen === 2}
        className="max-w-2xl"
        setOnOpen={() => {
          if (isSubmitting) return;
          handleReset();
          setOnOpen(0);
        }}
        footer={true}
        onFunction={handleSubmit(onSubmit)}
        loading={isSubmitting}
      >
        <div className="space-y-6">
          <Form {...form}>
            <FormField
              control={control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requirement Title</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter requirement description..."
                      className="min-h-[100px] resize-vertical"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe what documents or information applicants need to
                    provide
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Form>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-base font-medium">Attached Files</label>
              <span className="text-sm text-gray-500">
                {assets.length} new file{assets.length !== 1 ? "s" : ""}{" "}
                selected
              </span>
            </div>

            {assets.length > 0 && (
              <ScrollArea className="max-h-60">
                <div className="space-y-2 pr-4">
                  {assets.map((file, fileIndex) => (
                    <div
                      key={`${file.name}-${fileIndex}`}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <File className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(fileIndex)}
                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="vertical" />
              </ScrollArea>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileAdd}
              multiple
              className="hidden"
              accept="*/*"
            />

            <ButtonGroup className="w-full">
              <Button
                type="button"
                variant="outline"
                onClick={triggerFileInput}
                className="flex-1 gap-2 hover:border-blue-300 hover:bg-blue-50"
              >
                <Paperclip className="w-4 h-4" />
                Add New Files
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 gap-2 hover:border-green-300 hover:bg-green-50"
              >
                <Folder className="w-4 h-4" />
                Browse Assets
              </Button>
            </ButtonGroup>

            {item.asset.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Existing files will remain attached.
                  New files will be added to the requirement.
                </p>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default memo(PostJobRequirementItem);
