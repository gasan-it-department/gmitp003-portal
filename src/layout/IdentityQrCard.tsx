import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { getMyVerifyQr } from "@/db/statements/user";
import { dataURLtoBlob } from "@/utils/file";
import { copyToClipboard } from "@/utils/clipboard";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  QrCode,
  Download,
  Maximize2,
  Copy,
  Check,
  Loader2,
  ShieldAlert,
  RotateCcw,
} from "lucide-react";

/**
 * The employee's own identity QR, in the Profile panel.
 *
 * It is the SAME code printed on their ID card and the same one the HR
 * attendance scanner reads, so this is not a decorative widget — someone who
 * forgot their card can pull it up here and be scanned off the screen, and
 * the download exists so they can reprint it themselves.
 *
 * The image comes from the server. The web bundle only carries jsQR, which
 * decodes; nothing in it can ENCODE a QR, and the download wants a crisp
 * 1024px PNG rather than something scraped off a canvas at display size.
 */
const IdentityQrCard = ({
  token,
  fullName,
  username,
}: {
  token: string;
  fullName?: string;
  username?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: ["myVerifyQr"],
    queryFn: () => getMyVerifyQr(token),
    enabled: !!token,
    // The code is permanent once issued; there is nothing to poll for.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const fileName = `gasan-id-qr-${(username || fullName || "employee")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}.png`;

  const handleDownload = () => {
    if (!data?.qr) return;
    try {
      const href = URL.createObjectURL(dataURLtoBlob(data.qr));
      const a = document.createElement("a");
      a.href = href;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
      toast.success("QR code saved.", { description: fileName });
    } catch {
      toast.error("Couldn't save the QR code.");
    }
  };

  const handleCopy = async () => {
    if (!data?.url) return;
    try {
      await copyToClipboard(data.url, setCopied);
      toast.success("Verification link copied.");
    } catch {
      toast.error("Couldn't copy the link.");
    }
  };

  return (
    <>
      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
          <QrCode className="h-3 w-3 text-blue-500" />
          <h3 className="text-xs font-semibold text-gray-800">My QR Code</h3>
        </div>

        {isPending ? (
          <div className="p-3 flex flex-col items-center gap-1.5 text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-[10px]">Loading your QR...</p>
          </div>
        ) : isError || !data?.qr ? (
          <div className="p-3 flex flex-col items-center gap-2 text-center">
            <p className="text-[10px] text-gray-500">
              Your QR code couldn&apos;t be loaded.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px] gap-1.5"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RotateCcw className="h-3 w-3" />
              )}
              Try again
            </Button>
          </div>
        ) : (
          <div className="p-3 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              title="Click to enlarge"
              className="group relative rounded-md border bg-white p-1.5 hover:border-blue-300 hover:shadow-sm transition"
            >
              <img
                src={data.qr}
                alt="Your identity QR code"
                width={128}
                height={128}
                className="h-32 w-32 block"
              />
              <span className="absolute inset-0 rounded-md bg-blue-600/0 group-hover:bg-blue-600/5 flex items-center justify-center transition">
                <Maximize2 className="h-4 w-4 text-blue-600 opacity-0 group-hover:opacity-100 transition" />
              </span>
            </button>

            <p className="text-[10px] text-gray-500 text-center leading-snug">
              The same code printed on your ID. HR scans this for attendance
              and verification.
            </p>

            <div className="grid grid-cols-2 gap-1.5 w-full">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] gap-1.5"
                onClick={() => setOpen(true)}
              >
                <Maximize2 className="h-3 w-3" />
                View
              </Button>
              <Button
                size="sm"
                className="h-7 text-[10px] gap-1.5"
                onClick={handleDownload}
              >
                <Download className="h-3 w-3" />
                Download
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Enlarged view — big enough for a phone camera to read off the screen */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-1.5">
              <QrCode className="h-4 w-4 text-blue-600" />
              My QR Code
            </DialogTitle>
            <DialogDescription className="text-[11px]">
              {fullName || username || "Your identity QR"}
            </DialogDescription>
          </DialogHeader>

          {data?.qr && (
            <div className="flex flex-col items-center gap-3 w-full min-w-0">
              <div className="rounded-lg border bg-white p-3">
                <img
                  src={data.qr}
                  alt="Your identity QR code, enlarged"
                  className="h-64 w-64 sm:h-72 sm:w-72 block"
                />
              </div>

              <div className="w-full min-w-0">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
                  Verification link
                </p>
                <div className="flex items-center gap-1.5 min-w-0">
                  <code className="flex-1 min-w-0 truncate rounded border bg-gray-50 px-2 py-1.5 font-mono text-[10px] text-gray-700">
                    {data.url}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0 flex-shrink-0"
                    onClick={handleCopy}
                    title="Copy link"
                    aria-label="Copy verification link"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="w-full flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5">
                <ShieldAlert className="h-3 w-3 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-800 leading-snug">
                  Keep this to yourself. Anyone holding your QR can be scanned
                  in as you.
                </p>
              </div>

              <Button
                className="w-full h-8 text-[11px] gap-1.5"
                onClick={handleDownload}
              >
                <Download className="h-3 w-3" />
                Download PNG
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default IdentityQrCard;
