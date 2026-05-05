import { useState } from "react";
import { useMutation, type QueryClient } from "@tanstack/react-query";

//
import { Button } from "@/components/ui/button";
import Modal from "@/components/custom/Modal";
import {
  Select,
  SelectItem,
  SelectContent,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";
import { toast } from "sonner";
//
import type { MedicineStock } from "@/interface/data";
//
import { AlertTriangle, Trash } from "lucide-react";
import { formatPureDate } from "@/utils/date";
import { removeStock } from "@/db/statements/supply";

interface Props {
  stocks: MedicineStock[];
  token: string;
  userId: string;
  id: string;
  queryClient: QueryClient;
  storageId: string;
}

const CollapseMedicineStock = ({
  stocks,
  token,
  userId,
  id,
  queryClient,
  storageId,
}: Props) => {
  const [selected, setSelected] = useState("");
  const [isOpen, setIsOpen] = useState(0);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: () => removeStock(token, id, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["medStorage-list", storageId],
      });
      setIsOpen(0);
    },
    onError: (error) => {
      toast.error("FAILED TO SUBMIT", {
        description: error.message,
      });
    },
  });

  return (
    <>
      <Button
        className="w-full justify-start gap-2 h-9 text-sm"
        size="sm"
        variant="destructive"
        onClick={() => setIsOpen(1)}
      >
        <Trash className="h-3.5 w-3.5" />
        Remove
      </Button>

      <Modal
        title="Remove Medicine"
        onOpen={isOpen === 1}
        setOnOpen={() => setIsOpen(0)}
        className="max-w-md"
        footer={1}
        loading={false}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800">
                Warning: Destructive Action
              </p>
              <p className="text-sm text-red-600 mt-0.5">
                This will permanently delete all stock data associated with this
                medicine.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">
              You are about to collapse:
            </h4>
          </div>

          <Select value={selected} onValueChange={(e) => setSelected(e)}>
            <SelectTrigger className=" w-full">
              <SelectValue placeholder="Select stock" />
            </SelectTrigger>
            <SelectContent>
              {stocks.map((stock) => (
                <SelectItem value={stock.id}>
                  <div>
                    <p>
                      Quality: {stock.actualStock} | Unit: {stock.perQuantity}/
                      {stock.quality} - Exp:{" "}
                      {formatPureDate(stock.expiration as string)}
                    </p>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              This action cannot be undone. All stock records, expiration dates,
              and quantity data will be permanently deleted.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(0)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                if (isPending) return;
                mutateAsync();
              }}
            >
              Remove Medicine
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default CollapseMedicineStock;
