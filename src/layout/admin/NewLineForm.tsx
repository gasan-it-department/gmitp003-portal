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
  Loader2,
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

      setLink(response.data.link);
      reset();
      setOpen(2);
    } catch (error) {
      toast.error("FAILED TO SUBMIT", { description: `${error}` });
    }
  };

  const SectionLabel = ({
    icon: Icon,
    children,
  }: {
    icon: typeof Tag;
    children: React.ReactNode;
  }) => (
    <div className="flex items-center gap-2">
      <div className="p-1 rounded-md bg-indigo-100">
        <Icon className="w-3.5 h-3.5 text-indigo-600" />
      </div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {children}
      </h3>
    </div>
  );

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-sm">
          <Navigation className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 leading-tight">
            Create New Line
          </h2>
          <p className="text-xs text-gray-500">
            Define a new geographical line for your organization
          </p>
        </div>
      </div>

      <Form {...form}>
        <div className="mt-5 space-y-6 max-h-[62vh] overflow-auto pr-1">
          {/* Line Information */}
          <section className="space-y-3">
            <SectionLabel icon={Tag}>Line Information</SectionLabel>

            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-gray-700">
                    Line Label
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="e.g., Main Office, Branch Location"
                        {...field}
                        className="pl-9 h-10 text-sm"
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-[11px] text-gray-400">
                    A descriptive name for this line/office.
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
                  <FormLabel className="text-xs font-medium text-gray-700">
                    Default User Email
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="e.g., manager@example.com"
                        {...field}
                        className="pl-9 h-10 text-sm"
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-[11px] text-gray-400">
                    The invitation link is sent here for the HRMO to register.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* Location Details */}
          <section className="space-y-3">
            <SectionLabel icon={MapPin}>Location</SectionLabel>
            <p className="text-[11px] text-gray-400">
              Select in order: Region → Province → Municipality → Barangay.
            </p>

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
                      <PsgcRegion onChange={field.onChange} value={field.value} />
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
                      <FormDescription className="text-[11px] text-amber-600">
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
                      <FormDescription className="text-[11px] text-amber-600">
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
                      <FormDescription className="text-[11px] text-amber-600">
                        Select municipality first
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(0)}
            disabled={isSubmitting}
            className="h-9 text-sm"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="h-9 text-sm bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Creating…
              </span>
            ) : (
              "Create Line"
            )}
          </Button>
        </div>
      </Form>

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
              the HRMO:
            </p>

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
