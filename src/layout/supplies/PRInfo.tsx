//import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";

//layout and components
import { Button } from "@/components/ui/button";
//utils
import { formatDate } from "@/utils/date";
import { supplyOrderStatus, supplyOrderStatusTextColor } from "@/utils/helper";
//database and statements
import { getPurchaseInfo } from "@/db/statement";
//props and interfaces
import type { ProtectedRouteProps, SupplyBatchOrder } from "@/interface/data";
interface Props {
  purchaseReqId: string | undefined;
  auth: ProtectedRouteProps;
}

const PRInfo = ({ purchaseReqId, auth }: Props) => {
  const { data } = useQuery<SupplyBatchOrder>({
    queryKey: ["purchaseReq", purchaseReqId],
    queryFn: () =>
      getPurchaseInfo(auth.token as string, purchaseReqId as string),
    enabled: !!purchaseReqId,
  });
  console.log(data);

  if (!data) {
    return;
  }
  return (
    <div className=" w-full h-full">
      <div className=" w-full p-2 bg-white border border-neutral-300 rounded">
        <p className=" text-sm font-mono">
          Subject: <b>{data.title || "N/A"}</b>
        </p>
        <p className=" text-sm font-mono">
          Ref. Number: <b>{data.refNumber}</b>
        </p>
        <p className=" text-sm font-mono">
          Date filed: <b>{formatDate(data.timestamp)}</b>
        </p>
        <p className=" text-sm font-mono">
          Status:{" "}
          <b
            className={`text-${supplyOrderStatusTextColor[data.status]}`}
            style={{
              color: supplyOrderStatusTextColor[data.status],
            }}
          >
            {supplyOrderStatus[data.status]}
          </b>
        </p>
      </div>

      <div className=" w-full p-2 bg-white border border-neutral-300 rounded mt-2">
        <p className=" text-sm font-mono">
          Department: <b>{data.title || "N/A"}</b>
        </p>
        <p className=" text-sm font-mono">
          Section: <b>{data.refNumber}</b>
        </p>
        <p className=" text-sm font-mono">
          E-Signed: <b>NO</b>
        </p>
      </div>

      <div className=" w-full p-2 bg-white border border-neutral-300 rounded mt-2">
        <Button variant="outline" size="sm"></Button>
      </div>
    </div>
  );
};

export default PRInfo;
