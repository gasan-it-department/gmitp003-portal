import { useQuery } from "@tanstack/react-query";

import { dashboardReport } from "@/db/statement";
import { getCookie } from "@/utils/cookies";

//
import type { DashboardOverall } from "@/interface/data";

const Dashboard = () => {
  const token = getCookie("auth_admin_token");
  const { data, error } = useQuery<DashboardOverall>({
    queryFn: () => dashboardReport(token),
    queryKey: ["dashboard-report", token],
    enabled: !!token,
  });

  console.log(data);
  console.log({ error });

  if (!data) {
    return;
  }

  return (
    <div className=" w-full h-full grid grid-cols-2 grid-rows-2">
      <div className=" col-span-1 ">
        <div className=" w-full grid grid-cols-2 p-10 gap-1">
          <p className=" font-medium text-xl">Accounts:</p>
          <p className=" font-medium text-xl">{data.accounts}</p>
          <p className=" font-medium text-xl">Line/s:</p>
          <p className=" font-medium text-xl">{data.lines}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
