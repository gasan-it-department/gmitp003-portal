import { useForm } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/provider/ProtectedRoute";
import { useParams, useNavigate } from "react-router";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "@/db/axios";
import { useRoom } from "@/provider/DocumentRoomProvider";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import DocumentTypeSelect from "@/layout/DocumentTypeSelect";

import { ArchiveNewDocsSchema } from "@/interface/zod";
import type { ArchiveNewDocsProps } from "@/interface/data";
import {
  FileText,
  Calendar,
  Archive,
  Upload,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Loader2,
} from "lucide-react";

// PostgreSQL bytea hard-caps at ~1GB. We mirror the backend limit here so the
// user gets immediate feedback instead of waiting for a long upload to fail.
const MAX_UPLOAD_BYTES = 1024 * 1024 * 1024; // 1GB
// Abstract auto-generation is memory-heavy on the server; skip the call for
// huge PDFs and ask the user to type one in.
const MAX_ABSTRACT_BYTES = 100 * 1024 * 1024; // 100MB

const formatBytes = (n: number) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

const ArchiveNewDocs = () => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const auth = useAuth();
  const room = useRoom();
  const queryClient = useQueryClient();
  const { lineId } = useParams();
  const nav = useNavigate();

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
    if (!data.file) {
      setError("file", { message: "Please select a file to upload." });
      return;
    }
    if (data.file.size > MAX_UPLOAD_BYTES) {
      setError("file", {
        message: `File is ${formatBytes(data.file.size)} — exceeds the ${formatBytes(MAX_UPLOAD_BYTES)} archive limit.`,
      });
      return;
    }
    if (!data.abstract?.trim()) {
      setError("abstract", {
        message: "Abstract is required — type one or click Auto-generate.",
      });
      return;
    }
    try {
      const formData = new FormData();
      formData.append("file", data.file);
      formData.append("title", data.title || "");
      formData.append("abstract", data.abstract || "");
      formData.append("docType", data.docType || "");
      formData.append("lineId", lineId || "");
      formData.append("userId", auth.userId || "");
      formData.append("receivingRoomId", room.room?.id || "");
      // Preservation dates — backend will create the ArchivePreservation record
      if (data.retentionDate) formData.append("retentionDate", data.retentionDate);
      if (data.safeDate)      formData.append("safeDate", data.safeDate);

      const response = await axios.post(
        "/document/archive/file",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const pct = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1),
            );
            setUploadProgress(pct);
          },
        },
      );

      if (response.status !== 200) {
        throw new Error(response.data?.message ?? "Upload failed");
      }
      await queryClient.invalidateQueries({
        queryKey: ["archived-documents", room.room?.id],
        refetchType: "active",
      });
      toast.success("Document archived successfully");
      reset();
      setUploadProgress(0);
      // If backend returned the new archive ID, navigate directly to its detail.
      // Use an absolute path: this route is registered as `archive/new` (a single
      // route, not nested), so `nav("../id")` would resolve to `documents/id`
      // and white-screen the app.
      const newId = response.data?.id;
      if (newId && lineId) nav(`/${lineId}/documents/archive/${newId}`);
      else if (lineId) nav(`/${lineId}/documents/archive`);
      else nav(-1);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        (err instanceof Error ? err.message : "Failed to archive");
      toast.error(msg);
      setUploadProgress(0);
    }
  };

  const handleGenerateAbstract = async () => {
    const file = getValues("file");
    if (!file) {
      throw new Error("Select a file first to generate its abstract.");
    }
    if (file.size > MAX_ABSTRACT_BYTES) {
      throw new Error(
        `File is ${formatBytes(file.size)}. Auto-generate is capped at ${formatBytes(MAX_ABSTRACT_BYTES)} — please type the abstract manually.`,
      );
    }
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
      throw new Error(response.data?.message ?? "Failed to generate abstract");
    }
    return response.data.abstract as string;
  };

  const { mutateAsync: generateAbstract, isPending: isGenerating } = useMutation({
    mutationFn: handleGenerateAbstract,
    onSuccess: (abstract) => {
      setValue("abstract", abstract);
      toast.success("Abstract generated");
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Failed";
      setError("root", { message: msg });
      toast.error(msg);
    },
  });

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
      <div className="max-w-3xl mx-auto p-3 space-y-3">

        {/* Header */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Archive className="h-3 w-3 text-blue-500" />
              <div>
                <h3 className="text-xs font-semibold text-gray-800">
                  Archive New Document
                </h3>
                <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                  Upload a file and fill in the metadata
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5"
              onClick={() => nav(-1)}
              disabled={isSubmitting}
            >
              <ArrowLeft className="h-3 w-3" />
              Back
            </Button>
          </div>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

            {/* Upload + Title card */}
            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
                <Upload className="h-3 w-3 text-blue-500" />
                <h4 className="text-xs font-semibold text-gray-800">
                  Document
                </h4>
              </div>
              <div className="p-3 space-y-3">

                <FormField
                  control={control}
                  name="file"
                  render={({ field: { onChange, value, ...field } }) => {
                    const tooBig =
                      value instanceof File && value.size > MAX_UPLOAD_BYTES;
                    return (
                      <FormItem>
                        <FormLabel className="text-[10px] font-semibold text-gray-700">
                          File *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            className="cursor-pointer text-xs h-8 file:mr-3 file:py-1 file:px-2 file:text-[10px] file:font-medium file:bg-blue-50 file:text-blue-700 file:border-0 hover:file:bg-blue-100"
                            onChange={(e) => onChange(e.target.files?.[0])}
                            {...field}
                          />
                        </FormControl>
                        {value instanceof File && (
                          <p className={`text-[10px] ${tooBig ? "text-red-600" : "text-gray-500"}`}>
                            {value.name} · {formatBytes(value.size)}
                            {tooBig && " — exceeds 1GB limit"}
                          </p>
                        )}
                        <FormDescription className="text-[10px]">
                          PDF, DOC, DOCX, or image. Max {formatBytes(MAX_UPLOAD_BYTES)} per file.
                          Auto-generate works for PDFs up to {formatBytes(MAX_ABSTRACT_BYTES)}.
                        </FormDescription>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    );
                  }}
                />

                <FormField
                  control={control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-semibold text-gray-700 flex items-center gap-1">
                        <FileText className="h-2.5 w-2.5 text-blue-500" />
                        Title *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter document title"
                          className="h-8 text-xs"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="abstract"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between mb-1">
                        <FormLabel className="text-[10px] font-semibold text-gray-700">
                          Abstract
                        </FormLabel>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-[10px] gap-1 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                          disabled={isGenerating || isSubmitting}
                          onClick={() => generateAbstract()}
                        >
                          {isGenerating ? (
                            <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          ) : (
                            <Sparkles className="h-2.5 w-2.5" />
                          )}
                          {isGenerating ? "Generating..." : "Auto-generate"}
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder="Brief summary of the document content..."
                          className="min-h-[90px] text-xs resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-[10px]">
                        Required for searchability — generate from the file or
                        type your own
                      </FormDescription>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="docType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-semibold text-gray-700">
                        Document Type *
                      </FormLabel>
                      <FormControl>
                        <DocumentTypeSelect
                          search={true}
                          onChange={field.onChange}
                          defaultValue={parseInt(field.value, 10)}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Preservation card */}
            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-blue-500" />
                <h4 className="text-xs font-semibold text-gray-800">
                  Preservation Settings
                </h4>
              </div>
              <div className="p-3 space-y-3">
                <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-100 rounded-md">
                  <AlertCircle className="h-3 w-3 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-blue-700">
                    Leave dates blank to archive <strong>permanently</strong>.
                    Retention is when the document is eligible for disposal;
                    Safe date is when disposal becomes risk-free.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    control={control}
                    name="retentionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-semibold text-gray-700">
                          Retention Date
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="h-8 text-xs"
                            onChange={(e) => field.onChange(e.target.value)}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription className="text-[10px]">
                          Eligible for disposal on this date
                        </FormDescription>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="safeDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-semibold text-gray-700">
                          Safe Date
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="h-8 text-xs"
                            onChange={(e) => field.onChange(e.target.value)}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription className="text-[10px]">
                          Safe to dispose on this date
                        </FormDescription>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Upload progress + form-level error */}
            {isSubmitting && (
              <div className="border rounded-lg bg-white p-3">
                <div className="flex items-center justify-between text-[10px] text-gray-600 mb-1">
                  <span>Uploading...</span>
                  <span className="font-mono">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {errors.root?.message && (
              <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-100 rounded-md">
                <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-red-700">
                  {errors.root.message}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => reset()}
                disabled={isSubmitting}
              >
                Reset
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-7 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Archiving...
                  </>
                ) : (
                  <>
                    <Archive className="h-3 w-3" />
                    Archive Document
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ArchiveNewDocs;
