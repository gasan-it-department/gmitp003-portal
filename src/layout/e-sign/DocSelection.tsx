import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { File, X, Upload } from "lucide-react";

const DocSelection = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (
      !file.type.includes("pdf") &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please select a PDF file");
      return;
    }

    setError("");
    setSelectedFile(file);

    // Create object URL
    const url = URL.createObjectURL(file);
    setPdfUrl(url);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    setPdfUrl("");
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">PDF Viewer</h1>
      </div>

      {/* File Selection */}
      <div className="space-y-4">
        {!selectedFile ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <File className="h-12 w-12 text-gray-400" />
              <p className="text-gray-500">No PDF selected</p>
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Select PDF
              </Button>
            </div>
          </div>
        ) : (
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <File className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClearFile}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <Input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        {error && <div className="text-red-500 text-sm">{error}</div>}
      </div>

      {/* PDF Display using iframe */}
      {pdfUrl && (
        <div className="border rounded-lg overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="font-medium">Preview</h2>
          </div>
          <div className="h-[600px]">
            <iframe
              src={pdfUrl}
              title="PDF Preview"
              className="w-full h-full"
              style={{ border: "none" }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DocSelection;
