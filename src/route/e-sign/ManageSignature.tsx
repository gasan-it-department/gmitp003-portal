import {} from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";

//
import { usersSignature } from "@/db/statements/document";

//import { Button } from "@/components/ui/button";
//import SignatureItems from "@/layout/e-sign/item/SignatureItems";
//
import type { Signature } from "@/interface/data";

interface ListProps {
  list: Signature[];
  hasMore: boolean;
  lastCursor: string | null;
}

const ManageSignature = () => {
  const auth = useAuth();

  const {} = useInfiniteQuery<ListProps>({
    queryKey: ["user-signature", auth.userId],
    queryFn: ({ pageParam }) =>
      usersSignature(
        auth.token as string,
        auth.userId as string,
        pageParam as string | null,
        "20",
        "",
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  return <div className="w-full h-full bg-amber-300"></div>;
};

export default ManageSignature;
