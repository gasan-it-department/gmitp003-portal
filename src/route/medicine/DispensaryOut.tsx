import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/provider/ProtectedRoute";
import useLine from "@/hooks/useLine";
import { useParams } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray } from "react-hook-form";
import axios from "@/db/axios";

//
import DispensaryPrescribe from "@/layout/medicine/DispensaryPrescribe";
import {
  Form,
  FormControl,
  FormField,
  //FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import RegionSelect from "@/layout/RegionSelect";
import ProvinceSelect from "@/layout/ProvinceSelect";
import MunicipalitySelect from "@/layout/MunicipalitySelect";
import BarangaySelect from "@/layout/BarangaySelect";
import { Button } from "@/components/ui/button";
import Modal from "@/components/custom/Modal";
import {
  ResizableHandle,
  ResizablePanelGroup,
  ResizablePanel,
} from "@/components/ui/resizable";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

//icons
import { Send, Trash, User, MapPin, FileText, Pill } from "lucide-react";
//props/interface/schema
import { DispensarySchema } from "@/interface/zod";
import type { DispensaryProps, Prescription } from "@/interface/data";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const DispensaryOut = () => {
  const auth = useAuth();
  const line = useLine();
  const [onOpen, setOnOpen] = useState(0);
  const [data, setData] = useState<Prescription | undefined>(undefined);
  const form = useForm<DispensaryProps>({
    resolver: zodResolver(DispensarySchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      age: "",
      desc: "",
      region: line.line?.region.id || "",
      province: line.line?.province.id || "",
      municipal: line.line?.municipal.id || "",
      barangay: "",
      prescribeMed: [],
    },
  });

  const {
    control,
    handleSubmit,
    watch,
    resetField,
    formState: { isSubmitting },
  } = form;
  const { lineId } = useParams();

  const regionId = watch("region");
  const provinceId = watch("province");
  const municipalId = watch("municipal");

  const prescribeMeds = useFieldArray({
    control,
    name: "prescribeMed",
  });

  const handleAddPresMed = (
    medId: string,
    comment: string,
    quantity: string,
    medName: string,
  ) => {
    const existed = prescribeMeds.fields.findIndex(
      (item) => item.medId === medId,
    );
    if (existed !== -1) return;
    if (quantity === "0") {
      toast.warning("Invalid Quantity");
      return;
    }
    prescribeMeds.append({ medId, comment, quantity, medName });
    toast.success("Added Successfully", {
      closeButton: false,
    });
  };

  const handleRemovePresMed = (index: number) => {
    prescribeMeds.remove(index);
  };

  const onSubmit = async (data: DispensaryProps) => {
    console.log(auth);

    if (!auth.token || !auth.userId)
      return toast.warning("Unauthorized user", { closeButton: false });

    try {
      const response = await axios.post(
        "/prescription/new",
        {
          lineId,
          userId: auth.userId,
          barangayId: data.barangay,
          municipalId: data.municipal,
          provinceId: data.province,
          ...data,
        },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        },
      );

      if (response.status !== 200) {
        toast.error("Failed to submit", {
          description: response.data.message,
          closeButton: false,
        });
        return;
      }
      setData(response.data.response);
      setOnOpen(2);
      resetField("prescribeMed");
      resetField("firstname");
      resetField("lastname");
      resetField("desc");
      resetField("age");
      resetField("region");
      resetField("province");
      resetField("municipal");
      resetField("barangay");
    } catch (error) {
      toast.error("Failed to submit", {
        closeButton: false,
        description: `${error}`,
      });
    }
  };

  return (
    <div className="w-full h-full flex flex-col lg:flex-row bg-gray-50/50">
      {/* Mobile: Stack vertically, Desktop: Use resizable panels */}
      <div className="lg:hidden w-full h-full overflow-auto">
        <div className="w-full p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-50 rounded-md">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800">
                Patient Information
              </h2>
              <p className="text-xs text-gray-500">
                Enter patient details and location
              </p>
            </div>
          </div>

          <Form {...form}>
            <div className="space-y-4">
              <Card className="border shadow-sm">
                <CardContent className="p-3">
                  <div className="space-y-3">
                    <FormField
                      rules={{ required: true }}
                      control={control}
                      name="firstname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium">
                            First Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="h-9 text-sm"
                              placeholder="First name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      rules={{ required: true }}
                      control={control}
                      name="lastname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium">
                            Last Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              className="h-9 text-sm"
                              placeholder="Last name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      rules={{ required: true }}
                      control={control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium">
                            Age
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="h-9 text-sm w-32"
                              placeholder="Age"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardHeader className="pb-2 px-3 pt-2">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gray-500" />
                    <CardTitle className="text-sm font-medium">
                      Location Details
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 px-3 pb-3">
                  <FormField
                    rules={{ required: true }}
                    control={control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Region</FormLabel>
                        <FormControl>
                          <RegionSelect
                            onChange={field.onChange}
                            value={field.value}
                            defaultValue={line.line?.region.id}
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
                        <FormLabel className="text-xs">Province</FormLabel>
                        <FormControl>
                          <ProvinceSelect
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
                    name="municipal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Municipality</FormLabel>
                        <FormControl>
                          <MunicipalitySelect
                            token={auth.token}
                            onChange={field.onChange}
                            provinceId={provinceId}
                            value={field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="barangay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Barangay</FormLabel>
                        <FormControl>
                          <BarangaySelect
                            token={auth.token}
                            onChange={field.onChange}
                            municipalityId={municipalId}
                            value={field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="border shadow-sm">
                <CardHeader className="pb-2 px-3 pt-2">
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-gray-500" />
                    <CardTitle className="text-sm font-medium">
                      Additional Information
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <FormField
                    control={control}
                    name="desc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          Description (Optional)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            className="text-sm"
                            placeholder="Enter any additional notes"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </Form>
        </div>

        <Separator className="my-2" />

        <div className="w-full p-4">
          <div className="border rounded-lg shadow-sm bg-white">
            <div className="p-3 border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <Pill className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-800">
                  Available Medicines
                </h3>
              </div>
            </div>
            <div className="p-2 max-h-[300px] overflow-auto">
              <DispensaryPrescribe
                handleAddPresMed={handleAddPresMed}
                lineId={lineId}
                storageId={undefined}
                token={auth.token}
              />
            </div>
          </div>
        </div>

        <div className="w-full p-4 pt-0">
          <div className="border rounded-lg shadow-sm bg-white">
            <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className="h-4 w-4 text-green-600" />
                <h3 className="text-sm font-semibold text-gray-800">
                  Selected ({prescribeMeds.fields.length})
                </h3>
              </div>
            </div>
            <div className="p-2 max-h-[250px] overflow-auto">
              {prescribeMeds.fields.length > 0 ? (
                <div className="space-y-2">
                  {prescribeMeds.fields.map((item, i) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-md border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-gray-800">
                            {item.medName}
                          </p>
                          <Badge variant="secondary" className="text-[10px]">
                            Qty: {item.quantity}
                          </Badge>
                        </div>
                        {item.comment && (
                          <p className="text-[10px] text-gray-500 mt-1">
                            {item.comment}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 hover:bg-red-50"
                        onClick={() => handleRemovePresMed(i)}
                      >
                        <Trash className="h-3.5 w-3.5 text-gray-400" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Pill className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No medications added</p>
                  <p className="text-xs text-gray-400">Select from above</p>
                </div>
              )}
            </div>
            <div className="p-3 border-t bg-gray-50">
              <Button
                onClick={() => setOnOpen(1)}
                className="w-full gap-2"
                disabled={prescribeMeds.fields.length === 0 || isSubmitting}
              >
                <Send className="h-4 w-4" />
                {isSubmitting
                  ? "Submitting..."
                  : `Submit Prescription (${prescribeMeds.fields.length})`}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Original resizable panels */}
      <div className="hidden lg:flex w-full h-full">
        <ResizablePanelGroup
          direction="horizontal"
          className="border rounded-lg bg-white shadow-sm"
        >
          <ResizablePanel className="min-w-[30%]">
            <div className="w-full h-full p-4 overflow-auto">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-blue-50 rounded-md">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">
                    Patient Information
                  </h2>
                  <p className="text-xs text-gray-500">
                    Enter patient details and location
                  </p>
                </div>
              </div>

              <Form {...form}>
                <div className="space-y-4">
                  <Card className="border shadow-sm">
                    <CardContent className="p-3">
                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          rules={{ required: true }}
                          control={control}
                          name="firstname"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium">
                                First Name
                              </FormLabel>
                              <FormControl>
                                <Input
                                  className="h-8 text-sm"
                                  placeholder="First name"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          rules={{ required: true }}
                          control={control}
                          name="lastname"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium">
                                Last Name
                              </FormLabel>
                              <FormControl>
                                <Input
                                  className="h-8 text-sm"
                                  placeholder="Last name"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        rules={{ required: true }}
                        control={control}
                        name="age"
                        render={({ field }) => (
                          <FormItem className="mt-2">
                            <FormLabel className="text-xs font-medium">
                              Age
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                className="h-8 text-sm w-24"
                                placeholder="Age"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card className="border shadow-sm">
                    <CardHeader className="pb-2 px-3 pt-2">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-gray-500" />
                        <CardTitle className="text-sm font-medium">
                          Location Details
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 px-3 pb-3">
                      <FormField
                        rules={{ required: true }}
                        control={control}
                        name="region"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Region</FormLabel>
                            <FormControl>
                              <RegionSelect
                                onChange={field.onChange}
                                value={field.value}
                                defaultValue={line.line?.region.id}
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
                            <FormLabel className="text-xs">Province</FormLabel>
                            <FormControl>
                              <ProvinceSelect
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
                        name="municipal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Municipality
                            </FormLabel>
                            <FormControl>
                              <MunicipalitySelect
                                token={auth.token}
                                onChange={field.onChange}
                                provinceId={provinceId}
                                value={field.value}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name="barangay"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Barangay</FormLabel>
                            <FormControl>
                              <BarangaySelect
                                token={auth.token}
                                onChange={field.onChange}
                                municipalityId={municipalId}
                                value={field.value}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card className="border shadow-sm">
                    <CardHeader className="pb-2 px-3 pt-2">
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-gray-500" />
                        <CardTitle className="text-sm font-medium">
                          Additional Information
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <FormField
                        control={control}
                        name="desc"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">
                              Description (Optional)
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                className="text-sm"
                                placeholder="Enter any additional notes"
                                rows={2}
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card className="border shadow-sm">
                    <CardHeader className="pb-2 px-3 pt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Pill className="h-3.5 w-3.5 text-gray-500" />
                          <CardTitle className="text-sm font-medium">
                            Prescribed Medications
                          </CardTitle>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {prescribeMeds.fields.length} items
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <ScrollArea className="h-40 border rounded-md p-2">
                        {prescribeMeds.fields.length > 0 ? (
                          <div className="space-y-2">
                            {prescribeMeds.fields.map((item, i) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded-md border"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-medium text-xs">
                                      {item.medName}
                                    </p>
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px]"
                                    >
                                      Qty: {item.quantity}
                                    </Badge>
                                  </div>
                                  {item.comment && (
                                    <p className="text-[10px] text-gray-600 mt-1 truncate">
                                      {item.comment}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleRemovePresMed(i);
                                  }}
                                >
                                  <Trash className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-32">
                            <Pill className="h-5 w-5 text-gray-300 mb-2" />
                            <p className="text-xs text-gray-400 text-center">
                              No medications added
                            </p>
                          </div>
                        )}
                        <ScrollBar />
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </Form>
            </div>
          </ResizablePanel>

          <ResizableHandle
            withHandle={true}
            className="bg-gray-200 hover:bg-blue-500 transition-colors"
          />

          <ResizablePanel className="min-w-[30%]">
            <div className="w-full h-full flex flex-col">
              <div className="flex-1 overflow-auto p-2">
                <div className="border rounded-lg shadow-sm bg-white h-full">
                  <DispensaryPrescribe
                    handleAddPresMed={handleAddPresMed}
                    lineId={lineId}
                    storageId={undefined}
                    token={auth.token}
                  />
                </div>
              </div>
              <div className="p-3 border-t bg-white">
                <Separator className="mb-3" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      Total:{" "}
                      <span className="text-blue-600">
                        {prescribeMeds.fields.length}
                      </span>{" "}
                      items
                    </p>
                    <p className="text-xs text-gray-500">
                      Review before submission
                    </p>
                  </div>
                  <Button
                    onClick={() => setOnOpen(1)}
                    className="gap-2 h-9"
                    disabled={prescribeMeds.fields.length === 0 || isSubmitting}
                  >
                    <Send className="h-4 w-4" />
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Modals - unchanged */}
      <Modal
        title={"Submit Prescription"}
        children={undefined}
        onOpen={onOpen === 1}
        className={"min-w-md"}
        setOnOpen={() => {
          if (isSubmitting) return;
          setOnOpen(0);
        }}
        footer={true}
        loading={isSubmitting}
        onFunction={handleSubmit(onSubmit)}
      />

      <Modal
        title={
          data ? "Prescription Submitted Successfully!" : "Submission Error"
        }
        children={
          data ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <div className="p-1 bg-green-100 rounded">
                    <Send className="h-4 w-4" />
                  </div>
                  <p className="font-medium">Prescription has been recorded</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  Please save this reference information:
                </p>

                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <span className="text-sm font-medium text-gray-700">
                      Reference #
                    </span>
                    <code className="font-mono font-bold text-blue-700">
                      {data.refNumber}
                    </code>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">Patient Name</p>
                      <p className="font-medium">
                        {data.lastname}, {data.firstname}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">Date Filed</p>
                      <p className="font-medium">{data.timestamp}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Note:</span> You can check
                    this prescription later in the Transactions section.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <div className="p-1 bg-red-100 rounded">
                    <Trash className="h-4 w-4" />
                  </div>
                  <p className="font-medium">Unable to submit prescription</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  Possible reasons:
                </p>
                <ul className="space-y-2 pl-5 list-disc">
                  <li className="text-sm text-gray-600">
                    Server transaction error
                  </li>
                  <li className="text-sm text-gray-600">
                    Network connection issue
                  </li>
                  <li className="text-sm text-gray-600">
                    Authentication error
                  </li>
                </ul>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-gray-600">
                    Please try again or check your internet connection. You can
                    also review the transaction logs.
                  </p>
                </div>
              </div>
            </div>
          )
        }
        onOpen={onOpen === 2}
        className={"min-w-2xl"}
        setOnOpen={() => {
          if (isSubmitting) return;
          setOnOpen(0);
        }}
        loading={isSubmitting}
        cancelTitle="Close"
        onFunction={handleSubmit(onSubmit)}
      />
    </div>
  );
};

export default DispensaryOut;
