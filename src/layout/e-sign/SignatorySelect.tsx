import { useState } from "react";
import { useDebounce } from "use-debounce";
//
import Modal from "@/components/custom/Modal";
//import { Button } from "@/components/ui/button";
import SignatoryList from "./SignatoryList";
//
import { Search } from "lucide-react";

const SignatorySelect = () => {
  const [onOpen, setOnOpen] = useState(0);
  const [searchTerm] = useState("");
  const [] = useDebounce(searchTerm, 1000);
  return (
    <div className=" w-full h-full">
      <div className=" w-full p-2">
        <button
          className="w-full p-2 border bg-white rounded cursor-text"
          onClick={() => setOnOpen(1)}
        >
          <Search className=" text-gray-600" />
        </button>
      </div>
      <Modal
        title={undefined}
        children={<SignatoryList lineId={""} token={""} userId={""} />}
        onOpen={onOpen === 1}
        className={""}
        setOnOpen={() => setOnOpen(0)}
      />
    </div>
  );
};

export default SignatorySelect;
