import { useParams, useNavigate } from "react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/db/axios";
import { useQuery } from "@tanstack/react-query";
//
import { checkPositionInvitation } from "@/db/statements/position";
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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Modal from "@/components/custom/Modal";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
//
import {
  Eye,
  EyeClosed,
  User,
  Lock,
  KeyRound,
  User2,
  AlertCircle,
  CheckCircle,
  Building2,
} from "lucide-react";

//
import type {
  FillPositionInvitationProps,
  FillPositionProps,
} from "@/interface/data";
import { FillPositionSchema } from "@/interface/zod";

const PositionInvitation = () => {
  const [onOpen, setOnOpen] = useState(0);
  const { positionInviteLinkId, linkApplicationId } = useParams();
  const nav = useNavigate();

  const { data, isFetching } = useQuery<FillPositionInvitationProps>({
    queryKey: ["positionInvite", positionInviteLinkId],
    queryFn: () => checkPositionInvitation(positionInviteLinkId as string),
    enabled: !!positionInviteLinkId,
  });

  const form = useForm<FillPositionProps>({
    resolver: zodResolver(FillPositionSchema),
    defaultValues: {
      username: "",
      password: "",
      viewPassword: false,
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

  const onSubmit = async (formData: FillPositionProps) => {
    if (!data || !positionInviteLinkId || !linkApplicationId) return;
    try {
      const response = await axios.post(
        "/position/account-register",
        {
          lineId: data.lineId,
          slotId: data.positionSlotId,
          linkId: positionInviteLinkId,
          applicationId: linkApplicationId,
          ...formData,
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
          setError("username", { message: "Username already exists" });
          setOnOpen(0);
          return;
        }
        toast.success("Registration Successful");
        setTimeout(() => {
          nav("/auth", { replace: true });
        }, 1500);
      }
    } catch (error) {
      toast.error("Registration Failed", {
        description: `${error}`,
      });
      setOnOpen(0);
    }
  };

  const formValues = getValues();

  // Loading State
  if (isFetching) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header Card */}
        <Card className="border shadow-sm mb-4 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600" />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
                <User2 className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-lg font-bold text-gray-900">
                  Position Registration
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {data?.unitPoistion?.position?.name || "Position"}{" "}
                  Registration
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Position Info Card */}
        {data?.unitPoistion && (
          <Card className="border shadow-sm mb-4 bg-blue-50/50 border-blue-100">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">
                  Applying for:
                </span>
                <Badge className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">
                  {data.unitPoistion.position.name}
                </Badge>
              </div>
              {positionInviteLinkId && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-blue-100">
                  <KeyRound className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-xs text-gray-500">Invitation ID:</span>
                  <span className="text-xs font-mono text-gray-600">
                    {positionInviteLinkId.slice(0, 8)}...
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Registration Form Card */}
        <Card className="border shadow-sm overflow-hidden">
          <CardContent className="p-4">
            <Form {...form}>
              <div className="space-y-4">
                {/* Username Field */}
                <FormField
                  control={control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">
                        Username
                      </FormLabel>
                      <FormControl>
                        <InputGroup>
                          <InputGroupAddon className="bg-gray-50 border-r-0">
                            <User className="h-4 w-4 text-gray-400" />
                          </InputGroupAddon>
                          <InputGroupInput
                            placeholder="Choose a username"
                            {...field}
                            className="h-9 text-sm border-l-0 focus:border-blue-500"
                          />
                        </InputGroup>
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        Unique username for system login
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password Field */}
                <FormField
                  control={control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">
                        Password
                      </FormLabel>
                      <FormControl>
                        <InputGroup>
                          <InputGroupAddon className="bg-gray-50 border-r-0">
                            <Lock className="h-4 w-4 text-gray-400" />
                          </InputGroupAddon>
                          <InputGroupInput
                            placeholder="Create a strong password"
                            type={viewPassword ? "text" : "password"}
                            {...field}
                            className="h-9 text-sm border-l-0 focus:border-blue-500"
                          />
                          <InputGroupButton
                            type="button"
                            onClick={() =>
                              setValue("viewPassword", !viewPassword)
                            }
                            className="border-l-0 h-9 px-3"
                          >
                            {viewPassword ? (
                              <EyeClosed className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </InputGroupButton>
                        </InputGroup>
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        Minimum 8 characters with letters, numbers, and symbols
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator className="my-2" />

                {/* Submit Button */}
                <Button
                  disabled={isSubmitting}
                  onClick={() => {
                    form.trigger().then((isValid) => {
                      if (isValid) {
                        setOnOpen(1);
                      }
                    });
                  }}
                  className="w-full h-9 text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2 justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    "Register Account"
                  )}
                </Button>
              </div>
            </Form>
          </CardContent>
        </Card>

        {/* Info Alert */}
        <div className="mt-4 flex items-start gap-2 p-3 rounded-md bg-amber-50 border border-amber-100">
          <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            After registration, you will be automatically logged in and
            redirected to the login page.
          </p>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        onFunction={handleSubmit(onSubmit)}
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-green-100">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <span className="text-base font-semibold text-gray-900">
              Confirm Registration
            </span>
          </div>
        }
        children={
          <div className="space-y-4">
            {/* Confirmation Message */}
            <p className="text-sm text-gray-600">
              Please review your registration details before confirming.
            </p>

            {/* Registration Summary */}
            <Card className="border bg-gray-50">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">
                    Username:
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {formValues.username}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">
                    Position:
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {data?.unitPoistion?.position?.name || "N/A"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-md bg-blue-50 p-3 border border-blue-100">
              <p className="text-xs text-blue-700">
                By confirming, you agree to create an account with the provided
                credentials.
              </p>
            </div>
          </div>
        }
        onOpen={onOpen === 1}
        className="max-w-md"
        setOnOpen={() => setOnOpen(0)}
        loading={isSubmitting}
        cancelTitle="Cancel"
        yesTitle="Confirm Registration"
        footer={true}
      />
    </div>
  );
};

export default PositionInvitation;
