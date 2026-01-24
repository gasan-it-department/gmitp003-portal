import { useState } from "react";

//libs
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/provider/ProtectedRoute";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router";
import axios from "@/db/axios";
//components and layout
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import SelectMed from "./SelectMed";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";
import { toast } from "sonner";
//icons
import {
  Boxes,
  Trash,
  Gauge,
  Package,
  Tally5,
  MousePointerClick,
  CalendarClock,
  Rows2,
  Columns2,
  LayoutPanelTop,
  PackageCheck,
  Box,
  Warehouse,
  TableOfContents,
} from "lucide-react";

//
import { unitOfMeasure } from "@/utils/helper";

//interfaces/props/schema
import type { AddStorageMedProps, Medicine } from "@/interface/data";
import { AddStorageMedSchema } from "@/interface/zod";

const StorageMedUpdate = () => {
  const [selected, setSelected] = useState<Medicine | undefined>(undefined);
  const form = useForm<AddStorageMedProps>({
    resolver: zodResolver(AddStorageMedSchema),
    defaultValues: {
      thresHold: "5",
      quantity: "1",
      medicineId: "5",
      perUnit: "1",
      unitOfmeasure: "box",
      addressRoom: "",
      addressCol: "",
      addressRow: "",
      addressSec: "",
      container: "",
    },
  });
  const {
    handleSubmit,
    formState: { isSubmitting },
    control,
    watch,
    reset,
  } = form;

  const auth = useAuth();
  const { storageId, lineId } = useParams();
  const queryClient = useQueryClient();

  const quantity = watch("quantity");
  const perUnit = watch("perUnit");
  const actualTotal = parseInt(quantity, 10) * parseInt(perUnit, 10);

  const handleClear = () => {
    setSelected(undefined);
    reset();
  };

  const onSubmit = async (data: AddStorageMedProps) => {
    if (!selected) {
      return toast.warning("Select item first!");
    }
    if (!auth) {
      return toast.warning("Unauthorized user.");
    }
    try {
      const response = await axios.post(
        "/storage/add-medicine",
        {
          medicineId: selected.id,
          lineId: lineId,
          unitOfMeasure: data.unitOfmeasure,
          thresHold: parseInt(data.thresHold, 10),
          quantity: parseInt(data.quantity, 10),
          userId: auth.userId,
          storageId: storageId,
          price: parseInt(data.thresHold, 10),
          perUnit: parseInt(data.perUnit, 10),
          expiration: data.expiration,
        },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        }
      );

      if (response.status !== 200) {
        throw new Error(response.data.message);
      }
      await queryClient.invalidateQueries({
        queryKey: ["medStorage-list", storageId],
        refetchType: "active",
      });
      toast.success("Successfully added to the storage");
      handleClear();
      return response.data;
    } catch (error) {
      console.log(error);

      toast.error("Failed to add to the storage", {
        closeButton: false,
      });
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <ResizablePanelGroup direction="horizontal" className="w-full flex-1">
        {/* Left Panel - Select Medicine */}
        <ResizablePanel defaultSize={50} minSize={30} className="h-full">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5" />
                Select Medicine
              </h2>
              <p className="text-sm text-gray-500">
                Search and select a medicine to add to storage
              </p>
            </div>
            <div className="flex-1 overflow-hidden">
              <SelectMed onChange={setSelected} value={selected} />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Right Panel - Form */}
        <ResizablePanel defaultSize={50} minSize={30} className="h-full">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Add to Storage</h2>
                  <p className="text-sm text-gray-500">
                    Configure storage details for{" "}
                    {selected ? selected.name : "selected item"}
                  </p>
                </div>
                {selected && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClear}
                    className="flex items-center gap-2"
                  >
                    <Trash className="h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {selected ? (
                <div className="p-4 space-y-6">
                  {/* Selected Item Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <PackageCheck className="h-8 w-8 text-blue-600" />
                      <div>
                        <h3 className="font-semibold">{selected.name}</h3>
                        {/* <p className="text-sm text-gray-600">
                          {selected.genericName || "No generic name"} • Stock: {selected.quantity || "N/A"}
                        </p> */}
                      </div>
                    </div>
                  </div>

                  <Form {...form}>
                    <div className="space-y-4">
                      {/* Unit of Measure */}
                      <FormField
                        control={control}
                        name="unitOfmeasure"
                        render={({ field: { onChange, value, onBlur } }) => (
                          <FormItem>
                            <FormLabel>Unit of Measure</FormLabel>
                            <FormControl>
                              <InputGroup className="bg-white">
                                <InputGroupAddon>
                                  <Package className="h-4 w-4" />
                                </InputGroupAddon>
                                <Select value={value} onValueChange={onChange}>
                                  <SelectTrigger className="flex-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {unitOfMeasure.map((item, i) => (
                                      <SelectItem key={i} value={item.value}>
                                        {item.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </InputGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Quantity and Per Unit Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={control}
                          name="quantity"
                          render={({ field: { onChange, value, onBlur } }) => (
                            <FormItem>
                              <FormLabel>Quantity</FormLabel>
                              <FormControl>
                                <InputGroup className="bg-white">
                                  <InputGroupAddon>
                                    <Tally5 className="h-4 w-4" />
                                  </InputGroupAddon>
                                  <InputGroupInput
                                    onChange={onChange}
                                    onBlur={onBlur}
                                    value={value}
                                    type="number"
                                    min="1"
                                    placeholder="Enter quantity"
                                  />
                                </InputGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={control}
                          name="perUnit"
                          render={({ field: { onChange, value, onBlur } }) => (
                            <FormItem>
                              <FormLabel>Per Unit</FormLabel>
                              <FormControl>
                                <InputGroup className="bg-white">
                                  <InputGroupAddon>
                                    <Boxes className="h-4 w-4" />
                                  </InputGroupAddon>
                                  <InputGroupInput
                                    onChange={onChange}
                                    onBlur={onBlur}
                                    value={value}
                                    type="number"
                                    min="1"
                                    placeholder="Items per unit"
                                  />
                                </InputGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Actual Total Display */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <FormLabel>Actual Total Items</FormLabel>
                        <InputGroup className="bg-white mt-2">
                          <InputGroupAddon>
                            <Gauge className="h-4 w-4" />
                          </InputGroupAddon>
                          <InputGroupInput
                            value={actualTotal}
                            type="text"
                            placeholder="Total will be calculated"
                            disabled={true}
                            className="font-semibold"
                          />
                        </InputGroup>
                        <FormDescription className="mt-2">
                          Calculated: {quantity || 0} units × {perUnit || 0}{" "}
                          items per unit
                        </FormDescription>
                      </div>

                      {/* Threshold */}
                      <FormField
                        control={control}
                        name="thresHold"
                        render={({ field: { onChange, value, onBlur } }) => (
                          <FormItem>
                            <FormLabel>Low Stock Threshold</FormLabel>
                            <FormControl>
                              <InputGroup className="bg-white">
                                <InputGroupAddon>
                                  <Gauge className="h-4 w-4" />
                                </InputGroupAddon>
                                <InputGroupInput
                                  onChange={onChange}
                                  onBlur={onBlur}
                                  value={value}
                                  type="number"
                                  min="0"
                                  placeholder="Set low stock alert level"
                                />
                              </InputGroup>
                            </FormControl>
                            <FormDescription>
                              You'll receive notifications when stock falls
                              below this level
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Expiration Date */}
                      <FormField
                        control={control}
                        name="expiration"
                        render={({ field: { onChange, value, onBlur } }) => (
                          <FormItem>
                            <FormLabel>Expiration Date</FormLabel>
                            <FormControl>
                              <InputGroup className="bg-white">
                                <InputGroupAddon>
                                  <CalendarClock className="h-4 w-4" />
                                </InputGroupAddon>
                                <InputGroupInput
                                  onChange={onChange}
                                  onBlur={onBlur}
                                  value={value}
                                  type="date"
                                  min={new Date().toISOString().split("T")[0]}
                                />
                              </InputGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Storage Location */}
                      <div className="border-t pt-4">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <LayoutPanelTop className="h-5 w-5" />
                          Storage Location (optional)
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={control}
                            name="addressRoom"
                            render={({
                              field: { onChange, value, onBlur },
                            }) => (
                              <FormItem>
                                <FormLabel>Room</FormLabel>
                                <FormControl>
                                  <InputGroup className="bg-white">
                                    <InputGroupAddon>
                                      <Warehouse className="h-4 w-4" />
                                    </InputGroupAddon>
                                    <InputGroupInput
                                      onChange={onChange}
                                      onBlur={onBlur}
                                      value={value}
                                      placeholder="Room number/name"
                                    />
                                  </InputGroup>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={control}
                            name="addressSec"
                            render={({
                              field: { onChange, value, onBlur },
                            }) => (
                              <FormItem>
                                <FormLabel>Section</FormLabel>
                                <FormControl>
                                  <InputGroup className="bg-white">
                                    <InputGroupAddon>
                                      <TableOfContents className="h-4 w-4" />
                                    </InputGroupAddon>
                                    <InputGroupInput
                                      onChange={onChange}
                                      onBlur={onBlur}
                                      value={value}
                                      placeholder="Section"
                                    />
                                  </InputGroup>
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={control}
                            name="addressRow"
                            render={({
                              field: { onChange, value, onBlur },
                            }) => (
                              <FormItem>
                                <FormLabel>Row</FormLabel>
                                <FormControl>
                                  <InputGroup className="bg-white">
                                    <InputGroupAddon>
                                      <Rows2 className="h-4 w-4" />
                                    </InputGroupAddon>
                                    <InputGroupInput
                                      onChange={onChange}
                                      onBlur={onBlur}
                                      value={value}
                                      placeholder="Row"
                                    />
                                  </InputGroup>
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={control}
                            name="addressCol"
                            render={({
                              field: { onChange, value, onBlur },
                            }) => (
                              <FormItem>
                                <FormLabel>Col</FormLabel>
                                <FormControl>
                                  <InputGroup className="bg-white">
                                    <InputGroupAddon>
                                      <Columns2 className="h-4 w-4" />
                                    </InputGroupAddon>
                                    <InputGroupInput
                                      onChange={onChange}
                                      onBlur={onBlur}
                                      value={value}
                                      placeholder="Column"
                                    />
                                  </InputGroup>
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={control}
                            name="container"
                            render={({
                              field: { onChange, value, onBlur },
                            }) => (
                              <FormItem>
                                <FormLabel>Container</FormLabel>
                                <FormControl>
                                  <InputGroup className="bg-white">
                                    <InputGroupAddon>
                                      <Box className="h-4 w-4" />
                                    </InputGroupAddon>
                                    <InputGroupInput
                                      onChange={onChange}
                                      onBlur={onBlur}
                                      value={value}
                                      placeholder="Container"
                                    />
                                  </InputGroup>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </Form>

                  {/* Submit Button */}
                  <div className="sticky bottom-0 bg-white border-t pt-4 mt-6">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={handleClear}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                        className="min-w-[100px]"
                      >
                        {isSubmitting ? "Adding..." : "Add to Storage"}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                  <div className="max-w-md space-y-4">
                    <div className="rounded-full bg-gray-100 p-6 inline-block">
                      <MousePointerClick className="h-12 w-12 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700">
                        Select a Medicine
                      </h3>
                      <p className="text-gray-500 mt-2">
                        Choose a medicine from the left panel to configure
                        storage details. You can search by name, generic name,
                        or category.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default StorageMedUpdate;
