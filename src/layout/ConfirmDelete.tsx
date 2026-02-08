import { useState, type Dispatch, type SetStateAction } from "react";
import { AlertTriangle, ShieldAlert, Key, X, Check } from "lucide-react";

//
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
//
interface Props {
  confirmation: string;
  setOnOpen: Dispatch<SetStateAction<number>>;
  onFunction: () => Promise<void> | void;
  isLoading: boolean;
}

const ConfirmDelete = ({
  confirmation,
  onFunction,
  setOnOpen,
  isLoading,
}: Props) => {
  const [passKey, setPassKey] = useState("");
  const [error, setError] = useState("");

  const handleProceed = async () => {
    if (isLoading) return;
    // Clear previous error
    setError("");

    // Check if input matches confirmation text (case-insensitive, trimmed)
    const normalizedInput = passKey.trim().toLowerCase();
    const normalizedConfirmation = confirmation.trim().toLowerCase();

    if (normalizedInput !== normalizedConfirmation) {
      setError(`Please type "${confirmation}" exactly to confirm deletion.`);
      return;
    }

    // If validation passes, execute the function
    try {
      await onFunction();
    } catch (err) {
      setError("Failed to proceed with deletion. Please try again.");
      console.error(err);
    }
  };

  const isInputValid =
    passKey.trim().toLowerCase() === confirmation.trim().toLowerCase();

  return (
    <Card className="w-full border border-red-200">
      <CardHeader className="pb-4 border-b bg-red-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <ShieldAlert className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-red-800">
              Confirm Deletion
            </CardTitle>
            <p className="text-sm text-red-600">
              Type the confirmation text to proceed
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            This action cannot be undone. This will permanently delete the item
            and remove all associated data.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="confirmation-input" className="text-sm font-medium">
              Type{" "}
              <span className="font-mono bg-gray-100 px-2 py-1 rounded border">
                {confirmation}
              </span>{" "}
              to confirm:
            </Label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="confirmation-input"
                placeholder={`Type "${confirmation}" here...`}
                onChange={(e) => setPassKey(e.target.value)}
                value={passKey}
                className={`pl-10 ${
                  error
                    ? "border-red-300 bg-red-50 focus-visible:ring-red-500"
                    : isInputValid
                      ? "border-green-300 bg-green-50 focus-visible:ring-green-500"
                      : ""
                }`}
                autoComplete="off"
                spellCheck="false"
              />
              {isInputValid && !error && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="flex items-center gap-1 text-green-600">
                    <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {error}
              </p>
            )}

            {isInputValid && !error && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <Check className="h-3 w-3" />
                Confirmation text matches. You may proceed.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Required action:</span>
            </div>
            <code className="text-sm font-mono bg-white px-3 py-1 rounded border">
              Type: {confirmation}
            </code>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setOnOpen(0)}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>

          <Button
            onClick={handleProceed}
            disabled={!isInputValid}
            className="gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Check className="h-4 w-4" />
            Confirm & Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfirmDelete;
