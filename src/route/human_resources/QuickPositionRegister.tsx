import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";

import { QuickPositionRegisterSchema } from "@/interface/zod";
import type { FillPositionInvitationProps } from "@/interface/data";
import { quickPositionRegister } from "@/db/statements/position";

import PublicRegionSelect from "@/layout/PublicRegionSelect";
import PublicProvinceSelect from "@/layout/PublicProvinceSelect";
import PublicMunicipalSelect from "@/layout/PublicMunicipalSelect";
import PublicBarangaySelect from "@/layout/PublicBarangaySelect";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Zap,
  Building2,
  Camera,
  Eye,
  EyeClosed,
  Loader2,
  User2,
} from "lucide-react";

type QuickProps = z.infer<typeof QuickPositionRegisterSchema>;

interface Props {
  data: FillPositionInvitationProps;
  linkId: string;
}

const MAX_PHOTO = 8 * 1024 * 1024; // 8 MB — matches the API guard.

const QuickPositionRegister = ({ data, linkId }: Props) => {
  const nav = useNavigate();
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  const form = useForm<QuickProps>({
    resolver: zodResolver(QuickPositionRegisterSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      middleName: "",
      suffix: "",
      email: "",
      mobileNumber: "",
      regionId: "",
      provinceId: "",
      municipalId: "",
      barangayId: "",
      username: "",
      password: "",
      viewPassword: false,
    },
  });
  const {
    control,
    handleSubmit,
    watch,
    setError,
    formState: { isSubmitting },
  } = form;

  const regionId = watch("regionId");
  const provinceId = watch("provinceId");
  const municipalId = watch("municipalId");

  const mut = useMutation({
    mutationFn: (v: QuickProps) =>
      quickPositionRegister({
        linkId,
        lineId: data.lineId,
        slotId: data.positionSlotId,
        username: v.username,
        password: v.password,
        firstName: v.firstName,
        lastName: v.lastName,
        middleName: v.middleName,
        suffix: v.suffix,
        birthDate: v.birthDate,
        gender: v.gender,
        email: v.email,
        mobileNumber: v.mobileNumber,
        regionId: v.regionId,
        provinceId: v.provinceId,
        municipalId: v.municipalId,
        barangayId: v.barangayId,
        photo,
      }),
    onSuccess: (res) => {
      if (res?.error === 1) {
        setError("username", { message: "Username already exists" });
        return;
      }
      toast.success("Registration successful", {
        description: "You can now sign in with your new account.",
      });
      setTimeout(() => nav("/auth", { replace: true }), 1400);
    },
    onError: (e) =>
      toast.error("Registration failed", { description: `${e}` }),
  });

  const onPickPhoto = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > MAX_PHOTO) {
      toast.error("Image must be 8 MB or smaller");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const positionName = data.unitPoistion?.position?.name ?? "Position";

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <Card className="border shadow-sm mb-4 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-400 to-amber-500" />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg shadow-sm">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-lg font-bold text-gray-900">
                  Quick Registration
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Just the essentials — no full Personal Data Sheet required.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              <Building2 className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">
                Applying for:
              </span>
              <Badge className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">
                {positionName}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm overflow-hidden">
          <CardContent className="p-5">
            <Form {...form}>
              <form
                onSubmit={handleSubmit((v) => mut.mutateAsync(v))}
                className="space-y-5"
              >
                {/* Profile photo */}
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-gray-100 border overflow-hidden flex items-center justify-center flex-shrink-0">
                    {preview ? (
                      <img
                        src={preview}
                        alt="Profile preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User2 className="h-8 w-8 text-gray-300" />
                    )}
                  </div>
                  <div>
                    <label className="inline-flex items-center gap-2 cursor-pointer rounded-md border bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                      <Camera className="h-4 w-4" />
                      {photo ? "Change photo" : "Upload photo"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => onPickPhoto(e.target.files?.[0])}
                      />
                    </label>
                    <p className="text-[11px] text-gray-500 mt-1">
                      JPG or PNG, up to 8 MB.
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    control={control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Juan" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last name *</FormLabel>
                        <FormControl>
                          <Input placeholder="dela Cruz" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="middleName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Middle name</FormLabel>
                        <FormControl>
                          <Input placeholder="Santos" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="suffix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Suffix</FormLabel>
                        <FormControl>
                          <Input placeholder="Jr., Sr., III" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Birthday + Sex */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    control={control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Birthday *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={
                              field.value
                                ? new Date(field.value)
                                    .toISOString()
                                    .slice(0, 10)
                                : ""
                            }
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? new Date(e.target.value)
                                  : undefined,
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sex *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    control={control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            autoCapitalize="none"
                            autoCorrect="off"
                            placeholder="you@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="mobileNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobile number *</FormLabel>
                        <FormControl>
                          <Input placeholder="09XX XXX XXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Address */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Address
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField
                      control={control}
                      name="regionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Region</FormLabel>
                          <FormControl>
                            <PublicRegionSelect
                              onChange={field.onChange}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="provinceId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Province</FormLabel>
                          <FormControl>
                            <PublicProvinceSelect
                              onChange={field.onChange}
                              regionId={regionId}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="municipalId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">
                            City / Municipality
                          </FormLabel>
                          <FormControl>
                            <PublicMunicipalSelect
                              onChange={field.onChange}
                              provinceId={provinceId}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="barangayId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Barangay</FormLabel>
                          <FormControl>
                            <PublicBarangaySelect
                              onChange={field.onChange}
                              municipalityId={municipalId}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Account */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    control={control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Choose a username"
                            autoCapitalize="none"
                            autoCorrect="off"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Used to sign in to the portal.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPw ? "text" : "password"}
                              placeholder="At least 8 characters"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPw((s) => !s)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showPw ? (
                                <EyeClosed className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || mut.isPending}
                  className="w-full h-10 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  {mut.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating your account…
                    </span>
                  ) : (
                    "Register"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="text-center text-[11px] text-gray-500 mt-3">
          After registering you'll be redirected to the sign-in page.
        </p>
      </div>
    </div>
  );
};

export default QuickPositionRegister;
