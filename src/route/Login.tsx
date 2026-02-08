import { useState } from "react";

//components
import {
  Form,
  FormControl,
  FormItem,
  FormMessage,
  FormField,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupInput,
  InputGroupButton,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import Modal from "@/components/custom/Modal";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
//libs
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/db/axios";
//assets
import Logo1 from "../../public/assets/OM.png";
import Logo2 from "../../public/assets/bp_logo.png";

//
import { setCookie } from "@/utils/cookies";
//interface
import { LoginSchema } from "@/interface/zod";
import type { LoginProps } from "@/interface/data";
import {
  TriangleAlert,
  Eye,
  EyeClosed,
  Lock,
  User,
  Building2,
} from "lucide-react";

const Login = () => {
  const [onOpen, setOnOpen] = useState(0);
  const form = useForm<LoginProps>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  const {
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
    control,
  } = form;
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const handle = async (data: LoginProps) => {
    try {
      const response = await axios.post("/auth", {
        username: data.username,
        password: data.password,
      });

      if (response.status === 200) {
        console.log(response.data);

        if (response.data.error === 1) {
          setError("username", { message: response.data.message });
          return;
        }
        if (response.data.error === 2) {
          setError("password", { message: response.data.message });
          return;
        }
        if (response.data.error === 4) {
          setError("root", { message: response.data.message });
          return;
        }
        const token = response.data.data.token;

        // if (response.data.error === 4) {
        //   setOnOpen(1);
        //   return;
        // }
        setCookie(`auth_token-${response.data.data.id}`, token, 1);
        localStorage.setItem("user", response.data.data.id);
        navigate(`/${response.data.data.line}`);
      } else {
        throw new Error("Login failed");
      }
      console.log({ data });
    } catch (error) {
      setError("root", {
        message: "Login failed. Something went wrong, Please try again.",
      });
      console.log(error);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-0 md:p-4">
      <Card className="w-full h-screen md:h-auto md:max-w-md md:border-0 md:shadow-xl md:rounded-lg rounded-none border-0 shadow-none">
        <CardHeader className="pb-3 pt-8 md:pt-6">
          {/* Logo Section */}
          <div className="flex flex-col items-center space-y-4">
            {/* Mobile View - Simplified */}
            <div className="md:hidden flex flex-col items-center space-y-3 mb-4">
              <div className="flex items-center justify-center gap-4">
                <div className="w-14 h-14 bg-white border rounded-lg flex items-center justify-center p-2">
                  <img
                    src={Logo1}
                    alt="Municipality Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <Building2 className="h-8 w-8 text-blue-600" />
                <div className="w-14 h-14 bg-white border rounded-lg flex items-center justify-center p-2">
                  <img
                    src={Logo2}
                    alt="BP Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Republic of the Philippines
                </p>
                <h1 className="text-base font-bold text-gray-900 mt-1">
                  Province of Marinduque
                </h1>
                <h2 className="text-sm font-semibold text-gray-800">
                  Municipality of Gasan
                </h2>
              </div>
            </div>

            {/* Desktop View */}
            <div className="hidden md:flex items-center justify-center gap-6 mb-2">
              <div className="w-16 h-16 bg-white border rounded-lg flex items-center justify-center p-2">
                <img
                  src={Logo1}
                  alt="Municipality Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Republic of the Philippines
                </p>
                <h1 className="text-lg font-bold text-gray-900 mt-1">
                  Province of Marinduque
                </h1>
                <h2 className="text-base font-semibold text-gray-800">
                  Municipality of Gasan
                </h2>
              </div>
              <div className="w-16 h-16 bg-white border rounded-lg flex items-center justify-center p-2">
                <img
                  src={Logo2}
                  alt="BP Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <Separator className="hidden md:block" />
          </div>
        </CardHeader>

        <CardContent className="px-6 md:px-6">
          <Form {...form}>
            {/* Error Display */}
            {errors.root && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <TriangleAlert className="h-4 w-4 text-red-600" />
                  <p className="text-sm font-medium text-red-700">
                    {errors.root.message}
                  </p>
                </div>
              </div>
            )}

            {/* Username Field */}
            <FormField
              control={control}
              name="username"
              render={({ field: { onBlur, onChange, value } }) => (
                <FormItem className="mb-4">
                  <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <User className="h-4 w-4" />
                    Username
                  </FormLabel>
                  <FormControl>
                    <Input
                      onBlur={onBlur}
                      onChange={onChange}
                      value={value}
                      placeholder="Enter your username"
                      className="h-12 md:h-11 text-base"
                    />
                  </FormControl>
                  <div className="h-5">
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {/* Password Field */}
            <FormField
              control={control}
              name="password"
              render={({ field: { onBlur, onChange, value } }) => (
                <FormItem className="mb-6">
                  <FormLabel className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Lock className="h-4 w-4" />
                    Password
                  </FormLabel>
                  <FormControl>
                    <InputGroup>
                      <InputGroupInput
                        onBlur={onBlur}
                        onChange={onChange}
                        value={value}
                        placeholder="Enter your password"
                        type={showPassword ? "text" : "password"}
                        className="h-12 md:h-11 text-base"
                      />
                      <InputGroupButton
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="h-12 md:h-11"
                      >
                        {showPassword ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeClosed className="h-4 w-4" />
                        )}
                      </InputGroupButton>
                    </InputGroup>
                  </FormControl>
                  <div className="h-5">
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </Form>
        </CardContent>

        <CardFooter className="pt-2 pb-8 md:pb-6 px-6 md:px-6">
          <Button
            disabled={isSubmitting}
            onClick={handleSubmit(handle)}
            size="lg"
            className="w-full h-14 md:h-12 text-base md:text-base font-medium bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 md:h-4 md:w-4 border-2 border-white border-t-transparent"></div>
                <span>Authenticating...</span>
              </div>
            ) : (
              "Login"
            )}
          </Button>

          {/* Security Note - Mobile Only */}
          <div className="mt-4 text-center w-full md:hidden">
            <p className="text-xs text-gray-500">
              <Lock className="inline-block h-3 w-3 mr-1" />
              Your credentials are encrypted and secure
            </p>
          </div>
        </CardFooter>
      </Card>

      <Modal
        title={""}
        children={<div className="w-full"></div>}
        onOpen={onOpen === 1}
        className={""}
        setOnOpen={() => setOnOpen(0)}
      />
    </div>
  );
};

export default Login;
