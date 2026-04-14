import { useForm } from "react-hook-form";
import { useState } from "react";
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
import PsgcRegion from "../PsgcRegion";
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
  Link as LinkIcon,
  Copy,
  Check,
} from "lucide-react";
//
import { copyToClipboard } from "@/utils/clipboard";
//
import { NewLineFormSchema } from "@/interface/zod";
import type { NewLineFormProps } from "@/interface/data";
import { Button } from "@/components/ui/button";
import Modal from "@/components/custom/Modal";

interface Props {
  setOpen: React.Dispatch<React.SetStateAction<number>>;
  onOpen: number;
}

const NewLineForm = ({ setOpen, onOpen }: Props) => {
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
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
    reset,
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
      console.log("respinse: ", { result: response.data });

      setLink(response.data.link);
      reset();
      setOpen(2);
    } catch (error) {
      // console.log(error);
      toast.error("FAILED TO SUBMIT", {
        description: `${error}`,
      });
    }
  };

  return (
    <div className="w-full h-full">
      <Card className="max-w-2xl mx-auto border shadow-lg">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">
                Create New Line
              </CardTitle>
              <CardDescription className="text-xs">
                Define a new geographical line for your organization
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          <Form {...form}>
            <div className="space-y-5">
              {/* Line Information Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-blue-100">
                    <Tag className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Line Information
                  </h3>
                </div>

                <FormField
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                        <Building2 className="w-3 h-3" />
                        Line Label
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="e.g., Main Office, Branch Location"
                            {...field}
                            className="pl-8 h-9 text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          />
                          <Building2 className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        Enter a descriptive name for this line/office
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="defaultUserEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                        <Mail className="w-3 h-3" />
                        Default User Email
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="email"
                            placeholder="e.g., manager@example.com"
                            {...field}
                            className="pl-8 h-9 text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          />
                          <Mail className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        Email address for the default line user/manager
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Location Details Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-blue-100">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Location Details
                  </h3>
                </div>

                <div className="text-xs text-gray-600 p-2.5 bg-blue-50 rounded-md border border-blue-100">
                  <p className="font-medium text-blue-800 mb-0.5">Note:</p>
                  <p className="text-xs">
                    Select locations in hierarchical order: Region → Province →
                    Municipal → Barangay
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    control={control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                          <Globe className="w-3 h-3" />
                          Region
                        </FormLabel>
                        <FormControl>
                          <PsgcRegion
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
                    name="province"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
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
                            Select region first
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="municipal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
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
                            Select province first
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="barangay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
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
                            Select municipality first
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
                watch("barangay") ||
                watch("name") ||
                watch("defaultUserEmail")) && (
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <h4 className="font-medium text-gray-800 text-xs mb-2">
                    Location Preview
                  </h4>
                  <div className="text-xs text-gray-600 space-y-1">
                    {watch("barangay") && (
                      <p>
                        Barangay:{" "}
                        <span className="font-medium text-gray-800">
                          {watch("barangay")}
                        </span>
                      </p>
                    )}
                    {municipal && (
                      <p>
                        Municipality:{" "}
                        <span className="font-medium text-gray-800">
                          {municipal}
                        </span>
                      </p>
                    )}
                    {provinceId && (
                      <p>
                        Province:{" "}
                        <span className="font-medium text-gray-800">
                          {provinceId}
                        </span>
                      </p>
                    )}
                    {regionId && (
                      <p>
                        Region:{" "}
                        <span className="font-medium text-gray-800">
                          {regionId}
                        </span>
                      </p>
                    )}
                    {watch("name") && (
                      <p className="text-blue-700 font-medium text-xs">
                        Line: {watch("name")}
                      </p>
                    )}
                    {watch("defaultUserEmail") && (
                      <p className="text-blue-700 font-medium text-xs">
                        Email: {watch("defaultUserEmail")}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Form>
        </CardContent>

        <CardFooter className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setOpen(0)}
            disabled={isSubmitting}
            className="h-9 text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="h-9 text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            {isSubmitting ? "Creating..." : "Create Line"}
          </Button>
        </CardFooter>
      </Card>

      {/* Success Modal with Copy Link */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-green-100">
              <Check className="h-4 w-4 text-green-600" />
            </div>
            <span className="text-base font-semibold text-gray-900">
              Line Created Successfully
            </span>
          </div>
        }
        children={
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Your new line has been created. Share this invitation link with
              users:
            </p>

            {/* Copy Link Card */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="p-1.5 rounded-md bg-blue-100 flex-shrink-0">
                <LinkIcon className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-gray-700 truncate">
                  {link}
                </p>
              </div>
              <Button
                size="sm"
                onClick={async () => await copyToClipboard(link, setCopied)}
                variant={copied ? "default" : "outline"}
                className={`gap-1.5 h-8 px-3 text-xs ${
                  copied
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "hover:bg-blue-50 hover:text-blue-700"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>

            <div className="rounded-md bg-blue-50 p-3 border border-blue-100">
              <p className="text-xs text-blue-700">
                Users can use this link to register and join your line. The link
                expires in 7 days.
              </p>
            </div>
          </div>
        }
        onOpen={onOpen === 2}
        className="max-w-md"
        setOnOpen={() => {
          setLink("");
          setOpen(0);
        }}
        footer={false}
      />
    </div>
  );
};

export default NewLineForm;
