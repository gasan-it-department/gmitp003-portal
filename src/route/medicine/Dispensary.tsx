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
    <div className="w-full h-full flex flex-col lg:flex-row bg-gray-50">
      {/* Prescription Section */}
      <div className="w-full lg:w-1/2 h-full lg:h-full p-3 lg:p-4">
        <div className="h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="h-full overflow-auto">
            <DispensaryPrescription
              id={id}
              token={token}
              setStatus={setStatus}
            />
          </div>
        </div>
      </div>

      {/* Medicine Section */}
      <div className="w-full lg:w-1/2 h-full lg:h-full p-3 lg:p-4 lg:pl-0">
        <div className="h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="h-full overflow-auto">
            <DispensaryMedicine
              id={id}
              token={token}
              userId={userId}
              status={status}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dispensary;
