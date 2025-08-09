import { useState } from "react";

//components
import {
  Form,
  FormControl,
  FormDescription,
  FormItem,
  FormMessage,
  FormField,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import Modal from "@/components/custom/Modal";
//libs
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { useUser } from "@/provider/UserProvider";
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
import { TriangleAlert } from "lucide-react";
const Login = () => {
  const [onOpen, setOnOpen] = useState(0);
  const { setUser } = useUser();
  const form = useForm<LoginProps>({
    resolver: zodResolver(LoginSchema),
  });
  const {
    handleSubmit,
    setError,
    formState: { isSubmitting, submitCount, errors },
    control,
  } = form;
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const handle = async (data: LoginProps) => {
    try {
      console.log(data);

      const response = await axios.post("/auth", {
        username: data.username,
        password: data.password,
      });

      if (response.status === 200) {
        if (response.data.error === 1) {
          setError("username", { message: response.data.message });
          return;
        }
        if (response.data.error === 2) {
          setError("password", { message: response.data.message });
          return;
        }
        const token = response.data.data.token;
        console.log(response.data);

        if (response.data.error === 3) {
          setCookie("auth_token", token, 1);
          setError("root", { message: response.data.message });
          navigate(`/account-setup`);
          return;
        }
        if (response.data.error === 4) {
          setOnOpen(1);
          return;
        }
        setCookie("auth_token", token, 1);
        setUser({
          username: response.data.data.username,
          id: response.data.data.id,
          lineId: response.data.data.line,
          departmentId: response.data.data.departmentId,
        });
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
    <div className=" w-full h-screen lg:grid bg-neutral-100">
      <div className=" w-full h-full lg:w-1/3 lg:h-3/4 m-auto border border-neutral-300 bg-white p-2 rounded-md flex flex-col justify-between">
        <form className=" p-5">
          <div className=" w-full grid grid-cols-2 lg:grid-cols-4 grid-rows-2 lg:grid-rows-1 lg:mb-6">
            <div className=" col-span-1 col-start-1 row-start-1 grid">
              <img src={Logo1} alt="logo1" className=" lg:w-24 m-auto" />
            </div>
            <div className=" col-span-2 lg:col-start-2 lg:col-span-2 row-start-2 lg:row-start-1  text-center">
              <p className=" font-mono text-xs">Republic of the Phlippines</p>
              <p className=" text-sm">Province of Marinduque</p>
              <p>Municipality of Gasan</p>
            </div>
            <div className=" col-span-1 col-start-2 lg:col-start-4 row-start-1 grid">
              <img src={Logo2} alt="logo2" className=" lg:w-28 m-auto" />
            </div>
          </div>
          <Form {...form}>
            {errors.root && (
              <div className=" w-full p-2 text-center flex justify-center gap-2">
                <TriangleAlert color="#f00000" strokeWidth={1.5} />
                <p className=" font-medium text-red-500">
                  {errors.root.message}!
                </p>
              </div>
            )}
            <FormField
              control={control}
              name="username"
              render={({ field: { onBlur, onChange, value } }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      onBlur={onBlur}
                      onChange={onChange}
                      value={value}
                      placeholder="Username"
                    />
                  </FormControl>
                  <div className=" w-full h-6">
                    <p className="text-sm text-red-500">
                      {errors.username && errors.username.message}
                    </p>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="password"
              render={({ field: { onBlur, onChange, value } }) => (
                <FormItem className=" mt-1.5">
                  <FormControl>
                    <Input
                      onBlur={onBlur}
                      onChange={onChange}
                      value={value}
                      placeholder="Password"
                      type={showPassword ? "text" : "password"}
                    />
                  </FormControl>
                  <div className=" w-full h-6">
                    <p className="text-sm text-red-500">
                      {errors.password && errors.password.message}
                    </p>
                  </div>
                </FormItem>
              )}
            />
            <div className="w-auto flex gap-2 py-3">
              <Checkbox
                checked={showPassword}
                onCheckedChange={() => setShowPassword(!showPassword)}
                id="showPassword"
              />
              <FormLabel
                htmlFor="showPassword"
                className=" cursor-pointer text-xs"
              >
                Show password
              </FormLabel>
            </div>
          </Form>
        </form>

        <div className=" lg:mb-4 p-5">
          <Button
            disabled={isSubmitting}
            onClick={handleSubmit(handle)}
            color=""
            size="sm"
            className=" w-full rounded-full bg-amber-300 hover:bg-amber-400"
          >
            {isSubmitting ? "Please wait..." : "Login"}
          </Button>
        </div>
      </div>
      <Modal
        title={""}
        children={<div className=" w-full"></div>}
        onOpen={onOpen === 1}
        className={""}
        setOnOpen={() => setOnOpen(0)}
      />
    </div>
  );
};

export default Login;
