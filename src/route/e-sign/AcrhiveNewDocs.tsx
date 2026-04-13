import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/provider/ProtectedRoute";
import { useParams } from "react-router";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import axios from "@/db/axios";
import { useRoom } from "@/provider/DocumentRoomProvider";
//
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import DocumentTypeSelect from "@/layout/DocumentTypeSelect";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
//
import { ArchiveNewDocsSchema } from "@/interface/zod";
import type { ArchiveNewDocsProps } from "@/interface/data";
import { FileText, Calendar, Archive, Upload, AlertCircle } from "lucide-react";

const ArchiveNewDocs = () => {
  const auth = useAuth();
  const room = useRoom();
  const queryClient = useQueryClient();
  const { lineId } = useParams();

  const form = useForm<ArchiveNewDocsProps>({
    resolver: zodResolver(ArchiveNewDocsSchema),
    defaultValues: {
      title: "",
      abstract: "",
      docType: "0",
      retentionDate: "",
      detentionDate: "",
      safeDate: "",
    },
  });

  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
    reset,
    getValues,
    setError,
    setValue,
  } = form;

  const onSubmit = async (data: ArchiveNewDocsProps) => {
    // Create FormData to handle file upload
    const formData = new FormData();

    // Append all fields to formData
    if (data.file) {
      formData.append("file", data.file);
    }
    formData.append("title", data.title || "");
    formData.append("abstract", data.abstract || "");
    formData.append("docType", data.docType || "");
    formData.append("lineId", lineId || "");
    formData.append("userId", auth.userId || "");
    formData.append("receivingRoomId", room.room?.id || "");

    const response = await axios.post("/document/archive/file", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    if (response.status !== 200) {
      return alert("Bad");
    }
    await queryClient.invalidateQueries({
      queryKey: ["archived-documents", room.room?.id],
      refetchType: "active",
    });
    reset();
    alert("Document archived successfully");
    console.log({ data });
  };
  console.log({ errors });

  const file = getValues("file");
  const handleGenerateAbstract = async () => {
    if (!file) {
      throw new Error("Please select a file");
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        "/document/archive/generate-archive",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${auth.token}`,
          },
        },
      );

      if (response.status !== 200) {
        throw new Error(response.data.message);
      }

      // Return the abstract directly
      return response.data.abstract;
    } catch (error) {
      throw new Error((error as Error).message);
    }
  };

  const { mutateAsync, isPending } = useMutation({
    mutationFn: handleGenerateAbstract,
    onSuccess: (abstract) => {
      // abstract is what handleGenerateAbstract returns
      setValue("abstract", abstract);
    },
    onError: (err) => {
      setError("root", { message: err.message });
    },
  });
  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
              <Archive className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Archive New Document
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Upload and archive documents to the system
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card className="border shadow-md overflow-hidden">
          <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
            <CardTitle className="text-base font-semibold text-gray-900">
              Document Information
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Fill in the details below to archive a new document
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* File Upload Field */}
                <FormField
                  control={control}
                  name="file"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Upload className="h-4 w-4 text-blue-500" />
                        Document File *
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          className="cursor-pointer text-sm file:mr-3 file:py-1.5 file:px-3 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 file:border-0 hover:file:bg-blue-100"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            onChange(file);
                          }}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Upload the document file (PDF, DOC, DOCX, etc.)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                {/* Title Field */}
                <FormField
                  control={control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        Document Title *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter document title"
                          {...field}
                          className="h-9 text-sm"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        A clear and descriptive title for the document
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Abstract Field */}
                <FormField
                  control={control}
                  name="abstract"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">
                        Abstract
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter a brief summary or description of the document..."
                          className="min-h-[100px] resize-y text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        A brief summary of the document's content
                      </FormDescription>
                      <FormMessage />
                      <div>
                        <Button
                          className="h-9 text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                          disabled={isPending}
                          onClick={() => {
                            mutateAsync();
                          }}
                        >
                          Generate absract
                        </Button>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Document Type Field */}
                <FormField
                  control={control}
                  name="docType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">
                        Document Type *
                      </FormLabel>
                      <FormControl>
                        <DocumentTypeSelect
                          search={true}
                          onChange={field.onChange}
                          defaultValue={parseInt(field.value, 10)}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Select the category or type of document
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                {/* Preservation Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <h3 className="text-sm font-semibold text-gray-700">
                      Preservation Settings
                    </h3>
                  </div>
                  <div className="rounded-md bg-blue-50 p-3 border border-blue-100">
                    <div className="flex gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-blue-900 mb-0.5">
                          Retention Information
                        </p>
                        <p className="text-xs text-blue-700">
                          If retention date is left blank, the document will be
                          archived permanently unless manually removed. Safe
                          date indicates when the document becomes safe for
                          disposal.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={control}
                      name="retentionDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-gray-600">
                            Retention Date
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              onChange={(e) => field.onChange(e.target.value)}
                              value={field.value || ""}
                              className="h-9 text-sm"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Date when document can be disposed
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="safeDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-gray-600">
                            Safe Date
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              onChange={(e) => field.onChange(e.target.value)}
                              value={field.value || ""}
                              className="h-9 text-sm"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Date when document becomes safe
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => reset()}
                    disabled={isSubmitting}
                    className="h-9 text-sm"
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-9 text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Archiving...
                      </>
                    ) : (
                      <>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive Document
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ArchiveNewDocs;
