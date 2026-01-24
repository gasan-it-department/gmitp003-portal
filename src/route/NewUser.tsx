import { useParams, useNavigate } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import axios from "@/db/axios";

// Database and data
import type { NewUserProps } from "@/interface/data";

// Components
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Validation schema
import { NewUserSchema } from "@/interface/zod";

const NewUser = () => {
  const { lineId, applicationId } = useParams();
  const nav = useNavigate();

  const form = useForm<z.infer<typeof NewUserSchema>>({
    resolver: zodResolver(NewUserSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: NewUserProps) => {
    try {
      const response = await axios.post("/application/user/registration", {
        lineId,
        applicationId,
        ...data,
      });

      if (response.status !== 200) {
        throw new Error(response.data.message);
      }
      nav("/auth");
    } catch (error) {}
  };

  return (
    <div className="w-full min-h-screen bg-gray-50/50">
      {/* Mobile: Full screen card */}
      <div className="block md:hidden">
        <Card className="w-full h-screen rounded-none shadow-none border-0">
          <CardHeader className="text-center space-y-2 pt-8 px-6">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Create New Account
            </CardTitle>
            <CardDescription className="text-gray-600">
              Enter your details to create a new user account
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-8">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Username Field */}
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Username
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your username"
                          type="text"
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        Must be at least 4 characters long
                      </FormDescription>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Password Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your password"
                          type="password"
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        Must be at least 8 characters long
                      </FormDescription>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Confirm Password Field */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Confirm your password"
                          type="password"
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button
                  disabled={form.formState.isSubmitting}
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 text-base"
                >
                  Create Account
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Desktop: Centered card */}
      <div className="hidden md:flex items-center justify-center min-h-screen p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Create New Account
            </CardTitle>
            <CardDescription className="text-gray-600">
              Enter your details to create a new user account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Username Field */}
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Username
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your username"
                          type="text"
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        Must be at least 4 characters long
                      </FormDescription>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Password Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your password"
                          type="password"
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        Must be at least 8 characters long
                      </FormDescription>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Confirm Password Field */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Confirm your password"
                          type="password"
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button
                  disabled={form.formState.isSubmitting}
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
                >
                  Create Account
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewUser;
