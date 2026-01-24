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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ApplicantTaggedItem from "@/layout/human_resources/item/ApplicantTaggedItem";
import { TooltipProvider } from "@/components/ui/tooltip";
import PublicRegionSelect from "@/layout/PublicRegionSelect";
import PublicProvinceSelect from "@/layout/PublicProvinceSelect";
import PublicMunicipalSelect from "@/layout/PublicMunicipalSelect";
import PublicBarangaySelect from "@/layout/PublicBarangaySelect";
import { toast } from "sonner";
//icons
import { CircleAlert, Plus, Send, Tags, Trash } from "lucide-react";
//
import type { JobPostProps, AddUserProps } from "@/interface/data";
import { AddUserSchema } from "@/interface/zod";

//statements
import { publicJobPost } from "@/db/statement";
import { frontendUrl } from "@/db/axios";
//utils
import { fileSizeConverter } from "@/utils/helper";
import { zodResolver } from "@hookform/resolvers/zod";
import ApplicantTagsSelect from "@/layout/human_resources/ApplicantTagsSelect";
import { Textarea } from "@/components/ui/textarea";
import axios from "@/db/axios";

const ApplicationForm = () => {
  const [onOpen, setOnOpen] = useState(0);
  const [applicationId, setApplicationId] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState<{
    [key: string]: boolean;
  }>({});
  const { jobPostId, municipalId } = useParams<{
    jobPostId: string | undefined;
    municipalId: string | undefined;
  }>();
  const uniqueId = useId();
  const workExpId = useId();
  const eligibityId = useId();

  const { data, isFetching, error } = useQuery<JobPostProps>({
    queryKey: ["jobPost", jobPostId],
    queryFn: () => publicJobPost(jobPostId as string),
    enabled: !!jobPostId,
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
      vocational: {
        from: "",
        to: "",
        name: "",
        highestAttained: "",
        yearGraduate: "",
        records: "",
      },
      citizenship: {
        by: "byBirth",
        country: "",
        citizenship: "filipino",
      },
      civilStatus: "",
      elementary: {
        from: "",
        to: "",
        name: "",
        highestAttained: "",
        yearGraduate: "",
        records: "",
        course: "",
      },
      secondary: {
        from: "",
        to: "",
        name: "",
        highestAttained: "",
        yearGraduate: "",
        records: "",
        course: "",
      },
      college: {
        from: "",
        to: "",
        name: "",
        highestAttained: "",
        yearGraduate: "",
        records: "",
        course: "",
      },
      graduateCollege: {
        from: "",
        to: "",
        name: "",
        highestAttained: "",
        yearGraduate: "",
        records: "",
        course: "",
      },
      assets: [],
      profilePicture: undefined,
    },
  });

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
    resetField,
    watch,
    setValue,
  } = form;

  const permanentRegionId = watch("permanentAddress.regionCode");
  const permanentProvinceId = watch("permanentAddress.province");
  const permanentMunicipalityCityId = watch(
    "permanentAddress.cityMunicipality",
  );
  const citizenship = watch("citizenship.citizenship");

  const residentialRegionId = watch("residentialAddress.regionCode");
  const residentialProvinceId = watch("residentialAddress.province");
  const residentialMunicipalityCityId = watch(
    "residentialAddress.cityMunicipality",
  );

  const handleOnSubmit = async (formInput: AddUserProps) => {
    const formData = new FormData();

    if (!jobPostId) {
      return toast.warning("INVALID REQUIRED ID");
    }
    if (!municipalId) {
      return toast.warning("INVALID REQUIRED ID");
    }

    if (!data) {
      return toast.warning("INVALID REQUIRED DATA");
    }

    if (formInput.assets && formInput.assets.length > 0) {
      formInput.assets.forEach((item, index) => {
        formData.append("files", item.file);
        formData.append(`fileTitles[${index}]`, item.title);
      });
    }
    formData.append("jobPostId", jobPostId);
    formData.append("municipalId", municipalId);
    formData.append("positionId", data.positionId);
    formData.append("profilePicture", formInput.profilePicture!);

    Object.entries(formInput).forEach(([key, value]) => {
      if (key === "assets") return;

      if (value instanceof Date) {
        formData.append(key, value.toISOString());
      } else if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (typeof value === "object" && value !== null) {
        Object.entries(value).forEach(([nestedKey, nestedValue]) => {
          if (nestedValue instanceof Date) {
            formData.append(`${key}[${nestedKey}]`, nestedValue.toISOString());
          } else {
            formData.append(`${key}[${nestedKey}]`, String(nestedValue));
          }
        });
      } else {
        formData.append(key, String(value));
      }
    });

    try {
      const response = await axios.post("/application/submission", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data) {
        setOnOpen(3);
        setApplicationId(response.data.applicationId);
      }

      toast.success("Submitted Successfully", {
        position: "top-center",
      });

      return response.data;
    } catch (error) {
      toast.error("Submission failed. Please try again.", {
        position: "top-center",
      });
      throw error;
    }
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

  const assets = useFieldArray({
    control,
    name: "assets",
  });

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds 10MB limit`);
        continue;
      }

      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File "${file.name}" has unsupported format`);
        continue;
      }
      setUploadingFiles((prev) => ({ ...prev, [file.name]: true }));

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        assets.append({
          file: file, // This matches z.file() in your schema
          title: file.name, // This matches z.string() in your schema
        });

        toast.success(`File "${file.name}" uploaded successfully`);
      } catch (error) {
        toast.error(`Failed to upload "${file.name}"`);
      } finally {
        setUploadingFiles((prev) => ({ ...prev, [file.name]: false }));
      }
    }

    event.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    assets.remove(index);
  };

  const handleProfilePictureUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Basic validation
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Picture must be less than 5MB");
      return;
    }

    if (!file.type.includes("image")) {
      toast.error("Please select an image file");
      return;
    }

    setValue("profilePicture", file);
    toast.success("Profile picture uploaded");

    event.target.value = "";
  };

  const handleDownloadFile = (file: any) => {
    const url = URL.createObjectURL(file.file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up
  };

  const handlePreviewFile = (file: any) => {
    const url = URL.createObjectURL(file.file);

    if (file.file.type.includes("image")) {
      window.open(url, "_blank");
    } else if (file.file.type === "application/pdf") {
      window.open(url, "_blank");
    } else {
      handleDownloadFile(file);
    }

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

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

  if (!data) {
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Application Form
              </h1>
              <h1 className="text-xl font-bold text-gray-900 mb-2 mt-10">
                APPLYING FOR: {data.position.name}
              </h1>
              <p className="text-gray-600 mb-4">
                Please fill out all required fields.
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-sm text-gray-500">
                <span>
                  {/* Invitation ID: <strong>{data.data.id}</strong> */}
                </span>
                {/* <span>
                  Expires: <strong>{formatDate(data.data.expiresAt)}</strong>
                </span> */}
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={handleSubmit(handleOnSubmit)} className="space-y-8">
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
                                  : undefined,
                              );
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className=" w-full grid mt-4">
                  <FormLabel>Citizenship</FormLabel>
                  <FormField
                    control={control}
                    name="citizenship.citizenship"
                    render={({ field }) => (
                      <FormItem className="space-y-3 mt-4">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="filipino" id="filipino" />
                              <FormLabel
                                htmlFor="filipino"
                                className="font-normal cursor-pointer"
                              >
                                Filipino
                              </FormLabel>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="dual" id="dual" />
                              <FormLabel
                                htmlFor="dual"
                                className="font-normal cursor-pointer"
                              >
                                Dual Citizenship
                              </FormLabel>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {citizenship !== "filipino" && (
                    <>
                      <FormField
                        control={control}
                        name="citizenship.by"
                        render={({ field }) => (
                          <FormItem className=" w-auto flex items-center mt-2">
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex space-x-4"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem
                                    value="byBirth"
                                    id="byBirth"
                                  />
                                  <FormLabel
                                    htmlFor="byBirth"
                                    className="font-normal cursor-pointer"
                                  >
                                    by Birth
                                  </FormLabel>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem
                                    value=" byNaturalization"
                                    id="byNaturalization"
                                  />
                                  <FormLabel
                                    htmlFor="dual"
                                    className="font-normal cursor-pointer"
                                  >
                                    by Naturalization
                                  </FormLabel>
                                </div>
                              </RadioGroup>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name="citizenship.country"
                        render={({ field }) => (
                          <FormItem className=" mt-4">
                            <FormControl>
                              <Input
                                className=" w-full lg:w-1/4"
                                placeholder="Enter country"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              If holder of dual citizenship, please indicate the
                              details.
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </>
                  )}
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
                  regionId={residentialRegionId}
                  provinceId={residentialProvinceId}
                  municipalityId={residentialMunicipalityCityId}
                />
                <AddressSection
                  title="Permanent Address"
                  prefix="permanentAddress"
                  control={control}
                  regionId={permanentRegionId}
                  provinceId={permanentProvinceId}
                  municipalityId={permanentMunicipalityCityId}
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
                      title="Mother's Maiden Name"
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
                                            : undefined,
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

              {/* Educational Background */}
              <Section title="Educational Background">
                <FormDescription className="mb-6">
                  Please provide your educational history. Leave blank if not
                  applicable.
                </FormDescription>

                {/* Elementary */}
                <div className="border border-gray-200 rounded-lg p-6 bg-white mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    Elementary
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <FormField
                      control={control}
                      name="elementary.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            School Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="bg-white border-gray-300 focus:border-blue-500"
                              placeholder="Enter school name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="elementary.course"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            Course and Major
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="bg-white border-gray-300 focus:border-blue-500"
                              placeholder="Enter course and major"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="elementary.from"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">From</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="bg-white border-gray-300 focus:border-blue-500"
                              placeholder="Enter start year"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="elementary.to"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">To</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="bg-white border-gray-300 focus:border-blue-500"
                              placeholder="Enter end year"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="elementary.highestAttained"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            Highest Attained
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="bg-white border-gray-300 focus:border-blue-500"
                              placeholder="Enter highest level attained"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="elementary.yearGraduate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            Year Graduated
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="bg-white border-gray-300 focus:border-blue-500"
                              placeholder="Enter graduation year"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="elementary.records"
                      render={({ field }) => (
                        <FormItem className="lg:col-span-2">
                          <FormLabel className="text-gray-700">
                            Records
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              className="bg-white border-gray-300 focus:border-blue-500 min-h-[80px]"
                              placeholder="Enter academic records"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Secondary */}
                <div className="border border-gray-200 rounded-lg p-6 bg-white mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    Secondary
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <FormField
                      control={control}
                      name="secondary.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            School Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="bg-white border-gray-300 focus:border-blue-500"
                              placeholder="Enter school name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="secondary.course"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            Course and Major
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="bg-white border-gray-300 focus:border-blue-500"
                              placeholder="Enter course and major"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="secondary.from"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">From</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="bg-white border-gray-300 focus:border-blue-500"
                              placeholder="Enter start year"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="secondary.to"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">To</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="bg-white border-gray-300 focus:border-blue-500"
                              placeholder="Enter end year"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="secondary.highestAttained"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            Highest Attained
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="bg-white border-gray-300 focus:border-blue-500"
                              placeholder="Enter highest level attained"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="secondary.yearGraduate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            Year Graduated
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="bg-white border-gray-300 focus:border-blue-500"
                              placeholder="Enter graduation year"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="secondary.records"
                      render={({ field }) => (
                        <FormItem className="lg:col-span-2">
                          <FormLabel className="text-gray-700">
                            Records
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              className="bg-white border-gray-300 focus:border-blue-500 min-h-[80px]"
                              placeholder="Enter academic records"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Vocational */}
                <div className="border border-gray-200 rounded-lg p-6 bg-white mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    Vocational
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <FormField
                      control={control}
                      name="vocational.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            School Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="bg-white border-gray-300 focus:border-blue-500"
                              placeholder="Enter school name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="vocational.course"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            Course and Major
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="bg-white border-gray-300 focus:border-blue-500"
                              placeholder="Enter course and major"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="vocational.from"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">From</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="bg-white border-gray-300 focus:border-blue-500"
                              placeholder="Enter start year"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="vocational.to"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">To</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="bg-white border-gray-300 focus:border-blue-500"
                              placeholder="Enter end year"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="vocational.highestAttained"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            Highest Attained
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="bg-white border-gray-300 focus:border-blue-500"
                              placeholder="Enter highest level attained"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="vocational.yearGraduate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            Year Graduated
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="bg-white border-gray-300 focus:border-blue-500"
                              placeholder="Enter graduation year"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="vocational.records"
                      render={({ field }) => (
                        <FormItem className="lg:col-span-2">
                          <FormLabel className="text-gray-700">
                            Records
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              className="bg-white border-gray-300 focus:border-blue-500 min-h-[80px]"
                              placeholder="Enter academic records"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* College */}
                <div className="border border-gray-200 rounded-lg p-6 bg-white mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    College
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <FormField
                      control={control}
                      name="college.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            School Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="bg-white border-gray-300 focus:border-blue-500"
                              placeholder="Enter school name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="college.course"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            Course and Major
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="bg-white border-gray-300 focus:border-blue-500"
                              placeholder="Enter course and major"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="college.from"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">From</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="bg-white border-gray-300 focus:border-blue-500"
                              placeholder="Enter start date"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="college.to"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">To</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="bg-white border-gray-300 focus:border-blue-500"
                              placeholder="Enter end date"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="college.highestAttained"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            Highest Attained
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="bg-white border-gray-300 focus:border-blue-500"
                              placeholder="Enter highest level attained"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="college.yearGraduate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            Year Graduated
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="bg-white border-gray-300 focus:border-blue-500"
                              placeholder="Enter graduation year"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="college.records"
                      render={({ field }) => (
                        <FormItem className="lg:col-span-2">
                          <FormLabel className="text-gray-700">
                            Records
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              className="bg-white border-gray-300 focus:border-blue-500 min-h-[80px]"
                              placeholder="Enter academic records"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Graduate Studies */}
                <div className="border border-gray-200 rounded-lg p-6 bg-white">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    Graduate Studies
                  </h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <FormField
                      control={control}
                      name="graduateCollege.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            School Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="bg-white border-gray-300 focus:border-blue-500"
                              placeholder="Enter school name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="graduateCollege.course"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            Course and Major
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="bg-white border-gray-300 focus:border-blue-500"
                              placeholder="Enter course and major"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="graduateCollege.from"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">From</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="bg-white border-gray-300 focus:border-blue-500"
                              placeholder="Enter start date"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="graduateCollege.to"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">To</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="bg-white border-gray-300 focus:border-blue-500"
                              placeholder="Enter end date"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="graduateCollege.highestAttained"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            Highest Attained
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="bg-white border-gray-300 focus:border-blue-500"
                              placeholder="Enter highest level attained"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="graduateCollege.yearGraduate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">
                            Year Graduated
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="bg-white border-gray-300 focus:border-blue-500"
                              placeholder="Enter graduation year"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="graduateCollege.records"
                      render={({ field }) => (
                        <FormItem className="lg:col-span-2">
                          <FormLabel className="text-gray-700">
                            Records
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              className="bg-white border-gray-300 focus:border-blue-500 min-h-[80px]"
                              placeholder="Enter academic records"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                                <Input
                                  {...field}
                                  placeholder="Start "
                                  type="date"
                                />
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
                                <Input
                                  {...field}
                                  placeholder="End date"
                                  type="date"
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
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
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

              {/* Attach Picture */}
              {/* Profile Picture Section */}
              <Section title="Profile Picture">
                <FormDescription className="mb-4">
                  Upload a recent photo of yourself. This will be used for
                  identification purposes.
                </FormDescription>

                <div className="flex flex-col items-center space-y-4">
                  {/* Profile Picture Preview */}
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-full overflow-hidden bg-gray-50">
                    {watch("profilePicture") ? (
                      <img
                        src={URL.createObjectURL(watch("profilePicture")!)}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Upload Button */}
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        document
                          .getElementById("profile-picture-upload")
                          ?.click()
                      }
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {watch("profilePicture")
                        ? "Change Picture"
                        : "Upload Picture"}
                    </Button>

                    {watch("profilePicture") && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-2 text-red-600 hover:text-red-800"
                        onClick={() => setValue("profilePicture", undefined)}
                      >
                        Remove
                      </Button>
                    )}

                    <input
                      id="profile-picture-upload"
                      type="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png"
                      onChange={(e) => handleProfilePictureUpload(e)}
                    />
                  </div>

                  {/* File Requirements */}
                  <p className="text-sm text-gray-500 text-center">
                    JPG or PNG, max 5MB
                  </p>
                </div>
              </Section>
              {/* Attach Relevant Files */}
              <Section title="Attach Relevant Files">
                <FormDescription className="mb-6">
                  Upload required documents and supporting files. Maximum file
                  size: 10MB per file. Accepted formats: PDF, JPG, PNG, DOC,
                  DOCX.
                </FormDescription>
                <FormDescription>
                  Please name the files appropriately (e.g.,
                  "Resume_JohnDoe.pdf", "Certificate_TrainingName.jpg") to help
                  us identify them easily.
                </FormDescription>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 hover:bg-gray-100 transition-colors">
                  {/* File Drop Zone */}
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">
                      Upload Files
                    </h4>
                    <p className="text-gray-500 mb-4">
                      Drag and drop files here or click to browse
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="bg-white border-blue-300 text-blue-600 hover:bg-blue-50"
                      onClick={() =>
                        document.getElementById("file-upload")?.click()
                      }
                      disabled={Object.values(uploadingFiles).some(
                        (status) => status,
                      )}
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      {Object.values(uploadingFiles).some((status) => status)
                        ? "Uploading..."
                        : "Select Files"}
                    </Button>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                  </div>
                </div>

                {/* Uploaded Files List */}
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    Attached Files
                  </h4>

                  {assets.fields.length > 0 ? (
                    <div className="space-y-3">
                      {assets.fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            {/* File Icon */}
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              {field.file?.type?.includes("image") ? (
                                <svg
                                  className="w-5 h-5 text-blue-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              ) : field.file?.type === "application/pdf" ? (
                                <svg
                                  className="w-5 h-5 text-red-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="w-5 h-5 text-blue-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                              )}
                            </div>

                            {/* File Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {field.title ||
                                  field.file?.name ||
                                  `File ${index + 1}`}
                              </p>
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <span>
                                  {field.file
                                    ? fileSizeConverter(field.file.size)
                                    : "Unknown size"}
                                </span>
                                <span>•</span>
                                <span>
                                  {field.file?.type
                                    ?.split("/")[1]
                                    ?.toUpperCase() || "FILE"}
                                </span>
                              </div>
                            </div>

                            {/* Upload Status */}
                            {field.file?.name &&
                              uploadingFiles[field.file.name] && (
                                <div className="flex items-center space-x-2">
                                  <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                                  <span className="text-xs text-blue-600">
                                    Uploading...
                                  </span>
                                </div>
                              )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2 ml-4">
                            {/* Preview Button */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              onClick={() => handlePreviewFile(field)}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </Button>

                            {/* Download Button */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-800 hover:bg-green-50"
                              onClick={() => handleDownloadFile(field)}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                              </svg>
                            </Button>

                            {/* Remove Button */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              onClick={() => handleRemoveFile(index)}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Empty State */
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                      <svg
                        className="mx-auto w-12 h-12 text-gray-400 mb-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                        />
                      </svg>
                      <p className="text-gray-500">No files attached yet</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Upload your documents to get started
                      </p>
                    </div>
                  )}

                  {/* File Requirements */}
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h5 className="text-sm font-semibold text-blue-800 mb-2">
                      Documents you can attach
                    </h5>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Resume/CV (PDF, DOC, DOCX)
                      </li>
                      <li className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Valid ID (JPG, PNG, PDF)
                      </li>
                      <li className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Transcript of Records (PDF)
                      </li>
                      <li className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Diploma/Certificates (PDF, JPG, PNG)
                      </li>
                      <li className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Cover letter
                      </li>
                    </ul>
                  </div>
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
        className="max-w-md"
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

            {/* Data Security Message */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <p className="text-xs text-blue-700">
                  <strong>Your data is secure:</strong> All information you've
                  provided will be encrypted and stored safely in accordance
                  with data protection regulations.
                </p>
              </div>
            </div>
          </div>
        }
        onOpen={onOpen === 2}
        setOnOpen={() => setOnOpen(0)}
        cancelTitle="Review Again"
        onFunction={handleSubmit(handleOnSubmit)}
        footer={true}
        loading={isSubmitting}
      />

      <Modal
        title={
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Application Submitted Successfully!
          </div>
        }
        children={
          <div className="space-y-4 text-center">
            {/* Success Icon */}
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            {/* Message */}
            <div className="space-y-3">
              <p className="text-gray-700 leading-relaxed">
                You can track your application progress using the link below or
                check your email for updates.
              </p>
              <p className="text-gray-600 font-medium">
                Thank you for your application!
              </p>
            </div>

            {/* Application Link */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-800 mb-2">
                Your Application Link:
              </p>
              <div className="flex items-center justify-between bg-white border border-blue-300 rounded px-3 py-2">
                <code className="text-sm text-blue-600 truncate">
                  `${frontendUrl}public/application/${applicationId}`
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${frontendUrl}/public/application/${applicationId}`,
                    );
                    toast.success("Link copied to clipboard!");
                  }}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </Button>
              </div>
            </div>

            {/* Additional Info */}
            <div className="text-xs text-gray-500">
              We've also sent a confirmation email with these details.
            </div>
          </div>
        }
        onOpen={onOpen === 3}
        className="max-w-md"
        cancelTitle="Close"
        setOnOpen={() => {
          setOnOpen(0);
          setApplicationId("");
          //nav(-1);
        }}
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
  regionId,
  provinceId,
  municipalityId,
}: {
  title: string;
  prefix: string;
  control: any;
  regionId: string;
  provinceId: string;
  municipalityId: string;
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
        name={`${prefix}.regionCode`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-700">Region *</FormLabel>
            <FormControl>
              <PublicRegionSelect
                onChange={field.onChange}
                value={field.value}
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
              <PublicProvinceSelect
                onChange={field.onChange}
                regionId={regionId}
                value={field.value}
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
              <PublicMunicipalSelect
                provinceId={provinceId}
                onChange={field.onChange}
                value={field.value}
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
              <PublicBarangaySelect
                municipalityId={municipalityId}
                onChange={field.onChange}
                value={field.value}
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

export default ApplicationForm;
