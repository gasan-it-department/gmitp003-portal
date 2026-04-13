import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";

//
import { documentRoute } from "@/db/statements/document";
//
import { Button } from "@/components/ui/button";
import SignatorySelect from "@/layout/e-sign/SignatorySelect";

//
import type { SignatureQueueRoom } from "@/interface/data";

const NewDisseminationRoom = () => {
  const auth = useAuth();
  const { roomId } = useParams();

  const { data, error } = useQuery<SignatureQueueRoom>({
    queryKey: ["document", "rooms"],
    queryFn: () => documentRoute(auth.token as string, roomId as string),
    enabled: !!auth.token && !!roomId,
  });
  console.log({ error, data });

  if (!data) return <div>data not found</div>;

  const [step] = useState(data.step === 0 ? 0 : data.step);
  const nav = useNavigate();

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
