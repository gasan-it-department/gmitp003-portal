import React from "react";
import { useParams } from "react-router";
import { useAuth } from "./ProtectedRoute";
import { lineData } from "@/db/statements/line";
import { useQuery } from "@tanstack/react-query";
import { LineContext } from "@/hooks/useLine";

//
import type { LineProps } from "@/interface/data";

const LineProvider = ({ children }: { children: React.ReactNode }) => {
  const { lineId } = useParams();
  const { token } = useAuth();
  const { data } = useQuery<LineProps>({
    queryKey: ["line"],
    queryFn: () => lineData(token, lineId),

    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  return (
    <LineContext.Provider value={{ line: data }}>
      {children}
    </LineContext.Provider>
  );
};

export default LineProvider;
