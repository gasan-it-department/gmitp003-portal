import {} from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import axios from "@/db/axios";
//
import {
  Form,
  FormControl,
  FormField,
  FormMessage,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
//
import { ContactApplicationSchema } from "@/interface/zod";
import type { ContactApplicationProps } from "@/interface/data";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Props {
  token: string;
  setOnOpen: React.Dispatch<React.SetStateAction<number>>;
  applicationId: string;
  many?: number;
  ids?: string[];
}

const ContactApplicant = ({
  token,
  setOnOpen,
  applicationId,
  many = 1,
  ids,
}: Props) => {
  const form = useForm<ContactApplicationProps>({
    resolver: zodResolver(ContactApplicationSchema),
    defaultValues: {
      message: `Dear [Applicant Name],

Thank you for your application for the [Position Title] position. We were impressed with your qualifications and would like to invite you for an interview.

**Interview Details:**
- Date: [Date]
- Time: [Time]
- Location/Format: [In-person at our office / Video Call via Zoom]
- Duration: Approximately [X] minutes
- Interviewer: [Name/Department]

Please confirm your availability by [Date]. If the proposed time doesn't work for you, please suggest alternative times that would be convenient.

We look forward to learning more about your experience and discussing how you can contribute to our team.

Best regards,
[Your Name]
HR Team
[Company Name]`,
      sendTo: "both",
      subject: "",
    },
  });

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = form;

  const onSubmit = async (data: ContactApplicationProps) => {
    const url =
      many === 1
        ? "/application/contact-applicant"
        : "/application/contact-applicant/bulk";

    const idList = many === 1 ? applicationId : ids;
    try {
      const response = await axios.post(
        url,
        {
          message: data.message,
          subject: data.subject,
          applicationId: idList,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
        }
      );

      if (response.status !== 200) {
        throw new Error("Failed to send message");
      }
      toast.success("Successfully contacted applicant.", {
        position: "top-right",
      });
      setOnOpen(0);
    } catch (error) {
      console.error("Error contacting applicant:", error);
      toast.error("Failed to contact applicant. Please try again.", {
        position: "top-right",
      });
    }
  };

  return (
    <div className=" w-full">
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormField
            control={control}
            name="sendTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Send to</FormLabel>
                <FormControl>
                  <RadioGroup
                    className="flex gap-2"
                    onValueChange={(e) => field.onChange(e)}
                    defaultValue={field.value}
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="both" id="both" />
                      <label htmlFor="both">Both</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="phoneNumber" id="phoneNumber" />
                      <label htmlFor="phoneNumber">Phone number only</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="Email" id="Email" />

                      <label htmlFor="Email">Email only</label>
                    </div>
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="subject"
            render={({ field }) => (
              <FormItem className=" mt-4">
                <FormLabel>Subject</FormLabel>
                <FormControl>
                  <Input placeholder="Enter subject" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="message"
            render={({ field }) => (
              <FormItem className=" mt-4">
                <FormLabel>Message</FormLabel>
                <FormDescription>
                  NOTE: Template only. You can customize the message as needed.
                </FormDescription>

                <FormControl>
                  <Textarea placeholder="Enter message content" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className=" w-full py-2 flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Please wait..." : "Submit"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ContactApplicant;
