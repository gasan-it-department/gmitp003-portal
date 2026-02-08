import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/db/axios";
//
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import SlotSelection from "./SlotSelection";
//icons
import { AtSign, Send, X, UserPlus, MessageSquare } from "lucide-react";

//
import type {
  PositionInvitationProps,
  PositionSlotProps,
} from "@/interface/data";
import { PositionInvitationSchema } from "@/interface/zod";

//interface/props/schema
interface Props {
  setOnOpen: React.Dispatch<React.SetStateAction<number>>;
  lineId: string;
  token: string;
  userId: string;
  unitPositionId: string;
  slots: PositionSlotProps[];
}

const PositionInvitationForm = ({
  setOnOpen,
  token,
  lineId,
  userId,
  unitPositionId,
  slots,
}: Props) => {
  const form = useForm({
    resolver: zodResolver(PositionInvitationSchema),
    defaultValues: {
      mail: "",
      message: "",
      slot: "",
    },
  });
  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = form;

  const onSubmit = async (data: PositionInvitationProps) => {
    try {
      const response = await axios.post(
        "/position/fill-invite",
        {
          lineId,
          userId,
          unitPositionId,
          message: data.message,
          email: data.mail,
          slotId: data.slot,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        },
      );

      if (response.status !== 200) {
        throw new Error(response.data);
      }
      setOnOpen(0);
      toast.success("INVITATION SEND");
    } catch (error) {
      toast.error("TRANSACTION FAILED", {
        description: `${error}`,
      });
    }
  };

  const openSlots = slots.filter((slot) => !slot.occupied);
  const totalSlots = slots.length;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <UserPlus className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Invite</h3>
            <p className="text-sm text-gray-500">
              Send an invitation to fill a position slot
            </p>
          </div>
        </div>
        {totalSlots > 0 && (
          <div className="flex items-center gap-4 text-sm">
            <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
              {openSlots.length} open slot{openSlots.length !== 1 ? "s" : ""}
            </div>
            <div className="text-gray-500">
              {totalSlots} slot{totalSlots !== 1 ? "s" : ""} total
            </div>
          </div>
        )}
      </div>

      <Separator />

      <Form {...form}>
        {/* Slot Selection */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <FormLabel className="text-sm font-medium text-gray-900">
                Select Slot
              </FormLabel>
              <span className="text-xs text-gray-500">Required</span>
            </div>
            <FormField
              control={control}
              name="slot"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <SlotSelection
                      slots={slots}
                      onChange={field.onChange}
                      className="w-full"
                      value={field.value}
                      defaultValue={undefined}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Choose which position slot to fill
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <FormLabel className="text-sm font-medium text-gray-900">
                Email
              </FormLabel>
              <span className="text-xs text-gray-500">Required</span>
            </div>
            <FormField
              control={control}
              name="mail"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <InputGroup className="border rounded-lg overflow-hidden">
                      <InputGroupAddon className="pl-3 bg-gray-50">
                        <AtSign className="h-4 w-4 text-gray-500" />
                      </InputGroupAddon>
                      <InputGroupInput
                        placeholder="Enter candidate's email address"
                        {...field}
                        className="pl-2"
                      />
                    </InputGroup>
                  </FormControl>
                  <FormDescription className="text-xs">
                    The invitation will be sent to this email address
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <FormLabel className="text-sm font-medium text-gray-900">
                Invitation Message
              </FormLabel>
              <span className="text-xs text-gray-500">Optional</span>
            </div>
            <FormField
              control={control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="border rounded-lg overflow-hidden">
                      <InputGroup className="border-0">
                        <InputGroupAddon className="pl-3 bg-gray-50 pt-3">
                          <MessageSquare className="h-4 w-4 text-gray-500" />
                        </InputGroupAddon>
                        <InputGroupTextarea
                          placeholder="Add a personalized message for the candidate..."
                          {...field}
                          className="min-h-[100px] pl-2 border-0 focus-visible:ring-0"
                        />
                      </InputGroup>
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs">
                    This message will be included in the invitation email
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator className="my-6" />

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOnOpen(0)}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Invitation
              </>
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default PositionInvitationForm;
