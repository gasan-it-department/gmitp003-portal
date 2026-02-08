//import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
//components and layouts
import EmployeeSearch from "@/layout/human_resources/EmployeeSearch";
import EmployeeList from "@/layout/human_resources/EmployeeList";
//import { Button } from "@/components/ui/button";
//import { useDebouncedCallback } from "use-debounce";
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

  const handleChangeParams = (key: string, value: string) => {
    setParams(
      (prev) => {
        prev.set(key, value);
        return prev;
      },
      {
        replace: true,
      },
    );
  };

  // const debounce = useDebouncedCallback((value: string) => {
  //   handleChangeParams("query", value);
  // }, 1000);

  // const handleSearch = (value: string) => {
  //   debounce(value);
  // };

  const auth = useAuth();

  return (
    <div className=" w-full h-full ">
      <div className=" w-full h-[15%]">
        <EmployeeSearch
          handleChangeParams={handleChangeParams}
          office={currentOffice}
          page={currentPage}
          year={currentYear}
          sgFrom={currentSgFrom}
          sgTo={currentSgTo}
          query={currentQuery}
        />
      </div>

      <div className=" w-full h-[85%] overflow-auto ">
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
