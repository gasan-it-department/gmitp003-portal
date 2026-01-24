import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { useParams, useNavigate } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/db/axios";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormMessage,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Key,
  Eye,
  EyeOff,
  RefreshCw,
  Shield,
  CheckCircle,
  Lock,
} from "lucide-react";

// Define the form schema with Zod
const formSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof formSchema>;

const ResetUserPassword = () => {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { resetLinkId, accountId } = useParams();
  const nav = useNavigate();

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const response = await axios.patch("/account/user/reset-password", {
        accountId,
        linkId: resetLinkId,
        password: data.newPassword,
      });

      if (response.status !== 200) {
        throw new Error(response.data.message);
      }
      toast.success("Password successfully reset!");
      setTimeout(() => {
        nav("/auth");
      }, 2000);
    } catch (error) {
      console.log(error);

      toast.error("FAILD TO SUBMIT");
    }
  };

  const handleClear = () => {
    form.reset();
  };

  // Calculate password strength
  const password = form.watch("newPassword");
  const passwordStrength = password ? Math.min(password.length * 8, 100) : 0;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid =
    password.length >= 8 &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumber &&
    hasSpecialChar;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Reset User Password</CardTitle>
            <CardDescription>
              Reset password for a user account. User will be forced to change
              it on next login.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Separator />

            {/* Password Fields */}
            <div className="space-y-4">
              {/* New Password Field */}
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">New Password</FormLabel>
                    <FormControl>
                      <InputGroup>
                        <InputGroupAddon>
                          <Key className="h-4 w-4 text-gray-500" />
                        </InputGroupAddon>
                        <InputGroupInput
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          {...field}
                          className="pl-10 pr-10"
                        />
                        <InputGroupAddon
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="cursor-pointer hover:bg-gray-100"
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </InputGroupAddon>
                      </InputGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confirm Password Field */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Confirm Password</FormLabel>
                    <FormControl>
                      <InputGroup>
                        <InputGroupAddon>
                          <Shield className="h-4 w-4 text-gray-500" />
                        </InputGroupAddon>
                        <InputGroupInput
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          {...field}
                          className="pl-10 pr-10"
                        />
                        <InputGroupAddon
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="cursor-pointer hover:bg-gray-100"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </InputGroupAddon>
                      </InputGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium">
                      Password Strength:
                    </span>
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isPasswordValid
                            ? "bg-green-500"
                            : passwordStrength > 50
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div
                      className={`flex items-center gap-1.5 ${
                        password.length >= 8
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${
                          password.length >= 8 ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                      <span>8+ characters</span>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${
                        hasUpperCase ? "text-green-600" : "text-gray-500"
                      }`}
                    >
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${
                          hasUpperCase ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                      <span>Uppercase</span>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${
                        hasLowerCase ? "text-green-600" : "text-gray-500"
                      }`}
                    >
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${
                          hasLowerCase ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                      <span>Lowercase</span>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${
                        hasNumber ? "text-green-600" : "text-gray-500"
                      }`}
                    >
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${
                          hasNumber ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                      <span>Number</span>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 ${
                        hasSpecialChar ? "text-green-600" : "text-gray-500"
                      }`}
                    >
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${
                          hasSpecialChar ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                      <span>Special char</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Success Message */}
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex flex-col gap-4">
        <div className="flex items-center justify-between w-full">
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={form.formState.isSubmitting}
          >
            Clear All
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={form.formState.isSubmitting}
            className="min-w-[120px]"
          >
            {form.formState.isSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <Key className="h-4 w-4 mr-2" />
                Reset Password
              </>
            )}
          </Button>
        </div>

        {/* Important Notes */}
        <div className="pt-4 border-t">
          <p className="text-xs text-gray-500">
            <strong>Note:</strong> This action is logged in the security audit
            trail. The user will receive an email notification and will be
            forced to change their password on next login.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ResetUserPassword;
