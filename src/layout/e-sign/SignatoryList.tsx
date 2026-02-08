//import { useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
//import { useInView } from "react-intersection-observer";
//
import { signatoryList } from "@/db/statements/document";
//
interface Props {
  lineId: string;
  token: string;
  userId: string;
}
interface ListProps {
  list: any[];
  hasMore: boolean;
  lastCursor: string | null;
  query: string;
}

const SignatoryList = ({ lineId, token }: Props) => {
  const {} = useInfiniteQuery<ListProps>({
    queryKey: ["signatory-list", lineId],
    queryFn: ({ pageParam }) =>
      signatoryList(token, lineId, pageParam as string | null, "10", ""),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
  });
  return <div className="w-full">SignatoryList</div>;
};

export default SignatoryList;
