import { memo, useState } from "react";

//utils
import { formatDate } from "@/utils/date";
import { medicineLogsMessage } from "@/utils/helper";
//
import { TableRow, TableCell } from "@/components/ui/table";
import Modal from "@/components/custom/Modal";
//
import type { MedicineLogs } from "@/interface/data";

interface Props {
  item: MedicineLogs;
  no: number;
}

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
          <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
            {medicineLogsMessage[item.action]}
          </span>
        </TableCell>
        <TableCell className="max-w-60 truncate">{item.message}</TableCell>
        <TableCell className="font-medium">{item.user.username}</TableCell>
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
              <p className="text-gray-900">{item.message}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">User</h4>
                <p className="text-gray-900 font-medium">
                  {item.user.username}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">
                  Action
                </h4>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                  {medicineLogsMessage[item.action]}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Date</h4>
                <p className="text-gray-900">{formatDate(item.timestamp)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">
                  Entry #{no + 1}
                </h4>
                <p className="text-gray-900 font-mono">
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
