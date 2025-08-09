import { setCookie } from "@/utils/cookies";

//
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/db/axios";
//
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
//
import { AdminLoginSchema } from "@/interface/zod";
import { type AdminLoginProps } from "@/interface/data";
const AdminLogin = () => {
  const nav = useNavigate();
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
    formState: { isSubmitting, errors },
    control,
  } = form;

  const onSubmit = async (data: AdminLoginProps) => {
    try {
      const response = await axios.post("/admin-login", {
        username: data.username,
        password: data.password,
      });

      console.log(response.data);

      if (response.status === 200 && response.data.error === 1) {
        setError("root", { message: response.data.message });
        return;
      }
      const { admin } = response.data;
      console.log({ admin });

      setCookie("auth_admin_token", admin.token, 1);
      nav("/admin-panel");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className=" w-full h-screen grid bg-neutral-100">
      <div className=" w-full h-full m-auto lg:w-1/3 lg:h-1/2 border border-neutral-400 rounded bg-white p-4 flex flex-col justify-between">
        <Form {...form}>
          <div className=" w-full">
            <FormField
              name="username"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder=" Enter Username" />
                  </FormControl>
                  <div className=" w-full h-5 ">
                    {errors.username && (
                      <FormMessage>{errors.username.message}</FormMessage>
                    )}
                  </div>
                </FormItem>
              )}
            />
            <FormField
              name="password"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder=" Enter Password"
                      type="password"
                    />
                  </FormControl>
                  <div className=" w-full h-5 ">
                    {errors.password && (
                      <FormMessage>{errors.password.message}</FormMessage>
                    )}
                  </div>
                </FormItem>
              )}
            />
          </div>
          <div className=" w-full p-2">
            <Button
              disabled={isSubmitting}
              className=" w-full"
              size="sm"
              onClick={handleSubmit(onSubmit)}
            >
              Continue
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default AdminLogin;
