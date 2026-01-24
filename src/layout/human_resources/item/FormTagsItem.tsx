import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

//props and interface
interface Props {
  item: { tag: string; cont: string };
  no: number;
  handleAddTags: (tag: string, cont: string) => void;
  handleCheckTags: (tag: string) => {
    res: boolean;
    index: number;
  };
}

const FormTagsItem = ({ item, no, handleAddTags, handleCheckTags }: Props) => {
  const isSelected = handleCheckTags(item.tag).res;

  return (
    <div
      className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected
          ? "border-green-500 bg-green-50 hover:bg-green-100"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
      }`}
      onClick={() => handleAddTags(item.tag, item.cont)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isSelected && (
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
            )}
            <span
              className={`font-medium text-sm ${
                isSelected ? "text-green-800" : "text-gray-800"
              }`}
            >
              {item.cont}
            </span>
          </div>
          <Badge
            variant="secondary"
            className={`text-xs ${
              isSelected
                ? "bg-green-200 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {item.tag}
          </Badge>
        </div>
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
            isSelected ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"
          }`}
        >
          {no}
        </div>
      </div>
    </div>
  );
};

export default memo(FormTagsItem);
