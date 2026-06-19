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
  ShieldCheck,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

const AdminLogin = () => {
  const nav = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AdminLoginProps>({
    resolver: zodResolver(AdminLoginSchema),
    defaultValues: { password: "", username: "" },
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

      // Any error code (1 not found, 2 wrong password, 9 server) is a failure —
      // the old code only handled `error === 1` and then crashed destructuring
      // the missing `admin` object on the other codes.
      if (response.data?.error) {
        setError("root", { message: response.data.message });
        toast.error("Login failed", { description: response.data.message });
        setIsLoading(false);
        return;
      }

      const { admin } = response.data;
      setCookie(`auth_admin_token-${admin.id}`, admin.token, 1);
      localStorage.setItem("auth_admin", admin.id);

      toast.success("Welcome back, admin");
      setTimeout(() => nav("/admin-panel", { replace: true }), 600);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "An unexpected error occurred";
      toast.error("Login failed", { description: message });
      setError("root", { message });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />

      <div className="w-full max-w-sm relative">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-900/40 mb-3">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Admin Console
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Restricted access · authorized personnel only
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-2xl p-6">
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {errors.root && (
                <Alert
                  variant="destructive"
                  className="border-red-400/40 bg-red-500/10"
                >
                  <AlertCircle className="h-4 w-4 text-red-300" />
                  <AlertDescription className="text-red-200 text-xs">
                    {errors.root.message}
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                name="username"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 text-xs font-medium">
                      Username
                    </FormLabel>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="admin"
                          autoComplete="username"
                          className="pl-9 h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:border-indigo-400 focus-visible:ring-indigo-500/30"
                          disabled={isLoading}
                        />
                      </FormControl>
                    </div>
                    <FormMessage className="text-red-300 text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                name="password"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 text-xs font-medium">
                      Password
                    </FormLabel>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <FormControl>
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className="pl-9 pr-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:border-indigo-400 focus-visible:ring-indigo-500/30"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        onClick={() => setShowPassword((s) => !s)}
                        disabled={isLoading}
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <FormMessage className="text-red-300 text-xs" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium shadow-lg shadow-indigo-900/30"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Authenticating…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign in <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>
          </Form>
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-5">
          © {new Date().getFullYear()} Gasan LGU Portal · Admin Console
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
