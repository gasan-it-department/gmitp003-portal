import { useId, useState } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
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
import Modal from "@/components/custom/Modal";
import ApplicantTaggedItem from "@/layout/human_resources/item/ApplicantTaggedItem";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";
//icons
import { CircleAlert, Plus, Send, Tags, Trash } from "lucide-react";
//
import type { InvitationLinkProps, AddUserProps } from "@/interface/data";
import { AddUserSchema } from "@/interface/zod";

//statements
import { getInvitationLink } from "@/db/statement";
//utils
import { invitationErrorMessage } from "@/utils/helper";
import { formatDate } from "@/utils/date";
import { zodResolver } from "@hookform/resolvers/zod";
import ApplicantTagsSelect from "@/layout/human_resources/ApplicantTagsSelect";

const InviteLink = () => {
  const [onOpen, setOnOpen] = useState(0);
  const { invitationId } = useParams<{ invitationId: string }>();
  const uniqueId = useId();
  const workExpId = useId();
  const eligibityId = useId();

  const { data, isFetching, error } = useQuery<{
    data: InvitationLinkProps;
    error: number;
    message: string;
  }>({
    queryKey: ["invitationLink", invitationId],
    queryFn: () => getInvitationLink(invitationId!, "your_token_here"),
    enabled: !!invitationId,
  });

  const form = useForm<AddUserProps>({
    resolver: zodResolver(AddUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      middleName: "",
      gender: "",
      telephoneNumber: "",
      umidNo: "",
      pagIbigNo: "",
      philHealthNo: "",
      philSys: "",
      tinNo: "",
      agencyNo: "",
      weight: "",
      height: "",
      bloodType: "",
      father: {
        surname: "",
        firstname: "",
      },
      mother: {
        surname: "",
        firstname: "",
      },
      experience: [],
      civiService: [],
      children: [],
      vocational: undefined,
      citizenship: {},
      civilStatus: "",
    },
  });

  const {
    handleSubmit,
    control,
    formState: { isSubmitting, errors },
    resetField,
  } = form;

  const handlOnSubmit = async (data: AddUserProps) => {
    console.log(data);
    toast.success("Submitted Successfully", {
      position: "top-center",
    });
  };

  const {
    fields: childrenFields,
    append: appendChild,
    remove: removeChild,
  } = useFieldArray({
    control,
    name: "children",
  });

  const {
    fields: workExperienceFields,
    append: appendWork,
    remove: removeWork,
  } = useFieldArray({
    control,
    name: "experience",
  });

  const {
    fields: tagFields,
    append: appendTag,
    remove: removeTag,
  } = useFieldArray({
    control,
    name: "tags",
  });

  const {
    fields: eligibilityFields,
    append: appendEligibility,
    remove: removeEligibility,
  } = useFieldArray({
    control,
    name: "civiService",
  });

  // Handler functions
  const handleAddEligibility = () => {
    appendEligibility({
      id: `${eligibityId}-${eligibilityFields.length}`,
      title: "",
      rating: "",
      dateExami: undefined,
      placeOfExam: "",
      licenceNumber: "",
      licenceValidity: undefined,
    });
  };

  const handleCheckTags = (tag: string) => {
    const check = tagFields.findIndex((item) => item.tag === tag);
    return { res: check !== -1, index: check };
  };

  const handleAddTag = (tag: string, cont: string) => {
    const check = handleCheckTags(tag);
    if (check.res) {
      removeTag(check.index);
      return;
    }
    appendTag({ tag, cont });
  };

  const handleAddChild = () => {
    appendChild({
      id: `${uniqueId}-${childrenFields.length}`,
      fullname: "",
      dateOfBirth: undefined,
    });
  };

  const handleAddWorkExperience = () => {
    appendWork({
      id: `${workExpId}-${workExperienceFields.length}`,
      from: "",
      to: "",
      department: "",
      position: "",
      status: "",
      govService: false,
    });
  };

  // Loading and Error States
  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
          <p className="text-gray-600 mt-4">Loading application form...</p>
        </div>
      </div>
    );
  }

  if (data?.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="flex justify-center mb-6">
            <CircleAlert size={80} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Application Error
          </h2>
          <p className="text-red-500 font-medium mb-6">
            {invitationErrorMessage[data.error]}
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-left">
            <h3 className="font-semibold text-gray-800 mb-4">
              Application Link Information
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <span className="font-medium">Code:</span> {data.data.code}
              </p>
              <p>
                <span className="font-medium">Date Created:</span>{" "}
                {formatDate(data.data.createdAt)}
              </p>
              <p>
                <span className="font-medium">Date Expiry:</span>{" "}
                {formatDate(data.data.expiresAt)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-2xl bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <CircleAlert size={48} className="text-yellow-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">
            No Invitation Found
          </h2>
          <p className="text-yellow-700">
            The requested invitation link could not be found or has expired.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <TooltipProvider>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                POSITION: IT LEAD
              </h1>
              <p className="text-gray-600 mb-4">
                Please fill out all required fields accurately and completely.
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-sm text-gray-500">
                <span>
                  Invitation ID: <strong>{data.data.id}</strong>
                </span>
                <span>
                  Expires: <strong>{formatDate(data.data.expiresAt)}</strong>
                </span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Application Form
              </h1>
              <p className="text-gray-600 mb-4">
                Please fill out all required fields accurately and completely.
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-sm text-gray-500">
                <span>
                  Invitation ID: <strong>{data.data.id}</strong>
                </span>
                <span>
                  Expires: <strong>{formatDate(data.data.expiresAt)}</strong>
                </span>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={handleSubmit(handlOnSubmit)} className="space-y-8">
              {/* Personal Information */}
              <Section title="Personal Information">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">
                          Last Name *
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="bg-white border-gray-300 focus:border-blue-500"
                            {...field}
                            placeholder="Enter your last name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">
                          First Name *
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="bg-white border-gray-300 focus:border-blue-500"
                            {...field}
                            placeholder="Enter your first name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="middleName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">
                          Middle Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="bg-white border-gray-300 focus:border-blue-500"
                            {...field}
                            placeholder="Enter your middle name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="suffix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Suffix</FormLabel>
                        <FormControl>
                          <Input
                            className="bg-white border-gray-300 focus:border-blue-500"
                            {...field}
                            placeholder="e.g., Jr., Sr., III"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <FormField
                    control={control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">
                          Gender *
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white border-gray-300">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="civilStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">
                          Civil Status *
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white border-gray-300">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="single">Single</SelectItem>
                            <SelectItem value="married">Married</SelectItem>
                            <SelectItem value="widowed">Widowed</SelectItem>
                            <SelectItem value="separated">Separated</SelectItem>
                            <SelectItem value="others">Others</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">
                          Birth Date *
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="bg-white border-gray-300 focus:border-blue-500"
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <FormField
                    control={control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">
                          Height (m)
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="bg-white border-gray-300 focus:border-blue-500"
                            type="number"
                            step="0.01"
                            {...field}
                            placeholder="Enter height"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">
                          Weight (kg)
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="bg-white border-gray-300 focus:border-blue-500"
                            type="number"
                            {...field}
                            placeholder="Enter weight"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="bloodType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">
                          Blood Type
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="bg-white border-gray-300 focus:border-blue-500"
                            {...field}
                            placeholder="e.g., A+, O-"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  <FormField
                    control={control}
                    name="umidNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">
                          UMID No.
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="bg-white border-gray-300 focus:border-blue-500"
                            {...field}
                            placeholder="Enter UMID number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="pagIbigNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">
                          PAG-IBIG No.
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="bg-white border-gray-300 focus:border-blue-500"
                            {...field}
                            placeholder="Enter PAG-IBIG number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="philHealthNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">
                          PhilHealth No.
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="bg-white border-gray-300 focus:border-blue-500"
                            {...field}
                            placeholder="Enter PhilHealth number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="philSys"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">
                          PhilSys No.
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="bg-white border-gray-300 focus:border-blue-500"
                            {...field}
                            placeholder="Enter PhilSys number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="tinNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">TIN No.</FormLabel>
                        <FormControl>
                          <Input
                            className="bg-white border-gray-300 focus:border-blue-500"
                            {...field}
                            placeholder="Enter TIN number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="agencyNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">
                          Agency No.
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="bg-white border-gray-300 focus:border-blue-500"
                            {...field}
                            placeholder="Enter agency number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Section>

              {/* Contact and Address */}
              <Section title="Contact Information">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={control}
                    name="telephoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">
                          Telephone No.
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="bg-white border-gray-300 focus:border-blue-500"
                            {...field}
                            placeholder="Telephone number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="mobileNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">
                          Mobile No. *
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="bg-white border-gray-300 focus:border-blue-500"
                            {...field}
                            placeholder="Mobile number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">
                          Email Address *
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="bg-white border-gray-300 focus:border-blue-500"
                            type="email"
                            {...field}
                            placeholder="your.email@example.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <AddressSection
                  title="Residential Address"
                  prefix="residentialAddress"
                  control={control}
                />
                <AddressSection
                  title="Permanent Address"
                  prefix="permanentAddress"
                  control={control}
                />
              </Section>

              {/* Family Background */}
              <Section title="Family Background">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={control}
                      name="spouseSurname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            Spouse Surname
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="bg-white border-gray-300 focus:border-blue-500"
                              {...field}
                              placeholder="Spouse surname"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="spouseFirstname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            Spouse First Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="bg-white border-gray-300 focus:border-blue-500"
                              {...field}
                              placeholder="Spouse first name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="spouseMiddle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            Spouse Middle Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="bg-white border-gray-300 focus:border-blue-500"
                              {...field}
                              placeholder="Spouse middle name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FamilyMemberSection
                      title="Father"
                      prefix="father"
                      control={control}
                    />
                    <FamilyMemberSection
                      title="Mother"
                      prefix="mother"
                      control={control}
                    />
                  </div>

                  <div className="border border-gray-200 rounded-lg p-6 bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-800">
                        Children
                      </h4>
                      <FormDescription>
                        Leave blank if not applicable
                      </FormDescription>
                    </div>

                    <div className="space-y-4">
                      {childrenFields.map((field, index) => (
                        <div
                          key={field.id}
                          className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <span className="font-medium text-gray-700">
                              Child {index + 1}
                            </span>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeChild(index)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={control}
                              name={`children.${index}.fullname`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-gray-700">
                                    Full Name
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="Child's full name"
                                      className="bg-white"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={control}
                              name={`children.${index}.dateOfBirth`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-gray-700">
                                    Date of Birth
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      className="bg-white"
                                      type="date"
                                      {...field}
                                      value={
                                        field.value
                                          ? field.value
                                              .toISOString()
                                              .split("T")[0]
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
                        </div>
                      ))}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full mt-4"
                      onClick={handleAddChild}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Child
                    </Button>
                  </div>
                </div>
              </Section>

              {/* Work Experience */}
              <Section title="Work Experience">
                <FormDescription className="mb-6">
                  Include all relevant work experience. Leave blank if not
                  applicable.
                </FormDescription>

                <div className="space-y-6">
                  {workExperienceFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="border border-gray-200 rounded-lg p-6 bg-white"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-800">
                          Experience {index + 1}
                        </h4>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeWork(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={control}
                          name={`experience.${index}.department`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">
                                Company/Department *
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Company or department name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name={`experience.${index}.position`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">
                                Position *
                              </FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Your position" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name={`experience.${index}.from`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">
                                From *
                              </FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Start date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name={`experience.${index}.to`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">
                                To *
                              </FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="End date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-4"
                  onClick={handleAddWorkExperience}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Work Experience
                </Button>
              </Section>

              {/* Eligibilities */}
              <Section title="Eligibilities">
                <FormDescription className="mb-6">
                  Include all relevant eligibilities (CES/CSEE/CAREER SERVICE/RE
                  1080, etc.). Leave blank if not applicable.
                </FormDescription>

                <div className="space-y-6">
                  {eligibilityFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="border border-gray-200 rounded-lg p-6 bg-white"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-800">
                          Eligibility {index + 1}
                        </h4>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeEligibility(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={control}
                          name={`civiService.${index}.title`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">
                                Eligibility Title *
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Eligibility name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name={`civiService.${index}.rating`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">
                                Rating
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Rating if applicable"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name={`civiService.${index}.dateExami`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">
                                Examination Date
                              </FormLabel>
                              <FormControl></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name={`civiService.${index}.placeOfExam`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">
                                Place of Examination
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Examination location"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-4"
                  onClick={handleAddEligibility}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Eligibility
                </Button>
              </Section>

              {/* Tags */}
              <Section title="Skills & Qualifications">
                <FormDescription className="mb-6">
                  Add relevant tags to improve your application's
                  discoverability and help HR match your skills with
                  organizational needs.
                </FormDescription>

                <div className="space-y-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOnOpen(1)}
                    className="w-full md:w-auto"
                  >
                    <Tags className="h-4 w-4 mr-2" />
                    Select Tags
                  </Button>

                  {tagFields.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {tagFields.map((item, index) => (
                        <ApplicantTaggedItem
                          key={item.id}
                          no={index}
                          item={item}
                          handleRemoveTag={removeTag}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                      <Tags className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 font-medium">
                        No tags selected
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        Click "Select Tags" to add relevant skills and
                        qualifications
                      </p>
                    </div>
                  )}
                </div>
              </Section>

              {/* Form Actions */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => resetField("telephoneNumber")}
                    className="w-full sm:w-auto"
                  >
                    Clear Form
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setOnOpen(2)}
                    className="w-full sm:w-auto"
                    size="lg"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit Application
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </TooltipProvider>

      {/* Modals */}
      <Modal
        title="Select Tags"
        children={
          <ApplicantTagsSelect
            handleCheckTags={handleCheckTags}
            handleAddTags={handleAddTag}
          />
        }
        onOpen={onOpen === 1}
        className="min-w-[90%] lg:min-w-4xl max-h-[90vh]"
        setOnOpen={() => setOnOpen(0)}
        cancelTitle="Close"
      />

      <Modal
        className=""
        title="Submit Application"
        children={
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to submit your application?
            </p>
            <p className="text-sm text-gray-600">
              Please review all information carefully before submitting. You
              won't be able to make changes after submission.
            </p>
          </div>
        }
        onOpen={onOpen === 2}
        setOnOpen={() => setOnOpen(0)}
        cancelTitle="Review Again"
        onFunction={handleSubmit(handlOnSubmit)}
        footer={true}
        loading={isSubmitting}
      />
    </div>
  );
};

// Helper Components
const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
      {title}
    </h2>
    {children}
  </div>
);

const AddressSection = ({
  title,
  prefix,
  control,
}: {
  title: string;
  prefix: string;
  control: any;
}) => (
  <div className="mt-6">
    <h4 className="text-lg font-semibold text-gray-800 mb-4">{title}</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={control}
        name={`${prefix}.blockno`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-700">House/Block/Lot No.</FormLabel>
            <FormControl>
              <Input
                className="bg-white border-gray-300 focus:border-blue-500"
                {...field}
                placeholder="House/block/lot number"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`${prefix}.street`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-700">Street</FormLabel>
            <FormControl>
              <Input
                className="bg-white border-gray-300 focus:border-blue-500"
                {...field}
                placeholder="Street name"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`${prefix}.subVillage`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-700">Subdivision/Village</FormLabel>
            <FormControl>
              <Input
                className="bg-white border-gray-300 focus:border-blue-500"
                {...field}
                placeholder="Subdivision or village"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`${prefix}.barangay`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-700">Barangay *</FormLabel>
            <FormControl>
              <Input
                className="bg-white border-gray-300 focus:border-blue-500"
                {...field}
                placeholder="Barangay"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`${prefix}.cityMunicipality`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-700">City/Municipality *</FormLabel>
            <FormControl>
              <Input
                className="bg-white border-gray-300 focus:border-blue-500"
                {...field}
                placeholder="City or municipality"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`${prefix}.province`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-700">Province *</FormLabel>
            <FormControl>
              <Input
                className="bg-white border-gray-300 focus:border-blue-500"
                {...field}
                placeholder="Province"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`${prefix}.zipCode`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-700">Zip Code *</FormLabel>
            <FormControl>
              <Input
                className="bg-white border-gray-300 focus:border-blue-500"
                {...field}
                placeholder="Zip code"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  </div>
);

const FamilyMemberSection = ({
  title,
  prefix,
  control,
}: {
  title: string;
  prefix: string;
  control: any;
}) => (
  <div>
    <h4 className="text-lg font-semibold text-gray-800 mb-4">{title}</h4>
    <div className="space-y-4">
      <FormField
        control={control}
        name={`${prefix}.surname`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-700">Surname *</FormLabel>
            <FormControl>
              <Input
                className="bg-white border-gray-300 focus:border-blue-500"
                {...field}
                placeholder={`${title}'s surname`}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`${prefix}.firstname`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-700">First Name *</FormLabel>
            <FormControl>
              <Input
                className="bg-white border-gray-300 focus:border-blue-500"
                {...field}
                placeholder={`${title}'s first name`}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`${prefix}.middle`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-700">Middle Name</FormLabel>
            <FormControl>
              <Input
                className="bg-white border-gray-300 focus:border-blue-500"
                {...field}
                placeholder={`${title}'s middle name`}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`${prefix}.suffix`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-700">Suffix</FormLabel>
            <FormControl>
              <Input
                className="bg-white border-gray-300 focus:border-blue-500"
                {...field}
                placeholder="Suffix if applicable"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  </div>
);

export default InviteLink;
