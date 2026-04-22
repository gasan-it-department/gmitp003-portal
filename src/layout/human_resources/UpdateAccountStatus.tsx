import { type Dispatch, type SetStateAction } from "react";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/db/axios";
import { useForm } from "react-hook-form";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { vacantPosition } from "@/db/statements/position";
//
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import Modal from "@/components/custom/Modal";
import { ArrowRight, Minus, AlertCircle, UserX } from "lucide-react";

const UpdatePositionStatusSchema = z.object({
  status: z.string().min(1, "Action is required"),
});
type UpdatePositionStatusProps = z.infer<typeof UpdatePositionStatusSchema>;
//
interface Props {
  isAvailable: boolean;
  isOpen: number;
  setOnOpen: Dispatch<SetStateAction<number>>;
  token: string;
  id: string;
  lineId: string;
  userId: string;
}

const UpdateAccountStatus = ({
  isOpen,
  isAvailable,
  setOnOpen,
  token,
  id,
  lineId,
  userId,
}: Props) => {
  const form = useForm<UpdatePositionStatusProps>({
    resolver: zodResolver(UpdatePositionStatusSchema),
    defaultValues: {
      status: "0",
    },
  });
  const {
    handleSubmit,
    control,
    formState: { isSubmitting, errors },
    setError,
    reset,
  } = form;

  const onSubmit = async (data: UpdatePositionStatusProps) => {
    try {
      // Handle submission logic h
      const response = await axios.get("/position/vacant", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        params: {
          id,
          lineId,
          userId,
          status,
        },
      });

      if (response.status !== 200) {
        throw new Error(response.data);
      }
      return response.data;
      console.log(data);
      setOnOpen(0);
      reset();
    } catch (error) {
      setError("root", { message: (error as Error).message });
    }
  };

  const handleClose = () => {
    reset();
    setOnOpen(0);
  };

  return (
    <>
      {/* Vacant Position Button */}
      <Button
        variant="outline"
        className="w-full justify-start gap-2 h-9 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-colors"
        disabled={isAvailable}
        onClick={() => setOnOpen(3)}
      >
        <Minus className="h-4 w-4" />
        <span>Vacant Position</span>
        <ArrowRight className="h-3 w-3 ml-auto" />
      </Button>

      {/* Vacant Position Modal */}
      <Modal
        title={undefined}
        onFunction={handleSubmit(onSubmit)}
        children={
          <div className="space-y-5 p-1">
            {/* Header with icon */}
            <div className="flex items-center gap-3 pb-3 border-b">
              <div className="p-2 bg-amber-100 rounded-lg">
                <UserX className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  Vacant Position
                </h3>
                <p className="text-xs text-gray-500">
                  Select the action for when the position becomes vacant
                </p>
              </div>
            </div>

            <Form {...form}>
              <FormField
                control={control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    {errors.root && (
                      <div className="mb-3 p-2 rounded-md bg-red-50 border border-red-200">
                        <FormMessage className="text-xs text-red-600 text-center">
                          {errors.root.message}
                        </FormMessage>
                      </div>
                    )}

                    <FormLabel className="text-sm font-semibold text-gray-700">
                      Action *
                    </FormLabel>

                    <FormControl>
                      <Select
                        onValueChange={(e) => field.onChange(e)}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="h-9 text-sm border-gray-200 focus:border-amber-500 focus:ring-amber-500">
                          <SelectValue placeholder="Select an action" />
                        </SelectTrigger>
                        <SelectContent>
                          {["Remove User", "Disable Access"].map((item, i) => (
                            <SelectItem
                              key={i}
                              value={i.toString()}
                              className="text-sm cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    i === 0 ? "bg-red-500" : "bg-amber-500"
                                  }`}
                                />
                                {item}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>

                    <FormDescription className="text-xs text-gray-500 mt-1.5">
                      {field.value === "0"
                        ? "User will be permanently removed from this position"
                        : "User will lose access but their data will be retained"}
                    </FormDescription>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </Form>

            {/* Info Alert */}
            <div className="rounded-md bg-amber-50 p-3 border border-amber-200">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-amber-800 mb-0.5">
                    Important Notice
                  </p>
                  <p className="text-xs text-amber-700">
                    This action will affect the current user occupying this
                    position. Please ensure you have the necessary
                    authorization.
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
        onOpen={isOpen === 3}
        className="max-w-md"
        setOnOpen={handleClose}
        footer={true}
        yesTitle="Confirm Action"
        loading={isSubmitting}
      />
    </>
  );
};

export default UpdateAccountStatus;
