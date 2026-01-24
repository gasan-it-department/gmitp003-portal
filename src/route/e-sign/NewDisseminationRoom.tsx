import { useState } from "react";
import { useNavigate, useParams } from "react-router";

//
import { Button } from "@/components/ui/button";
import SignatorySelect from "@/layout/e-sign/SignatorySelect";

const NewDisseminationRoom = () => {
  const [step, set] = useState(0);
  const nav = useNavigate();
  const { newRoomId } = useParams();

  const screen = [<SignatorySelect />];
  return (
    <main className=" w-full h-full overflow-auto">
      <div className=" w-full h-[90%]">{screen[step]}</div>
      <div className="">
        <Button size="sm" onClick={() => nav(`file`)}>
          Set up Document
        </Button>
      </div>
    </main>
  );
};

export default NewDisseminationRoom;
