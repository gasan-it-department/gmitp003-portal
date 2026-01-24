import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "@/db/axios";
import { isAxiosError } from "axios";
import { sendOTPviaEmail } from "@/db/statement";
import { setCookie } from "@/utils/cookies";
//
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

const otpSchema = z.object({
  pin: z.string().min(6, "Enter the complete 6-digit code"),
});

interface Props {
  email?: string;
  onVerify?: (otp: string) => void;
  onResend?: () => void;
  id?: string;
  title?: string;
  to?: number;
  note?: string;
}

const OTP = ({
  email = "user@example.com",
  onVerify,
  onResend,
  id,
  title,
  to = 1,
  note,
}: Props) => {
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const hasSentInitialOTP = useRef(false);

  const form = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { pin: "" },
  });
  const {
    handleSubmit,
    formState: { isSubmitting },
    setError,
  } = form;

  // Get OTP cooldown from localStorage
  const getStoredCooldown = () => {
    if (!id) return null;
    const stored = localStorage.getItem(`otp_cooldown_${id}`);
    if (!stored) return null;

    const { timestamp, initialSent } = JSON.parse(stored);
    const elapsed = Date.now() - timestamp;
    const remaining = Math.max(0, 120 - Math.floor(elapsed / 1000));

    return {
      remaining: remaining > 0 ? remaining : 0,
      initialSent: initialSent || false,
    };
  };

  // Set OTP cooldown in localStorage
  const setStoredCooldown = (initialSent = false) => {
    if (!id) return;
    localStorage.setItem(
      `otp_cooldown_${id}`,
      JSON.stringify({
        timestamp: Date.now(),
        initialSent: initialSent,
      })
    );
  };

  // Clear OTP cooldown from localStorage
  const clearStoredCooldown = () => {
    if (!id) return;
    localStorage.removeItem(`otp_cooldown_${id}`);
  };

  const sendOTP = async (isInitial = false) => {
    if (!id) {
      console.error("INVALID ID");
      return;
    }

    try {
      await sendOTPviaEmail(id, to);
      setCanResend(false);
      setCountdown(120);
      setStoredCooldown(isInitial);
      toast.success("Verification code sent successfully", {
        position: "top-right",
      });
    } catch (error) {
      console.error("Failed to send OTP:", error);
      toast.error("Failed to send verification code");
    }
  };

  const handleResend = () => {
    if (canResend) {
      sendOTP(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof otpSchema>) => {
    if (!id) throw new Error("INVALID ID");

    try {
      const response = await axios.post("/otp/verify/email", {
        code: parseInt(data.pin, 10),
        applicationID: id,
      });
      if (response.status !== 200) {
        throw new Error(response.data.meessage);
      }
      setCookie(`temp_auth-${id}`, response.data.token, 1);
      localStorage.setItem("temp_auth", id);
      // Clear cooldown on successful verification
      clearStoredCooldown();
    } catch (error) {
      console.log(error);

      if (isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to submit";
        setError("pin", { message: errorMessage });
      } else if (error instanceof Error) {
        setError("pin", { message: error.message });
      } else {
        setError("pin", { message: "An unexpected error occurred" });
      }
    }
  };

  // Initialize cooldown from localStorage on component mount
  useEffect(() => {
    if (!id) return;

    const storedData = getStoredCooldown();

    if (storedData) {
      const { remaining, initialSent } = storedData;

      if (remaining > 0) {
        // Cooldown is still active - resume countdown
        setCanResend(false);
        setCountdown(remaining);
        hasSentInitialOTP.current = initialSent;
      } else {
        // Cooldown expired
        setCanResend(true);
        setCountdown(0);
        hasSentInitialOTP.current = initialSent;

        // If initial OTP was never sent, send it now
        if (!initialSent) {
          hasSentInitialOTP.current = true;
          sendOTP(true);
        }
      }
    } else {
      // No stored data - this is the first time, send initial OTP
      if (!hasSentInitialOTP.current) {
        hasSentInitialOTP.current = true;
        sendOTP(true);
      }
    }
  }, [id]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-xl">Enter Verification Code</CardTitle>
          <CardDescription>
            OTP was sent to your {title || to === 1 ? "Phone number" : "Email"}
          </CardDescription>
          {note && <CardDescription>{note}</CardDescription>}
        </CardHeader>

        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="pin"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex justify-center">
                        <InputOTP maxLength={6} {...field}>
                          <InputOTPGroup className="gap-2">
                            {[...Array(6)].map((_, i) => (
                              <InputOTPSlot
                                key={i}
                                index={i}
                                className="w-12 h-12 border-2"
                              />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                    </FormControl>
                    <FormMessage className="text-center" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={form.watch("pin").length !== 6 || isSubmitting}
              >
                {isSubmitting ? "Please wait..." : "Verify"}
              </Button>
            </form>
          </Form>

          <Button
            variant="link"
            className="w-full"
            onClick={handleResend}
            disabled={!canResend}
          >
            {canResend
              ? "Resend Code"
              : `Resend available in ${formatTime(countdown)}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default OTP;
