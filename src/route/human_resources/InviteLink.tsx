import React from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import axios from "@/db/axios";
//
import {
  FormControl,
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
//
import type { InvitationLinkProps, AddUserProps } from "@/interface/data";
import { AddUserSchema } from "@/interface/zod";

//statements
import { getInvitationLink } from "@/db/statement";
import { formatDate } from "@/utils/date";
import { zodResolver } from "@hookform/resolvers/zod";

const InviteLink = () => {
  const { invitationId } = useParams<{ invitationId: string }>();

  const { data, isFetching, error } = useQuery<{ data: InvitationLinkProps }>({
    queryKey: ["invitationLink", invitationId],
    queryFn: () => getInvitationLink(invitationId!, "your_token_here"),
    enabled: !!invitationId,
  });

  const form = useForm<AddUserProps>({
    resolver: zodResolver(AddUserSchema),
  });
  const {
    handleSubmit,
    control,
    formState: { isSubmitting, errors },
  } = form;
  console.log(data);

  if (isFetching) {
    return (
      <div className=" w-full h-screen grid place-items-center">
        <div className=" w-full h-full lg:w-1/2 lg:h-2/3 bg-amber-100">
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className=" w-full h-screen grid place-items-center">
        <div className=" w-full h-full lg:w-1/2 lg:h-2/3 bg-red-100">
          <p>Error: {error.message}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.data) {
    return (
      <div className=" w-full h-screen grid place-items-center">
        <div className=" w-full h-full lg:w-1/2 lg:h-2/3 bg-yellow-100">
          <p>No invitation found.</p>
        </div>
      </div>
    );
  }
  return (
    <div className=" w-full h-screen grid place-items-center">
      <div className=" w-full h-full border p-2 rounded">
        <Form {...form}>
          <form
            onSubmit={handleSubmit((values) => {
              console.log("Form submitted with values:", values);
            })}
            className=" w-full h-full grid grid-cols-1 lg:grid-cols-2 gap-4 p-4"
          >
            <div className=" col-span-2 col-start-1 lg:col-start-1 bg-amber-100 flex flex-col items-center">
              <FormDescription>
                Invitation Link ID: {data.data.id}
              </FormDescription>
              <FormDescription>
                Invitation Link expiration:{" "}
                {data.data.expiresAt
                  ? formatDate(data.data.expiresAt)
                  : "No expiration date"}
              </FormDescription>
            </div>
            <div className=" col-span-1 row-start-2">
              <p className=" text-2xl font-medium mt-2">Basic Infomation</p>
              <FormField
                control={control}
                name="lastName"
                render={({ field }) => (
                  <FormItem className=" mt-8">
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="firstName"
                render={({ field }) => (
                  <FormItem className=" mt-2">
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="middleName"
                render={({ field }) => (
                  <FormItem className=" mt-2">
                    <FormLabel>Middle name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="suffix"
                render={({ field }) => (
                  <FormItem className=" mt-2">
                    <FormLabel>Suffix (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="gender"
                render={({ field }) => (
                  <FormItem className=" mt-2">
                    <FormLabel></FormLabel>
                    <FormControl>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Femail</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem className="mt-2">
                    <FormLabel>Birth Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={
                          field.value
                            ? field.value.toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) => {
                          field.onChange(
                            e.target.value
                              ? new Date(e.target.value)
                              : undefined
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className=" col-span-1 lg:col-start-2 lg:row-start-2 row-start-3">
              <p className=" text-2xl font-medium mt-2">Account</p>
              <FormField
                control={control}
                name="username"
                render={({ field }) => (
                  <FormItem className=" mt-8">
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="password"
                render={({ field }) => (
                  <FormItem className=" mt-2">
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className=" mt-2">
                    <FormLabel>Confim Password</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="email"
                render={({ field }) => (
                  <FormItem className=" mt-2">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-2 row-start-4 lg:col-span-1 lg:row-start-3 lg:col-start-2 flex lg:justify-end lg:items-end ">
              <Button type="submit" className=" ">
                Submit
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default InviteLink;
