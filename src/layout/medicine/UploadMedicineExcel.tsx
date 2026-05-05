import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/db/axios";

import { Button } from "@/components/ui/button";
import Modal from "@/components/custom/Modal";
//
import { AlertCircle, FileSpreadsheet, Upload } from "lucide-react";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { toast } from "sonner";

interface Props {
  token: string;
  lineId: string;
}
const UploadMedicineExcel = ({ token, lineId }: Props) => {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const [onOpen, setOnOpen] = useState(0);

  const onSubmit = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("lineId", lineId);

    const response = await axios.post("/medicine/bulk-upload", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.status !== 200) throw new Error(response.data.mesage);
    console.log("Excel", response.data);
  };

  const { mutateAsync, isPending } = useMutation({
    mutationFn: onSubmit,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["medicine-list", lineId],
      });
      setOnOpen(0);
    },
    onError: (err) => {
      toast.error("Transaction Failed", {
        description: err.message,
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // You can add file validation here if needed
      const allowedTypes = [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv",
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error("Invalid file type. Please upload Excel or CSV file.");
        setSelectedFile(undefined);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size too large. Maximum size is 10MB.");
        setSelectedFile(undefined);
        return;
      }

      toast.success(`File selected: ${file.name}`);
    }
  };
  const triggerFileInput = () => {
    document.getElementById("excel-file-input")?.click();
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="w-full justify-between h-10"
        onClick={() => setOnOpen(2)}
      >
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          <span>Upload Excel</span>
        </div>
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <span>+</span>
          <Kbd>U</Kbd>
        </KbdGroup>
      </Button>
      <Modal
        title="Upload Excel File"
        onOpen={onOpen === 2}
        className="max-w-2xl overflow-auto"
        setOnOpen={() => {
          setSelectedFile(undefined);
          setOnOpen(0);
        }}
      >
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <div className="p-3 bg-blue-50 rounded-full inline-flex mb-4">
              <Upload className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Upload Medicine Spreadsheet
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Upload an Excel file (.xlsx, .xls, .csv) with your medicine data
            </p>

            {/* Hidden file input */}
            <input
              id="excel-file-input"
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Button to trigger file input */}
            <Button
              variant="outline"
              className="gap-2"
              onClick={triggerFileInput}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Select Excel File
            </Button>

            {/* Show selected file */}
            {selectedFile && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-sm text-green-800">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-green-600">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(undefined);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}

            <p className="text-xs text-gray-400 mt-6">
              Supported formats: .xlsx, .xls, .csv (Max 10MB)
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-blue-800 mb-1">
                  File Requirements
                </p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>
                    • File must include columns: Name, Description (optional)
                  </li>
                  <li>• Maximum file size: 10MB</li>
                  <li>• First row should contain column headers</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Upload Button - Only show when file is selected */}
          {selectedFile && (
            <div className="pt-4 border-t">
              <Button
                disabled={isPending}
                className="w-full gap-2 bg-green-600 hover:bg-green-700"
                onClick={() => {
                  if (isPending) return;
                  mutateAsync();
                }}
              >
                <Upload className="h-4 w-4" />
                Upload File
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default UploadMedicineExcel;
