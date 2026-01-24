import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  announcementData,
  announcementStatusUpdate,
} from "@/db/statements/announcement";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/db/axios";

import { useAuth } from "@/provider/ProtectedRoute";
//
import { Button } from "@/components/ui/button";
// import {
//   ButtonGroup,
//   ButtonGroupSeparator,
//   ButtonGroupText,
// } from "@/components/ui/button-group";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import Modal from "@/components/custom/Modal";
// import {
//   InputGroup,
//   InputGroupAddon,
//   InputGroupInput,
// } from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormItem,
  FormField,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

//
import {
  BookOpenCheck,
  PauseCircle,
  Archive,
  PresentationIcon,
  Undo2,
} from "lucide-react";
//inteface/schema/props
import { AnnouncementFormSchema } from "@/interface/zod";
import type { Announcement, AnnouncementFormProps } from "@/interface/data";

const AnnouncementData = () => {
  const [onOpen, setOnOpen] = useState(0);
  const auth = useAuth();
  const { announcementId, lineId } = useParams();

  const queryClient = useQueryClient();

  const { data, isFetching } = useQuery<Announcement>({
    queryKey: ["announcement-data", announcementId],
    queryFn: () =>
      announcementData(auth.token as string, announcementId as string),
    enabled: !!auth.token || !!auth.userId,
  });

  console.log({ data });

  const form = useForm<AnnouncementFormProps>({
    resolver: zodResolver(AnnouncementFormSchema),
    defaultValues: {
      title: data ? data.title : "N/A",
      content: data ? data.content : "N/A",
      //files: [],
    },
  });

  useEffect(() => {
    if (data) {
      form.reset({
        title: data.title || "",
        content: data.content || "",
        //files: [],
      });
    }
  }, [data, form]);

  const {
    formState: { isSubmitting, errors },
    handleSubmit,
    control,
    // watch,
    // setValue,
  } = form;

  //const files = watch("files");

  // const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const selectedFiles = e.target.files;
  //   if (selectedFiles) {
  //     const newFiles = Array.from(selectedFiles);
  //     setValue("files", [...(files || []), ...newFiles]);
  //   }
  // };

  // const removeFile = (index: number) => {
  //   const updatedFiles = files ? [...files] : [];
  //   updatedFiles.splice(index, 1);
  //   setValue("files", updatedFiles);
  // };

  const onSubmit = async (formData: AnnouncementFormProps) => {
    if (!announcementId) throw new Error("INVALID REQUIRED DATA");

    if (!lineId || !auth.userId) throw new Error("INVALID REQUIRED ID");
    try {
      const response = await axios.patch(
        "/announcement/publish",
        {
          title: formData.title,
          content: formData.content,
          authorId: auth.userId,
          lineId: lineId,
          id: announcementId,
        },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
        }
      );
      if (response.status !== 200) {
        throw new Error(response.data.message);
      }
      await queryClient.invalidateQueries({
        queryKey: ["announcement-data", announcementId],
        refetchType: "active",
      });
      setOnOpen(0);
    } catch (error) {
      toast.error("FAILED TO SUBMIT");
    }
  };

  const handleUpdateStatus = async (status: number) => {
    if (!auth.token || !auth.userId || !lineId)
      throw new Error("UNAUTHORIZED ACTION");
    if (!announcementId) throw new Error("INVALID REQUIRED");
    await announcementStatusUpdate(
      auth.token,
      announcementId,
      auth.userId,
      status,
      lineId as string
    );
  };

  const updateStatus = useMutation({
    mutationFn: (status: number) => handleUpdateStatus(status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["announcement-data", announcementId],
        refetchType: "active",
      });
    },
  });

  const statusButtons = [
    <Button
      onClick={() => setOnOpen(1)}
      disabled={isSubmitting}
      size="sm"
      className="gap-2"
    >
      {isSubmitting ? (
        <Spinner className="w-4 h-4" />
      ) : (
        <BookOpenCheck className="w-4 h-4" />
      )}
      Publish Announcement
    </Button>,
    <div className=" w-auto flex gap-2">
      <Button
        size="sm"
        variant="destructive"
        disabled={updateStatus.isPending}
        onClick={() => {
          updateStatus.mutateAsync(2);
        }}
      >
        <PauseCircle /> Pause
      </Button>

      {data && data.status === 3 ? (
        <Button
          size="sm"
          variant="outline"
          disabled={updateStatus.isPending || (data && data.status === 3)}
          onClick={() => updateStatus.mutateAsync(3)}
        >
          <Archive /> Archive
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          disabled={updateStatus.isPending || (data && data.status === 3)}
          onClick={() => updateStatus.mutateAsync(3)}
        >
          <Undo2 /> Restore
        </Button>
      )}
    </div>,

    <div className=" w-auto flex gap-2">
      {data && (
        <Button
          size="sm"
          variant="destructive"
          disabled={updateStatus.isPending}
          onClick={() => {
            updateStatus.mutateAsync(1);
          }}
        >
          <PresentationIcon /> Publish
        </Button>
      )}
      {data && data.status === 3 && (
        <Button
          size="sm"
          variant="outline"
          disabled={updateStatus.isPending || (data && data.status === 3)}
          onClick={() => updateStatus.mutateAsync(1)}
        >
          <Undo2 /> Restore
        </Button>
      )}
    </div>,
  ];

  if (isFetching) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4 md:p-6">
      <Card className="h-full border shadow-sm">
        <CardHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-semibold">
              {data ? "Edit Announcement" : "Create Announcement"}
            </CardTitle>
            {data && (
              <>
                {data.status === 0 && (
                  <Button
                    onClick={() => setOnOpen(1)}
                    disabled={isSubmitting}
                    size="sm"
                    className="gap-2"
                  >
                    {isSubmitting ? (
                      <Spinner className="w-4 h-4" />
                    ) : (
                      <BookOpenCheck className="w-4 h-4" />
                    )}
                    Publish Announcement
                  </Button>
                )}
                {data.status === 1 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={updateStatus.isPending}
                    onClick={() => {
                      const status = data.status === 2 ? 1 : 2;
                      updateStatus.mutateAsync(status);
                    }}
                  >
                    {/* <PauseCircle /> {data.status === 2 ? "Publish" : "P"} */}
                  </Button>
                )}
              </>
            )}
          </div>
        </CardHeader>

        <ScrollArea className="h-[calc(100%-80px)]">
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Title Section */}
                <div className="space-y-4">
                  <FormField
                    control={control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">
                          Title
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter announcement title"
                            className="h-12 text-lg bg-white border-gray-300 focus:border-primary"
                            {...field}
                          />
                        </FormControl>
                        {errors.title && (
                          <FormMessage className="text-red-500">
                            {errors.title.message}
                          </FormMessage>
                        )}
                        <FormDescription className="text-gray-500">
                          A clear and concise title for your announcement
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Content Section */}
                <div className="space-y-4">
                  <FormField
                    control={control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-base font-medium">
                            Content
                          </FormLabel>
                          <span className="text-sm text-gray-500">
                            {field.value?.length || 0} characters
                          </span>
                        </div>
                        <FormControl>
                          <Textarea
                            placeholder="Write your announcement content here..."
                            className="min-h-[400px] bg-white border-gray-300 resize-none focus:border-primary"
                            {...field}
                          />
                        </FormControl>
                        {errors.content && (
                          <FormMessage className="text-red-500">
                            {errors.content.message}
                          </FormMessage>
                        )}
                        <FormDescription className="text-gray-500">
                          Include all relevant details for your announcement
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>

                {/* <Separator /> */}

                {/* File Upload Section */}
                <div className="space-y-4">
                  <div>
                    {/* <FormLabel className="text-base font-medium">
                      Attachments
                    </FormLabel>
                    <FormDescription className="text-gray-500 mb-4">
                      Upload relevant files (PDF, DOC, images, etc.)
                    </FormDescription> */}

                    {/* File Upload Area */}
                    <div className="space-y-4">
                      {/* <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                        onClick={() =>
                          document.getElementById("file-upload")?.click()
                        }
                      >
                        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 mb-2">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-sm text-gray-500">
                          Maximum file size: 10MB
                        </p>
                        <input
                          id="file-upload"
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div> */}

                      {/* File List */}
                      {/* {files && files.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Uploaded Files</h4>
                          <div className="space-y-2">
                            {files.map((file, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                              >
                                {file && (
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                      <BookOpenCheck className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <p className="font-medium">{file.name}</p>
                                      <p className="text-sm text-gray-500">
                                        {(file.size / 1024 / 1024).toFixed(2)}{" "}
                                        MB
                                      </p>
                                    </div>
                                  </div>
                                )}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile(index)}
                                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )} */}
                    </div>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </ScrollArea>
      </Card>
      <Modal
        title="Confirm Publish"
        children={
          <div className="space-y-4">
            <p>Are you sure you want to publish this announcement?</p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Once published, this announcement will be visible to all
                    users.
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
        onOpen={onOpen === 1}
        className="max-w-md"
        setOnOpen={() => {
          setOnOpen(0);
        }}
        footer={true}
        loading={isSubmitting}
        onFunction={handleSubmit(onSubmit)}
      />
    </div>
  );
};

export default AnnouncementData;
