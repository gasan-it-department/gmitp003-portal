import { useState } from "react";
import zod from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { QueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
//icons
import { PlusCircle, Trash2, Users, Upload, File, Send } from "lucide-react";

//utils
import { dataURLtoBlob } from "@/utils/file";
//
import { SignatoryFormSchema } from "@/interface/zod";
import type { User } from "@/interface/data";

type SignatoryFormProps = zod.infer<typeof SignatoryFormSchema>;
interface Props {
  lineId: string;
  token: string;
  userId: string;
  queryClient: QueryClient;
}

const SignatoryRegistry = ({ lineId, token, userId, queryClient }: Props) => {
  const [onOpen, setOnOpen] = useState(0);

  const form = useForm<SignatoryFormProps>({
    resolver: zodResolver(SignatoryFormSchema),
    defaultValues: {
      authorizedUser: [],
      address: "",
    },
  });
  const {
    control,
    formState: { isSubmitting, errors },
    handleSubmit,
    setValue,
    setError,
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "authorizedUser",
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
      type: "1",
    });
  };

  const onSubmit = async (data: SignatoryFormProps) => {
    try {
      const response = await axios.post(
        "/document/room/register",
        { userId, lineId, ...data },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );

      if (response.status !== 200) {
        throw new Error(response.data.message || "Request failed");
      }
      if (response.status === 200 && response.data.status === 1) {
        const index = data.authorizedUser.findIndex((item) =>
          response.data.existedUserId.includes(item.userId),
        );
        setError(`authorizedUser.${index}`, { message: "Already exist" });
        return;
      }
      await queryClient.invalidateQueries({
        queryKey: ["signatory-registry", userId],
      });
      toast.success("Signatory registry submitted successfully!");
      //setOnOpen(0);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit signatory registry.",
      );
    }
  };

  return (
    <div className="w-full space-y-6">
      <Form {...form}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Room Configuration
            </CardTitle>
            <FormDescription>
              Configure the room address a assign authorized users.
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
                      <div className=" flex gap-2">
                        <Select
                          defaultValue={field.type}
                          onValueChange={(e) =>
                            setValue(`authorizedUser.${index}.type`, e)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["Receiver", "Signee", "Operator"].map(
                              (item, i) => (
                                <SelectItem value={i.toString()}>
                                  {item}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {errors.authorizedUser && (
                        <FormMessage>
                          {errors.authorizedUser[index]?.message}
                        </FormMessage>
                      )}
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
                name="authorizedUser"
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
                    {errors.authorizedUser && (
                      <FormMessage>{errors.authorizedUser.message}</FormMessage>
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
