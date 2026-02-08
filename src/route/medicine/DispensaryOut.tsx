import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/provider/ProtectedRoute";
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
  const [onOpen, setOnOpen] = useState(0);
  const [data, setData] = useState<Prescription | undefined>(undefined);
  const form = useForm<DispensaryProps>({
    resolver: zodResolver(DispensarySchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      age: "",
      desc: "",
      region: "",
      province: "",
      municipal: "",
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
    <div className="w-full h-full flex bg-gray-50/50">
      <ResizablePanelGroup
        direction="horizontal"
        className="border rounded-lg bg-white shadow-sm"
      >
        <ResizablePanel className="min-w-[30%]">
          <div className="w-full h-full p-6 overflow-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Patient Information
                </h2>
                <p className="text-sm text-gray-500">
                  Enter patient details and location
                </p>
              </div>
            </div>

            <Form {...form}>
              <div className="space-y-6">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        rules={{ required: true }}
                        control={control}
                        name="firstname"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              First Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Enter first name"
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
                            <FormLabel className="text-sm font-medium">
                              Last Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Enter last name"
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
                        <FormItem className="mt-4">
                          <FormLabel className="text-sm font-medium">
                            Age
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 w-32"
                              placeholder="Enter age"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <CardTitle className="text-base font-medium">
                        Location Details
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      rules={{ required: true }}
                      control={control}
                      name="region"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Region</FormLabel>
                          <FormControl>
                            <RegionSelect
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
                          <FormLabel className="text-sm">Province</FormLabel>
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
                          <FormLabel className="text-sm">
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
                          <FormLabel className="text-sm">Barangay</FormLabel>
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

                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <CardTitle className="text-base font-medium">
                        Additional Information
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={control}
                      name="desc"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">
                            Description (Optional)
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              className="bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                              placeholder="Enter any additional notes or description"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Pill className="h-4 w-4 text-gray-500" />
                        <CardTitle className="text-base font-medium">
                          Prescribed Medications
                        </CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {prescribeMeds.fields.length} items
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-48 border rounded-lg p-3">
                      {prescribeMeds.fields.length > 0 ? (
                        <div className="space-y-2">
                          {prescribeMeds.fields.map((item, i) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm">
                                    {item.medName}
                                  </p>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Qty: {item.quantity}
                                  </Badge>
                                </div>
                                {item.comment && (
                                  <p className="text-xs text-gray-600 mt-1 truncate">
                                    {item.comment}
                                  </p>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleRemovePresMed(i);
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full p-4">
                          <div className="p-3 bg-gray-100 rounded-full mb-3">
                            <Pill className="h-6 w-6 text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-500 text-center">
                            No medications added yet
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Select medications from the right panel
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
            <div className="p-6 flex-1 overflow-auto">
              <div className="border rounded-lg shadow-sm bg-white">
                <DispensaryPrescribe
                  handleAddPresMed={handleAddPresMed}
                  lineId={lineId}
                  storageId={undefined}
                  token={auth.token}
                />
              </div>
            </div>

            <div className="p-6 border-t bg-white">
              <Separator className="mb-4" />
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <p>
                    Total Items:{" "}
                    <span className="font-medium">
                      {prescribeMeds.fields.length}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Review information before submission
                  </p>
                </div>
                <Button
                  onClick={() => setOnOpen(1)}
                  className="gap-2 px-6 bg-blue-600 hover:bg-blue-700"
                  disabled={prescribeMeds.fields.length === 0 || isSubmitting}
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? "Submitting..." : "Submit Prescription"}
                </Button>
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

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
