import { useState } from "react";

//icons
import { CloudAlert } from "lucide-react";

import { TableRow, TableCell } from "@/components/ui/table";
import Modal from "@/components/custom/Modal";

//interface and props
interface Props {
  colSpan: number;
  message?: string;
}

const SWWItem = ({ colSpan, message }: Props) => {
  const [onOpen, setOnOpen] = useState(false);
  return (
    <>
      <TableRow>
        <TableCell
          colSpan={colSpan}
          className="text-center hover:bg-neutral-200"
        >
          {/* Container div for flex alignment */}
          <div
            className="flex items-center justify-center gap-2 cursor-pointer"
            onClick={() => setOnOpen(true)}
          >
            <span>{message || "An error occured! Click for more"}</span>
            <CloudAlert className="h-4 w-4" />{" "}
            {/* Explicit sizing is often good practice */}
          </div>
        </TableCell>
      </TableRow>

      <Modal
        title={"Something went wrong!"}
        children={
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              We couldn't load the data
            </p>
            <div>
              <p className=" font-mono text-sm">- Check internet connection</p>
              <p className=" font-mono text-sm">
                - Refresh the page and try again
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              If the problem persists, please contact support.
            </p>
          </div>
        }
        onOpen={onOpen}
        className={""}
        setOnOpen={() => setOnOpen(false)}
        cancelTitle="Close"
      />
    </>
  );
};

export default SWWItem;
