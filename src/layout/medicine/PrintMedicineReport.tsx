import { useState } from "react";
import axios from "@/db/axios";
import { Button } from "@/components/ui/button";
import Modal from "@/components/custom/Modal";
import { useMutation } from "@tanstack/react-query";

//
import { toast } from "sonner";
//
import { Printer } from "lucide-react";

//

interface Props {
  storageId: string;
}

const PrintMedicineReport = ({ storageId }: Props) => {
  const [isOpen, setIsOpen] = useState(0);

  const downloadMedicineReport = async () => {
    try {
      // Make the API request with axios
      const response = await axios.get("/medicine/export/report", {
        params: {
          storgeId: storageId, // Note: keeping the same parameter name as your backend
        },
        responseType: "blob", // Important: This tells axios to handle the response as a blob
      });

      // Create a blob from the response data
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Extract filename from Content-Disposition header if available
      let filename = "Medicine_Report.xlsx";
      const contentDisposition = response.headers["content-disposition"];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      // Clean up
      link?.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  const { mutateAsync, isPending } = useMutation({
    mutationFn: downloadMedicineReport,
    onSuccess: () => {
      setIsOpen(0);
    },
    onError: (err) => {
      toast.error("TRANSACTION FAILED", {
        description: err.message,
      });
    },
  });
  return (
    <>
      <Button
        onClick={() => setIsOpen(1)}
        size="sm"
        variant="outline"
        className=" border hover:border-gray-300 cursor-pointer"
      >
        <Printer />
      </Button>
      <Modal
        title={"Print medicine report"}
        children={undefined}
        onOpen={isOpen === 1}
        className={""}
        setOnOpen={() => setIsOpen(0)}
        footer={true}
        loading={isPending}
        onFunction={() => {
          mutateAsync();
        }}
      />
    </>
  );
};

export default PrintMedicineReport;
