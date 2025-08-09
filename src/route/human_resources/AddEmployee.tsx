import React from "react";

//hooks and libs
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
//
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";

//
import { NewEmployeeSchema } from "@/interface/zod";
import type { NewEmployeeProps } from "@/interface/data";

import Regions from "@/layout/Region";
import Provinces from "@/layout/Province";
import Municipalities from "@/layout/Municipalities";
import Barangay from "@/layout/Barangay";

//
import { useAuth } from "@/provider/ProtectedRoute";
const AddEmployee = () => {
  const form = useForm<NewEmployeeProps>({
    resolver: zodResolver(NewEmployeeSchema),
  });
  const {
    handleSubmit,
    formState: { isSubmitting, errors },
    setError,
    control,
  } = form;

  const auth = useAuth();
  console.log({ auth });

  return (
    <div className=" w-full h-full  overflow-auto">
      {/* <Regions selectComp={false} token={auth.token as string} source={1} />
      <Provinces selectComp={false} code="170000000" />
      <Municipalities selectComp={false} code="174000000" />
      <Barangay selectComp={false} code="174003000" /> */}
      <div>
        <Form {...form}>
          <div>
            <FormDescription>Employee Information</FormDescription>
            <FormField
              control={control}
              name="lastName"
              render={({ field: { value, onBlur, onChange } }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input
                      onBlur={onBlur}
                      value={value}
                      onChange={onChange}
                      placeholder="Type last name here"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="firstName"
              render={({ field: { value, onBlur, onChange } }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input
                      onBlur={onBlur}
                      value={value}
                      onChange={onChange}
                      placeholder="Type first name here"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="middleName"
              render={({ field: { value, onBlur, onChange } }) => (
                <FormItem>
                  <FormLabel>Middle Name</FormLabel>
                  <FormControl>
                    <Input
                      onBlur={onBlur}
                      value={value}
                      onChange={onChange}
                      placeholder="Type middle name here"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="birthDate"
              render={({ field: { value, onBlur, onChange } }) => (
                <FormItem>
                  <FormLabel>Date of Birth (DD/MM/YYYY)</FormLabel>
                  <FormControl>
                    <Input
                      onBlur={onBlur}
                      onChange={onChange}
                      placeholder="Type fullname here"
                      type="date"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="firstName"
              render={({ field: { value, onBlur, onChange } }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input
                      onBlur={onBlur}
                      value={value}
                      onChange={onChange}
                      placeholder="Type fullname here"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </Form>
      </div>
    </div>
  );
};

export default AddEmployee;
