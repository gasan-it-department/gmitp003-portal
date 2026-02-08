import { useParams, useNavigate } from "react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/db/axios";
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
import {
  InputGroup,
  InputGroupInput,
  InputGroupButton,
  InputGroupAddon,
} from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Modal from "@/components/custom/Modal";
import { Card, CardContent } from "@/components/ui/card";
//
import {
  Eye,
  EyeClosed,
  Phone,
  Mail,
  User,
  Lock,
  Contact,
  KeyRound,
  Building2,
  AlertTriangle,
} from "lucide-react";

//interface/props/schema
import type { LineRegisterProps } from "@/interface/data";
import { LineRegisterSchema } from "@/interface/zod";

const LineRegistration = () => {
  const [onOpen, setOnOpen] = useState(0);
  const { lineId, unitPosId, sgId } = useParams();
  const nav = useNavigate();

  const form = useForm({
    resolver: zodResolver(LineRegisterSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      username: "",
      password: "",
      teleNumber: "",
      viewPassword: false,
      email: "",
      personalEmail: "",
      personalPhoneNumber: "",
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    watch,
    control,
    setValue,
    setError,
    getValues,
  } = form;

  const viewPassword = watch("viewPassword");

  const onSubmit = async (data: LineRegisterProps) => {
    try {
      const response = await axios.post(
        "/line/register",
        {
          lineId,
          unitPosId,
          sgId,
          ...data,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
        },
      );

      if (response.status !== 200) {
        throw new Error(response.data);
      } else {
        if (response.data.error === 1) {
          setError("username", { message: "Username already exist" });
          setOnOpen(0);
          return;
        }
        toast.success("Registration Successful", {
          description: "HRMO administrator has been registered successfully.",
        });
        setTimeout(() => {
          nav("/auth", { replace: true });
        }, 1500);
      }
    } catch (error) {
      toast.error("TRANSACTION FAILED", {
        description: `${error}`,
      });
      setOnOpen(0);
    }
  };

  const formValues = getValues();

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-6">
      <div className="w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-blue-50 rounded-lg">
              <Building2 className="h-6 w-6 md:h-7 md:w-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Line Registration
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                Register HRMO administrator for this organizational line
              </p>
            </div>
          </div>
          {lineId && (
            <Badge
              variant="outline"
              className="w-fit font-normal text-xs md:text-sm"
            >
              Line ID: {lineId}
            </Badge>
          )}
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-xl md:rounded-lg border border-gray-200 shadow-sm md:shadow p-4 md:p-6">
          <Form {...form}>
            <div className="space-y-6 md:space-y-8">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-gray-100 rounded-md">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-base md:text-lg">
                    Basic Information
                  </h3>
                </div>

                <div className="space-y-4">
                  <FormField
                    control={control}
                    name="firstname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          First name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter first name"
                            {...field}
                            className="h-11 md:h-10 text-base"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="lastname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Last name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter last name"
                            {...field}
                            className="h-11 md:h-10 text-base"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="personalEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <InputGroup>
                            <InputGroupAddon className="bg-gray-50 border-r-0">
                              <Mail className="h-4 w-4 text-gray-500" />
                            </InputGroupAddon>
                            <InputGroupInput
                              placeholder="hrmofficer.email@municipality.gov"
                              {...field}
                              className="pl-10 border-l-0 h-11 md:h-10 text-base"
                            />
                          </InputGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="personalPhoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Phone Number (optional)
                        </FormLabel>
                        <FormControl>
                          <InputGroup>
                            <InputGroupAddon className="bg-gray-50 border-r-0">
                              <Phone className="h-4 w-4 text-gray-500" />
                            </InputGroupAddon>
                            <InputGroupInput
                              placeholder="+63 XXX XXX XXXX"
                              {...field}
                              className="pl-10 border-l-0 h-11 md:h-10 text-base"
                            />
                          </InputGroup>
                        </FormControl>
                        <FormDescription className="text-xs mt-1">
                          Office telephone number with country code
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* HRMO Contact Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-gray-100 rounded-md">
                    <Contact className="h-4 w-4 text-gray-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-base md:text-lg">
                    HRMO Contact Information
                  </h3>
                </div>

                <div className="space-y-4">
                  <FormField
                    control={control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <InputGroup>
                            <InputGroupAddon className="bg-gray-50 border-r-0">
                              <Mail className="h-4 w-4 text-gray-500" />
                            </InputGroupAddon>
                            <InputGroupInput
                              placeholder="hrmo.email@municipality.gov"
                              {...field}
                              className="pl-10 border-l-0 h-11 md:h-10 text-base"
                            />
                          </InputGroup>
                        </FormControl>
                        <FormDescription className="text-xs mt-1">
                          Official email address for HRMO communications
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="teleNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Telephone Number
                        </FormLabel>
                        <FormControl>
                          <InputGroup>
                            <InputGroupAddon className="bg-gray-50 border-r-0">
                              <Phone className="h-4 w-4 text-gray-500" />
                            </InputGroupAddon>
                            <InputGroupInput
                              placeholder="(042) XXX XXXX"
                              {...field}
                              className="pl-10 border-l-0 h-11 md:h-10 text-base"
                            />
                          </InputGroup>
                        </FormControl>
                        <FormDescription className="text-xs mt-1">
                          Office telephone number with country code
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Account Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-gray-100 rounded-md">
                    <KeyRound className="h-4 w-4 text-gray-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-base md:text-lg">
                    Administrator Account
                  </h3>
                </div>

                <div className="space-y-4">
                  <FormField
                    control={control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Username
                        </FormLabel>
                        <FormControl>
                          <InputGroup>
                            <InputGroupAddon className="bg-gray-50 border-r-0">
                              <User className="h-4 w-4 text-gray-500" />
                            </InputGroupAddon>
                            <InputGroupInput
                              placeholder="Choose a username"
                              {...field}
                              className="pl-10 border-l-0 h-11 md:h-10 text-base"
                            />
                          </InputGroup>
                        </FormControl>
                        <FormDescription className="text-xs mt-1">
                          Unique username for system login
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
                        <FormLabel className="text-sm font-medium">
                          Password
                        </FormLabel>
                        <FormControl>
                          <InputGroup>
                            <InputGroupAddon className="bg-gray-50 border-r-0">
                              <Lock className="h-4 w-4 text-gray-500" />
                            </InputGroupAddon>
                            <InputGroupInput
                              placeholder="Create a strong password"
                              type={viewPassword ? "text" : "password"}
                              {...field}
                              className="pl-10 border-l-0 h-11 md:h-10 text-base"
                            />
                            <InputGroupButton
                              type="button"
                              onClick={() =>
                                setValue("viewPassword", !viewPassword)
                              }
                              className="border-l-0 h-11 md:h-10"
                            >
                              {viewPassword ? (
                                <Eye className="h-4 w-4 text-gray-500" />
                              ) : (
                                <EyeClosed className="h-4 w-4 text-gray-500" />
                              )}
                            </InputGroupButton>
                          </InputGroup>
                        </FormControl>
                        <FormDescription className="text-xs mt-1">
                          Minimum 8 characters with letters, numbers, and
                          symbols
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Submit Section */}
              <div className="pt-4 md:pt-6 border-t">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="text-sm text-gray-600 md:text-left text-center">
                    Fill all required fields to complete registration
                  </div>
                  <Button
                    size="lg"
                    disabled={isSubmitting}
                    onClick={() => {
                      // Validate form before showing modal
                      form.trigger().then((isValid) => {
                        if (isValid) {
                          setOnOpen(1);
                        }
                      });
                    }}
                    className="w-full md:w-auto h-12 md:h-10 px-6 text-base bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2 justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 md:h-3.5 md:w-3.5 border-2 border-white border-t-transparent"></div>
                        <span>Registering...</span>
                      </div>
                    ) : (
                      "Register HRMO Administrator"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Form>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        onFunction={handleSubmit(onSubmit)}
        title="Confirm Registration"
        children={
          <div className="space-y-4">
            {/* Warning Icon */}
            <div className="flex items-center justify-center mb-2">
              <div className="p-3 bg-amber-50 rounded-full">
                <AlertTriangle className="h-8 w-8 text-amber-600" />
              </div>
            </div>

            {/* Confirmation Message */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Confirm HRMO Administrator Registration
              </h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to register this HRMO administrator? This
                action cannot be undone.
              </p>
            </div>

            {/* Registration Summary */}
            <Card className="border">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Administrator:
                    </span>
                    <span className="text-sm text-gray-900">
                      {formValues.firstname} {formValues.lastname}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Username:
                    </span>
                    <span className="text-sm text-gray-900">
                      {formValues.username}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      HRMO Email:
                    </span>
                    <span className="text-sm text-gray-900 truncate max-w-[200px]">
                      {formValues.email}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Line ID:
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {lineId}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        }
        onOpen={onOpen === 1}
        className="max-w-md md:max-w-lg"
        setOnOpen={() => setOnOpen(0)}
        loading={isSubmitting}
        cancelTitle="Cancel"
        footer={true}
      />
    </div>
  );
};

export default LineRegistration;
