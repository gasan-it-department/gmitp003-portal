import { memo, useState } from "react";

//utils
import { formatDate } from "@/utils/date";
import { medicineLogsMessage, medicineLogsActionStyle } from "@/utils/helper";
//
import { TableRow, TableCell } from "@/components/ui/table";
import Modal from "@/components/custom/Modal";
//
import type { MedicineLogs } from "@/interface/data";

interface Props {
  item: MedicineLogs;
  no: number;
}

const ActionBadge = ({ action }: { action: number }) => {
  const label = medicineLogsMessage[action] ?? "Unknown";
  const style =
    medicineLogsActionStyle[action] ?? {
      bg: "bg-gray-100",
      text: "text-gray-700",
    };
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${style.bg} ${style.text}`}
    >
      {label}
    </span>
  );
};

const MedicineLogsItems = ({ item, no }: Props) => {
  const [onOpen, setOnOpen] = useState(0);
  return (
    <>
      <TableRow
        onClick={() => setOnOpen(1)}
        className="cursor-pointer hover:bg-gray-50"
      >
        <TableCell className="font-medium">{no + 1}</TableCell>
        <TableCell>
          <ActionBadge action={item.action} />
        </TableCell>
        <TableCell className="max-w-60 truncate">{item.message}</TableCell>
        <TableCell className="font-medium">
          {item.user?.username ?? (
            <span className="text-gray-400 italic">unknown</span>
          )}
        </TableCell>
        <TableCell className="text-gray-600">
          {formatDate(item.timestamp)}
        </TableCell>
      </TableRow>

      <Modal
        title="Activity Details"
        children={
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <h4 className="text-sm font-medium text-gray-500 mb-1">
                Description
              </h4>
              <p className="text-gray-900 break-words">{item.message}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">User</h4>
                <p className="text-gray-900 font-medium">
                  {item.user?.username ?? "Unknown"}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">
                  Action
                </h4>
                <ActionBadge action={item.action} />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Date</h4>
                <p className="text-gray-900">{formatDate(item.timestamp)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">
                  Entry #{no + 1}
                </h4>
                <p className="text-gray-900 font-mono text-xs">
                  ID: {item.id.slice(-8)}
                </p>
              </div>
            </div>
          </div>
        }
        onOpen={onOpen === 1}
        className="max-w-md"
        cancelTitle="Close"
        setOnOpen={() => {
          setOnOpen(0);
        }}
      />
    </>
  );
};

export default memo(MedicineLogsItems);
