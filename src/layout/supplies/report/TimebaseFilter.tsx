import { useState, useEffect } from "react";

//
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

//
//schema/interface/props
//
import { ChevronsLeft, ChevronsRight } from "lucide-react";

interface Props {
  currentYear: string;
  setCurrentYear: React.Dispatch<React.SetStateAction<string>>;
}

const TimebaseFilter = ({ currentYear, setCurrentYear }: Props) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [displayMode, setDisplayMode] = useState(0); // 0 = single year, 1 = year range

  const getDisplayValue = () => {
    if (displayMode === 0) {
      // Single year mode
      return year.toString();
    } else {
      // Year range mode
      return `${year}-${year + 1}`;
    }
  };

  // Update parent when year or displayMode changes
  useEffect(() => {
    const displayValue = getDisplayValue();
    setCurrentYear(displayValue);
  }, [year, displayMode]);

  const handlePrevious = () => {
    if (displayMode === 0) {
      // Currently showing single year, switch to previous year range
      setYear((prev) => prev - 1);
      setDisplayMode(1); // Show as range
    } else {
      // Currently showing year range, switch to previous single year
      setDisplayMode(0); // Show as single year
      // Keep the year the same (start year of the range)
    }
  };

  const handleNext = () => {
    if (displayMode === 0) {
      // Currently showing single year, switch to next year range
      setDisplayMode(1); // Show as range
    } else {
      // Currently showing year range, switch to next single year
      setYear((prev) => prev + 1);
      setDisplayMode(0); // Show as single year
    }
  };

  // Initialize parent state on mount
  useEffect(() => {
    const displayValue = getDisplayValue();
    setCurrentYear(displayValue);
  }, []);

  return (
    <div className="w-full">
      <div className="flex gap-2 items-center justify-center mb-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          className="h-10 w-10 p-0"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        <Input
          value={currentYear}
          disabled
          className="w-40 text-center font-medium"
        />

        <Button
          variant="outline"
          onClick={handleNext}
          className="h-10 w-10 p-0"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default TimebaseFilter;
