import { memo } from "react";
import { useNavigate } from "react-router";
//
import type { MedicineStorage } from "@/interface/data";
import { Package, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
//import { Badge } from "@/components/ui/badge";

interface Props {
  item: MedicineStorage;
}

const StorageItem = ({ item }: Props) => {
  const nav = useNavigate();

  return (
    <Card
      className="group cursor-pointer hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-blue-200 overflow-hidden"
      onClick={() => nav(`storage/${item.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Header with icon and name */}
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 group-hover:from-blue-600 group-hover:to-blue-700 transition-colors">
                <Package className="h-3.5 w-3.5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm truncate">
                {item.name}
              </h3>
            </div>

            {/* Reference Number */}
            <div className="flex items-center gap-1.5 mb-2">
              <MapPin className="h-3 w-3 text-gray-400" />
              <p className="text-xs font-mono text-gray-500">
                Ref: {item.refNumber || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default memo(StorageItem);
