import { setCookie } from "@/utils/cookies";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/db/axios";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { AdminLoginSchema } from "@/interface/zod";
import { type AdminLoginProps } from "@/interface/data";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Shield,
  Building,
  ArrowRight,
  KeyRound,
} from "lucide-react";

const AdminLogin = () => {
  const nav = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AdminLoginProps>({
    resolver: zodResolver(AdminLoginSchema),
    defaultValues: {
      password: "",
      username: "",
    },
  });

  const {
    handleSubmit,
    setError,
    formState: { errors },
  } = form;

  const onSubmit = async (data: AdminLoginProps) => {
    setIsLoading(true);
    try {
      const response = await axios.post("/admin-login", {
        username: data.username,
        password: data.password,
      });

      if (response.status === 200 && response.data.error === 1) {
        setError("root", { message: response.data.message });
        toast.error("Login Failed", {
          description: response.data.message,
        });
        setIsLoading(false);
        return;
      }

      const { admin } = response.data;

      setCookie(`auth_admin_token-${admin.id}`, admin.token, 1);
      localStorage.setItem("auth_admin", admin.id);

      // Small delay for better UX
      setTimeout(() => {
        nav("/admin-panel");
      }, 1000);
    } catch (error: any) {
      console.log(error);
      toast.error("Login Failed", {
        description:
          error?.response?.data?.message || "An unexpected error occurred",
      });
      setError("root", {
        message:
          error?.response?.data?.message || "Login failed. Please try again.",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl shadow-lg mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-blue-200 text-sm">
            Secure access to system administration
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Building className="w-5 h-5 text-blue-300" />
            <h2 className="text-xl font-semibold text-white">
              Sign in to continue
            </h2>
          </div>

          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Root Error Display */}
              {errors.root && (
                <Alert
                  variant="destructive"
                  className="border-red-400/50 bg-red-500/10"
                >
                  <AlertDescription className="text-red-200">
                    {errors.root.message}
                  </AlertDescription>
                </Alert>
              )}

              {/* Username Field */}
              <FormField
                name="username"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300 text-sm font-medium">
                      Username
                    </FormLabel>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-blue-400" />
                      </div>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter your username"
                          className="pl-10 bg-white/5 border-gray-600 text-white placeholder:text-gray-400 h-12 focus:border-blue-500 focus:ring-blue-500"
                          disabled={isLoading}
                        />
                      </FormControl>
                    </div>
                    {errors.username && (
                      <FormMessage className="text-red-300">
                        {errors.username.message}
                      </FormMessage>
                    )}
                  </FormItem>
                )}
              />

              {/* Password Field */}
              <FormField
                name="password"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300 text-sm font-medium">
                      Password
                    </FormLabel>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-blue-400" />
                      </div>
                      <FormControl>
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="pl-10 pr-10 bg-white/5 border-gray-600 text-white placeholder:text-gray-400 h-12 focus:border-blue-500 focus:ring-blue-500"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <FormMessage className="text-red-300">
                        {errors.password.message}
                      </FormMessage>
                    )}
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Continue to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>
          </Form>

          {/* Security Note */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex items-start gap-3">
              <KeyRound className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-400">
                This is a secure admin portal. Access is restricted to
                authorized personnel only. All activities are logged and
                monitored.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Admin Portal v1.0 • All rights reserved
          </p>
          <p className="text-xs text-gray-500 mt-1">
            For technical support, contact system administrator
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
