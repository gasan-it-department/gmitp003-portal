import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAdminAuth } from "@/provider/AdminRouter";
import axios from "@/db/axios";
import { useQueryClient } from "@tanstack/react-query";
//
import {
  Form,
  FormControl,
  FormMessage,
  FormItem,
  FormLabel,
  FormDescription,
  FormField,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import PublicRegionSelect from "../PublicRegionSelect";
import PublicProvinceSelect from "../PublicProvinceSelect";
import PublicMunicipalSelect from "../PublicMunicipalSelect";
import PublicBarangaySelect from "../PublicBarangaySelect";
import { toast } from "sonner";
//icons
import {
  Building2,
  MapPin,
  Navigation,
  Globe,
  Home,
  Tag,
  Mail,
} from "lucide-react";
//
import { NewLineFormSchema } from "@/interface/zod";
import type { NewLineFormProps } from "@/interface/data";
import { Button } from "@/components/ui/button";

interface Props {
  setOpen: React.Dispatch<React.SetStateAction<number>>;
}

const NewLineForm = ({ setOpen }: Props) => {
  const auth = useAdminAuth();
  const queryClient = useQueryClient();

  const form = useForm<NewLineFormProps>({
    resolver: zodResolver(NewLineFormSchema),
    defaultValues: {
      barangay: "",
      municipal: "",
      province: "",
      region: "",
      name: "",
      defaultUserEmail: "",
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    control,
    watch,
  } = form;

  const regionId = watch("region");
  const provinceId = watch("province");
  const municipal = watch("municipal");

  const onSubmit = async (data: NewLineFormProps) => {
    if (!auth) return toast.warning("INVALID REQUIRED ID");
    try {
      const response = await axios.post(
        "/create-line",
        {
          name: data.name,
          barangayId: data.barangay,
          municipalId: data.municipal,
          provinceId: data.province,
          regionId: data.region,
          email: data.defaultUserEmail,
        },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
        },
      );

      if (response.status !== 200) {
        throw new Error(response.data.message);
      }
      await queryClient.invalidateQueries({
        queryKey: ["line-list"],
        refetchType: "active",
      });
      setOpen(0);
    } catch (error) {
      console.log(error);

      toast.error("FAILED TO SUBMIT", {
        description: `${error}`,
      });
    }
  };

  return (
    <div className="w-full h-full p-4">
      <Card className="max-w-2xl mx-auto border shadow-sm">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Create New Line
              </CardTitle>
              <CardDescription>
                Define a new geographical line for your organization
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <Separator className="mb-6" />

        <CardContent>
          <Form {...form}>
            <div className="space-y-6">
              {/* Line Name Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-600" />
                  <h3 className="font-medium text-gray-900">
                    Line Information
                  </h3>
                </div>

                <FormField
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm font-medium">
                        <Building2 className="w-3 h-3" />
                        Line Label
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="e.g., Main Office, Branch Location, Regional Hub"
                            {...field}
                            className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        Enter a descriptive name for this line/office
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email Field - Added here */}
                <FormField
                  control={control}
                  name="defaultUserEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm font-medium">
                        <Mail className="w-3 h-3" />
                        Default User Email
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="email"
                            placeholder="e.g., manager@example.com"
                            {...field}
                            className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        Email address for the default line user/manager
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Geographical Hierarchy */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <h3 className="font-medium text-gray-900">
                    Location Details
                  </h3>
                </div>

                <div className="text-xs text-gray-500 mb-4 p-3 bg-blue-50 rounded border border-blue-100">
                  <p className="font-medium text-blue-800 mb-1">Note:</p>
                  <p>
                    Select locations in hierarchical order: Region → Province →
                    Municipal → Barangay
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Region Field */}
                  <FormField
                    control={control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-sm font-medium">
                          <Globe className="w-3 h-3" />
                          Region
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <PublicRegionSelect
                              onChange={field.onChange}
                              value={field.value}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Province Field */}
                  <FormField
                    control={control}
                    name="province"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-sm font-medium">
                          <MapPin className="w-3 h-3" />
                          Province
                        </FormLabel>
                        <FormControl>
                          <PublicProvinceSelect
                            onChange={field.onChange}
                            regionId={regionId}
                            value={field.value}
                          />
                        </FormControl>
                        {!regionId && (
                          <FormDescription className="text-xs text-amber-600">
                            Please select a region first
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Municipal Field */}
                  <FormField
                    control={control}
                    name="municipal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-sm font-medium">
                          <Navigation className="w-3 h-3" />
                          Municipality
                        </FormLabel>
                        <FormControl>
                          <PublicMunicipalSelect
                            provinceId={provinceId}
                            onChange={field.onChange}
                            value={field.value}
                          />
                        </FormControl>
                        {!provinceId && (
                          <FormDescription className="text-xs text-amber-600">
                            Please select a province first
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Barangay Field */}
                  <FormField
                    control={control}
                    name="barangay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-sm font-medium">
                          <Home className="w-3 h-3" />
                          Barangay
                        </FormLabel>
                        <FormControl>
                          <PublicBarangaySelect
                            municipalityId={municipal}
                            onChange={field.onChange}
                            value={field.value}
                          />
                        </FormControl>
                        {!municipal && (
                          <FormDescription className="text-xs text-amber-600">
                            Please select a municipality first
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Location Preview */}
              {(regionId ||
                provinceId ||
                municipal ||
                form.watch("barangay")) && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 text-sm mb-2">
                    Location Preview
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    {form.watch("barangay") && (
                      <p>
                        Barangay:{" "}
                        <span className="font-medium">
                          {form.watch("barangay")}
                        </span>
                      </p>
                    )}
                    {municipal && (
                      <p>
                        Municipality:{" "}
                        <span className="font-medium">{municipal}</span>
                      </p>
                    )}
                    {provinceId && (
                      <p>
                        Province:{" "}
                        <span className="font-medium">{provinceId}</span>
                      </p>
                    )}
                    {regionId && (
                      <p>
                        Region: <span className="font-medium">{regionId}</span>
                      </p>
                    )}
                    {form.watch("name") && (
                      <p className="text-blue-700 font-medium">
                        Line: {form.watch("name")}
                      </p>
                    )}
                    {form.watch("defaultUserEmail") && (
                      <p className="text-blue-700 font-medium">
                        Default Email: {form.watch("defaultUserEmail")}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Form>
        </CardContent>
        <CardFooter className=" w-full flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(0)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            Confirm
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default NewLineForm;
