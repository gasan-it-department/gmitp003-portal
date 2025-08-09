import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
//components and layouts
import EmployeeSearch from "@/layout/human_resources/EmployeeSearch";
import EmployeeList from "@/layout/human_resources/EmployeeList";
import { Button } from "@/components/ui/button";
import { useDebouncedCallback } from "use-debounce";
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

  const handleChangeParams = (key: string, value: string) => {
    setParams(
      (prev) => {
        prev.set(key, value);
        return prev;
      },
      {
        replace: true,
      }
    );
  };

  const debounce = useDebouncedCallback((value: string) => {
    handleChangeParams("query", value);
  }, 1000);

  const handleSearch = (value: string) => {
    debounce(value);
  };

  return (
    <div className=" w-full h-full ">
      <div className=" w-full h-[15%]">
        <EmployeeSearch
          office={currentOffice}
          page={currentPage}
          year={currentYear}
          sgFrom={currentSgFrom}
          sgTo={currentSgTo}
          query={currentQuery}
        />
      </div>

      <div className=" w-full h-[75%] overflow-auto">
        <EmployeeList
          office={currentOffice}
          page={currentPage}
          year={currentYear}
          sgFrom={currentSgFrom}
          sgTo={currentSgTo}
          query={currentQuery}
        />
      </div>
      <div className=" w-full h-[10%] flex items-center justify-center gap-2">
        <Button size="sm" variant="outline">
          Prev
        </Button>
        <Button size="sm" variant="outline">
          1
        </Button>
        <Button size="sm" variant="outline">
          2
        </Button>
        <Button size="sm" variant="outline">
          3
        </Button>
        <Button size="sm" variant="outline">
          Next
        </Button>
      </div>
    </div>
  );
};

export default Employee;
