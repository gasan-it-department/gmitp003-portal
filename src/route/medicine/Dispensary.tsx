import { useState } from "react";

//
import DispensaryPrescription from "@/layout/medicine/DispensaryPrescription";
import DispensaryMedicine from "@/layout/medicine/DispensaryMedicine";

//interface
interface Props {
  id: string | undefined;
  token: string | undefined;
  userId: string;
}
const Dispensary = ({ id, token, userId }: Props) => {
  const [status, setStatus] = useState(0);
  return (
    <div className=" w-full h-full lg:flex">
      <div className=" w-1/2 h-full p-2 border border-y-0 border-l-0 border-neutral-400">
        <DispensaryPrescription id={id} token={token} setStatus={setStatus} />
      </div>
      <div className=" w-1/2 h-full p-2">
        <DispensaryMedicine
          id={id}
          token={token}
          userId={userId}
          status={status}
        />
      </div>
    </div>
  );
};

export default Dispensary;
