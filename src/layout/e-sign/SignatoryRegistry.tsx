import { useState } from "react";
import zod from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import axios from "@/db/axios";
//
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormMessage,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import UserSelection from "../UserSelection";
import Modal from "@/components/custom/Modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
//icons
import { PlusCircle, Trash2, Users, Upload, File, Send } from "lucide-react";
//
import { SignatoryFormSchema } from "@/interface/zod";
import type { User } from "@/interface/data";

type SignatoryFormProps = zod.infer<typeof SignatoryFormSchema>;
interface Props {
  lineId: string;
  token: string;
  userId: string;
}

const SignatoryRegistry = ({ lineId, token, userId }: Props) => {
  const [onOpen, setOnOpen] = useState(0);
  const [fileName, setFileName] = useState<string>("");

  const form = useForm<SignatoryFormProps>({
    resolver: zodResolver(SignatoryFormSchema),
    defaultValues: {
      receivers: [],
      address: "",
      signature: undefined,
    },
  });
  const {
    control,
    watch,
    formState: { isSubmitting, errors },
    handleSubmit,
  } = form;
  console.log({ errors });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "receivers",
  });

  const handleSelectUser = (user: User) => {
    if (fields.find((f) => f.userId === user.id)) {
      return;
    }
    append({
      lastname: user.lastName || "",
      firstname: user.firstName || "",
      userId: user.id,
      username: user.username,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      form.setValue("signature", file as File);
    }
  };

  const signatureFile = watch("signature");

  const onSubmit = async (data: SignatoryFormProps) => {
    console.log({ lineId, userId, data });

    try {
      const formData = new FormData();

      formData.append("lineId", lineId);
      formData.append("address", data.address);
      formData.append("userId", userId);
      formData.append(
        "receivers",
        JSON.stringify(data.receivers.map((r) => r.userId)),
      );

      if (data.receivers && data.receivers.length > 0) {
        formData.append("receivers", JSON.stringify(data.receivers));
      }

      const signature = data.signature;

      if (signature === undefined || signature === null) {
        throw new Error("Signature is required");
      }

      if (
        typeof signature === "object" &&
        signature !== null &&
        "name" in signature &&
        "size" in signature &&
        "type" in signature
      ) {
        formData.append("signature", signature as File);
      } else if (typeof signature === "string") {
        if (signature.startsWith("data:")) {
          try {
            const blob = dataURLtoBlob(signature);
            formData.append("signature", blob, "signature.png");
          } catch (blobError) {
            console.error("Error converting data URL to blob:", blobError);
            throw new Error("Invalid signature format");
          }
        } else {
          formData.append("signature", signature);
        }
      } else {
        throw new Error("Invalid signature format");
      }
      console.log("FormData contents:");
      for (const [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await axios.post("/document/room/register", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.status !== 200) {
        throw new Error(response.data.message || "Request failed");
      }
      console.log(response.data.data);

      toast.success("Signatory registry submitted successfully!");
      setOnOpen(0);
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit signatory registry.",
      );
    }
  };

  function dataURLtoBlob(dataURL: string): Blob {
    const arr = dataURL.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new Blob([u8arr], { type: mime });
  }

  return (
    <div className="w-full space-y-6">
      <Form {...form}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Signatory Configuration
            </CardTitle>
            <FormDescription>
              Configure the room address, assign receiver, and upload signature
              for approval workflow
            </FormDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Address Field */}
            <FormField
              control={control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Document Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter document storage address or URL"
                      {...field}
                      className="h-10"
                    />
                  </FormControl>
                  <FormDescription>
                    Location where the document will be stored for signing
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Signature File Upload */}
            <div className="space-y-4">
              <div>
                <FormLabel className="text-base">Signature File</FormLabel>
                <FormDescription className="mb-3">
                  Upload your digital signature file that will be applied to
                  documents
                </FormDescription>

                <div className="space-y-2 text-sm text-muted-foreground pl-1">
                  <div className="flex items-start gap-2">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/70 flex-shrink-0" />
                    <span>
                      <strong>Transparent background</strong> - Use PNG with
                      transparent background for clean overlay
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/70 flex-shrink-0" />
                    <span>
                      <strong>High resolution</strong> - Minimum 300 DPI for
                      print-quality signatures
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/70 flex-shrink-0" />
                    <span>
                      <strong>Clean edges</strong> - Avoid anti-aliasing or
                      blurry edges for professional appearance
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/70 flex-shrink-0" />
                    <span>
                      <strong>File size</strong> - Maximum 5MB to ensure quick
                      processing
                    </span>
                  </div>
                </div>
              </div>

              <FormField
                control={control}
                name="signature"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormControl>
                      <div className="space-y-4">
                        <div
                          className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                            signatureFile
                              ? "border-primary bg-primary/5"
                              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                          }`}
                          onClick={() =>
                            document.getElementById("signature-upload")?.click()
                          }
                        >
                          <Input
                            id="signature-upload"
                            type="file"
                            className="hidden"
                            accept=".png,.svg"
                            onChange={handleFileChange}
                            {...field}
                          />

                          {signatureFile ? (
                            <div className="flex flex-col items-center">
                              <File className="h-12 w-12 text-primary mb-4" />
                              <p className="font-medium text-lg">{fileName}</p>
                              <p className="text-sm text-muted-foreground mt-2">
                                Click to change file
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <Upload className="h-12 w-12 text-gray-400 mb-4" />
                              <p className="font-medium text-lg">
                                Drop your signature file here, or click to
                                browse
                              </p>
                              <p className="text-sm text-muted-foreground mt-2">
                                Supports only PNG
                              </p>
                            </div>
                          )}
                        </div>

                        {signatureFile && (
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                            <div className="flex items-center gap-2">
                              <File className="h-4 w-4 text-gray-600" />
                              <span className="text-sm">{fileName}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                form.setValue("signature", undefined as any);
                                setFileName("");
                              }}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Signatories Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">Receiver</h3>
                  <p className="text-sm text-muted-foreground">
                    {fields.length} signatory{fields.length !== 1 ? "s" : ""}{" "}
                    added
                  </p>
                </div>
                <Button
                  onClick={() => setOnOpen(1)}
                  className="gap-2"
                  size="sm"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Receiver
                </Button>
              </div>

              {/* Signatories List */}
              {fields.length > 0 ? (
                <div className="grid gap-3">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex items-center justify-between p-4 bg-card border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">
                            {field.firstname} {field.lastname}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            @{field.username}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg mb-2">
                    No receiver added
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Add receiver to define the approval workflow
                  </p>
                  <Button
                    onClick={() => setOnOpen(1)}
                    variant="outline"
                    className="gap-2"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Add Receiver
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Selection Modal */}
        <Modal
          title={undefined}
          children={
            <div className="p-1">
              <FormField
                control={control}
                name="receivers"
                render={() => (
                  <FormItem>
                    <FormLabel className="sr-only">Signatories</FormLabel>
                    <FormControl>
                      <UserSelection
                        lineId={lineId}
                        token={token}
                        onSelect={handleSelectUser}
                      />
                    </FormControl>
                    {errors.receivers && (
                      <FormMessage>{errors.receivers.message}</FormMessage>
                    )}
                  </FormItem>
                )}
              />
            </div>
          }
          onOpen={onOpen === 1}
          className="max-h-[85vh] overflow-auto w-full max-w-2xl"
          setOnOpen={() => {
            setOnOpen(0);
          }}
        />
        <div className=" w-full p-2 flex justify-end">
          <Button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="gap-2"
          >
            <Send />
            Sunbmit
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default SignatoryRegistry;
