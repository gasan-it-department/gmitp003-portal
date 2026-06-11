import { useSearchParams, useParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";

import EmployeeSearch from "@/layout/human_resources/EmployeeSearch";
import EmployeeList from "@/layout/human_resources/EmployeeList";

const Employee = () => {
  const [params, setParams] = useSearchParams({
    page: "1",
    office: "all",
    year: "all",
    sgFrom: "",
    sgTo: "",
    query: "",
  });

  const currentPage = params.get("page") || "1";
  const currentOffice = params.get("office") || "all";
  const currentYear = params.get("year") || "all";
  const currentSgFrom = params.get("sgFrom") || "";
  const currentSgTo = params.get("sgTo") || "";
  const currentQuery = params.get("query") || "";

  const { lineId } = useParams();
  const auth = useAuth();

  const handleChangeParams = (key: string, value: string) => {
    setParams(
      (prev) => {
        prev.set(key, value);
        return prev;
      },
      { replace: true },
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <EmployeeSearch
        handleChangeParams={handleChangeParams}
        office={currentOffice}
        page={currentPage}
        year={currentYear}
        sgFrom={currentSgFrom}
        sgTo={currentSgTo}
        query={currentQuery}
      />
      <div className="flex-1 min-h-0 p-3">
        <EmployeeList
          office={currentOffice}
          page={currentPage}
          year={currentYear}
          sgFrom={currentSgFrom}
          sgTo={currentSgTo}
          query={currentQuery}
          auth={auth}
          lineId={lineId}
        />
      </div>
    </div>
  );
};

export default Employee;
