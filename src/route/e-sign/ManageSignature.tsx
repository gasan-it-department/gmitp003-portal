import {} from "react";
import { useAuth } from "@/provider/ProtectedRoute";

import { Button } from "@/components/ui/button";

const ManageSignature = () => {
  const auth = useAuth();

  return <div className="flex-1"></div>;
};

export default ManageSignature;
