import { useState } from "react";
import zod from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "@/db/axios";
//
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Modal from "@/components/custom/Modal";
import UserSelection from "../UserSelection";
//
import { SignatoryFormSchema } from "@/interface/zod";
import type { User } from "@/interface/data";
//
import {
  Building2,
  Users,
  UserPlus,
  Trash2,
  Send,
  MapPin,
  ShieldCheck,
  Loader2,
} from "lucide-react";

type SignatoryFormProps = zod.infer<typeof SignatoryFormSchema>;

interface Props {
  lineId: string;
  token: string;
  userId: string;
  queryClient: QueryClient;
}

// Authorized-user role labels — index maps directly to the `type` string
// the backend persists (kept stable for compatibility).
const ROLES = [
  { value: "0", label: "Receiver",  hint: "Receives and acknowledges documents" },
  { value: "1", label: "Signee",    hint: "Required to sign documents in this room" },
  { value: "2", label: "Operator",  hint: "Operates the room on behalf of a signee" },
];

const surfaceErr = (err: unknown, fallback = "Something went wrong") => {
  const e = err as any;
  return e?.response?.data?.message || e?.response?.data?.error || e?.message || fallback;
};

const SignatoryRegistry = ({ lineId, token, userId, queryClient }: Props) => {
  const [pickerOpen, setPickerOpen] = useState(false);

  const form = useForm<SignatoryFormProps>({
    resolver: zodResolver(SignatoryFormSchema),
    defaultValues: { authorizedUser: [], address: "" },
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
      toast.info(
        `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
          "User already added.",
      );
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
        throw new Error(response.data?.message || "Request failed");
      }
      // Duplicate user detected on the backend — flag the offending row.
      if (response.data?.status === 1 && response.data?.existedUserId) {
        const i = data.authorizedUser.findIndex((item) =>
          response.data.existedUserId.includes(item.userId),
        );
        if (i >= 0) {
          setError(`authorizedUser.${i}`, {
            message: "Already part of an existing room",
          });
        }
        return;
      }
      await queryClient.invalidateQueries({
        queryKey: ["signatory-registry", userId],
      });
      toast.success("Room registration submitted.");
    } catch (error) {
      toast.error(surfaceErr(error, "Failed to submit room registration."));
    }
  };

  return (
    <div className="w-full h-full overflow-auto bg-gradient-to-br from-blue-50/40 to-indigo-50/30">
      <div className="max-w-3xl mx-auto p-4 space-y-3">
        {/* Header strip */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-blue-600 flex items-center justify-center">
              <ShieldCheck className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-900">
                Register a Receiving Room
              </div>
              <div className="text-[10px] text-gray-500">
                Set the room address and authorize the users who can act on
                its documents. Submit to send it to HR for approval.
              </div>
            </div>
            <Badge
              variant="outline"
              className="ml-auto text-[10px] h-5 px-1.5 bg-amber-50 text-amber-700 border-amber-200"
            >
              Pending after submit
            </Badge>
          </div>
        </div>

        <Form {...form}>
          {/* Address */}
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-2">
              <MapPin className="h-3 w-3 text-gray-500" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-700">
                Address
              </span>
            </div>
            <div className="p-3">
              <FormField
                control={control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-semibold uppercase text-gray-600">
                      Room address
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. 2nd Floor, Annex Building, Municipal Hall"
                        className="h-8 text-xs"
                        {...field}
                      />
                    </FormControl>
                    <div className="text-[10px] text-gray-500 mt-1">
                      Where this room physically operates — used in
                      dissemination headers and the room directory.
                    </div>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Authorized users */}
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-2">
              <Users className="h-3 w-3 text-gray-500" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-700">
                Authorized users
              </span>
              <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                {fields.length}
              </Badge>
              <Button
                type="button"
                size="sm"
                className="h-7 text-xs ml-auto"
                onClick={() => setPickerOpen(true)}
              >
                <UserPlus className="h-3.5 w-3.5 mr-1" /> Add user
              </Button>
            </div>

            {fields.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <div className="text-xs font-medium text-gray-700">
                  No authorized users yet
                </div>
                <div className="text-[10px] text-gray-500 max-w-sm mx-auto mt-1">
                  Pick at least one user. Assign them a role: receivers
                  acknowledge documents, signees sign them, operators act on
                  behalf of a signee.
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs mt-3"
                  onClick={() => setPickerOpen(true)}
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1" /> Pick users
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {fields.map((field, index) => {
                  const fieldErr = errors.authorizedUser?.[index];
                  return (
                    <div
                      key={field.id}
                      className="px-3 py-2 flex items-center gap-2"
                    >
                      <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium truncate">
                          {field.firstname} {field.lastname}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">
                          @{field.username}
                        </div>
                        {fieldErr ? (
                          <div className="text-[10px] text-rose-600 mt-0.5">
                            {fieldErr.message as string}
                          </div>
                        ) : null}
                      </div>
                      <Select
                        defaultValue={field.type}
                        onValueChange={(v) =>
                          setValue(`authorizedUser.${index}.type`, v)
                        }
                      >
                        <SelectTrigger className="h-7 text-xs w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem
                              key={r.value}
                              value={r.value}
                              className="text-xs"
                            >
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Form-level array error (e.g. min length) */}
            {typeof errors.authorizedUser?.message === "string" ? (
              <div className="px-3 py-1.5 border-t bg-rose-50/40 text-[10px] text-rose-700">
                {errors.authorizedUser.message}
              </div>
            ) : null}
          </div>

          {/* Submit bar */}
          <div className="border rounded-lg bg-white px-3 py-2 flex items-center justify-between">
            <div className="text-[10px] text-gray-500 flex items-center gap-1.5">
              <Building2 className="h-3 w-3" />
              Once submitted, HR will review and approve the room before it
              becomes operational.
            </div>
            <Button
              type="submit"
              size="sm"
              className="h-8 text-xs"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5 mr-1" />
              )}
              Submit registration
            </Button>
          </div>
        </Form>

        {/* User picker modal. Plain JSX inside — wrapping it in FormField
            crashes because Radix's Dialog portal disconnects `useFormContext`
            on first render. The picker drives the form via `append()` from
            useFieldArray, so it doesn't need to be a form field itself. */}
        <Modal
          title="Choose authorized users"
          onOpen={pickerOpen}
          setOnOpen={() => setPickerOpen(false)}
          footer={1}
          onFunction={() => {}}
          className="max-h-[85vh] overflow-auto w-full max-w-2xl"
        >
          <div className="-mx-1">
            <UserSelection
              lineId={lineId}
              token={token}
              onSelect={handleSelectUser}
            />
            <div className="px-3 py-2 border-t bg-gray-50 flex items-center justify-between mt-2">
              <span className="text-[10px] text-gray-500">
                {fields.length} selected
              </span>
              <Button
                type="button"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setPickerOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default SignatoryRegistry;
