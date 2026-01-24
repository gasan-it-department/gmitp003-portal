import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import axios from "@/db/axios";
import { useQueryClient, useMutation } from "@tanstack/react-query";
//
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
//icons
import { File, Folder, Paperclip, X } from "lucide-react";
//interface/props/schema
import { JobApplicationRequirements } from "@/interface/zod";
import type { JobApplicationRequirementsProps } from "@/interface/data";

//
interface Props {
  postId: string;
  token: string;
  setOnOpen: React.Dispatch<React.SetStateAction<number>>;
}

const AddRequirementForm = ({ postId, token, setOnOpen }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const form = useForm<JobApplicationRequirementsProps>({
    resolver: zodResolver(JobApplicationRequirements),
    defaultValues: {
      assets: [],
      title: "",
    },
  });

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
    watch,
    setValue,
  } = form;

  // Use watch to get reactive updates of the assets array
  const assets = watch("assets");

  const handleRemoveFile = (fileIndex: number) => {
    const currentAssets = [...assets]; // Create a copy of the current assets
    const updatedAssets = currentAssets.filter(
      (_, index) => index !== fileIndex
    );
    setValue("assets", updatedAssets);
  };

  const handleFileAdd = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const currentAssets = [...assets]; // Create a copy of the current assets
      const newFiles = Array.from(files);
      setValue("assets", [...currentAssets, ...newFiles]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const onSubmit = async (data: JobApplicationRequirementsProps) => {
    try {
      const formData = new FormData();
      formData.append("postId", postId);
      formData.append("title", data.title);

      data.assets.forEach((file: File) => {
        formData.append("files", file);
      });

      const response = await axios.post(
        "/application/post-requirement",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status !== 200) {
        throw new Error(response.data.message);
      }
      toast.success("Saved");
      await queryClient.invalidateQueries({
        queryKey: ["jobPostRequirements", postId],
        refetchType: "active",
      });
      setOnOpen(0);
    } catch (error) {
      if (isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to submit";

        toast.error("Failed to submit", {
          description: errorMessage,
        });
      } else if (error instanceof Error) {
        toast.error("Failed to submit", {
          description: error.message,
        });
      } else {
        toast.error("Failed to submit", {
          description: "An unexpected error occurred",
        });
      }
    }
  };

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormField
            name="title"
            control={control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  Requirement Title
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter instruction/requirement title"
                    {...field}
                    className="mt-1 max-h-30"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {assets && assets.length > 0 && (
            <div className="mt-4">
              <FormLabel className="text-sm font-medium">
                Attached Files
              </FormLabel>
              <div className="mt-2 space-y-2">
                {assets.map((file, fileIndex) => (
                  <div
                    key={`${file.name}-${fileIndex}-${file.size}`}
                    className="flex items-center justify-between p-2 border border-neutral-200 rounded bg-neutral-50"
                  >
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4 text-neutral-500" />
                      <span className="text-sm truncate max-w-[200px]">
                        {file.name}
                      </span>
                      <span className="text-xs text-neutral-500">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(fileIndex)}
                      className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileAdd}
            multiple
            className="hidden"
            accept="*/*"
          />

          <div className="w-full mt-4 flex justify-end gap-2">
            <ButtonGroup>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={triggerFileInput}
                className="hover:border-neutral-400 border cursor-pointer gap-2"
              >
                <Paperclip className="h-4 w-4" />
                Attach Files
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="hover:border-neutral-400 border cursor-pointer gap-2"
              >
                <Folder className="h-4 w-4" />
                Line Assets
              </Button>
            </ButtonGroup>
          </div>

          <div className="w-full flex justify-end mt-4">
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AddRequirementForm;
