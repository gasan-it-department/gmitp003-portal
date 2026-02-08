import { memo, useState, useRef } from "react";
import {
  //useFieldArray,
  type Control,
  type UseFormWatch,
  type UseFormSetValue,
} from "react-hook-form";
//
import {
  FormControl,
  FormField,
  FormMessage,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Modal from "@/components/custom/Modal";
import { ButtonGroup } from "@/components/ui/button-group";
//icons
import { Trash, Paperclip, File, X, Folder } from "lucide-react";

interface Props {
  no: number;
  handleRemoveRequirement: (index: number) => void;
  control: Control<{
    positions: {
      desc: string;

      requirements: {
        title: string;
        assets: File[];
      }[];
    };
  }>;
  watch: UseFormWatch<{
    positions: {
      desc: string;
      requirements: {
        title: string;
        assets: File[];
      }[];
    };
  }>;
  setValue: UseFormSetValue<{
    positions: {
      desc: string;
      requirements: {
        title: string;
        assets: File[];
      }[];
    };
  }>;
}

const ApplicationReqAsset = ({
  no,
  control,
  watch,
  setValue,
  handleRemoveRequirement,
}: Props) => {
  const [onOpen, setOnOpen] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const assets = watch(`positions.requirements.${no}.assets`) || [];
  const handleFileAdd = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const currentAssets = assets;
      const newFiles = Array.from(files);
      setValue(`positions.requirements.${no}.assets`, [
        ...currentAssets,
        ...newFiles,
      ]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (fileIndex: number) => {
    const currentAssets = assets;
    const updatedAssets = currentAssets.filter(
      (_, index) => index !== fileIndex,
    );
    setValue(`positions.requirements.${no}.assets`, updatedAssets);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full p-4 border rounded-lg bg-white mt-2 border-neutral-300 shadow-sm">
      <FormField
        name={`positions.requirements.${no}.title`}
        control={control}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">{no + 1}.</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter instruction/requirement title"
                {...field}
                className="mt-1"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {assets.length > 0 && (
        <div className="mt-4">
          <FormLabel className="text-sm font-medium">Attached Files</FormLabel>
          <div className="mt-2 space-y-2">
            {assets.map((file, fileIndex) => (
              <div
                key={fileIndex}
                className="flex items-center justify-between p-2 border border-neutral-200 rounded bg-neutral-50"
              >
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4 text-neutral-500" />
                  <span className="text-sm truncate max-w-[200px]">
                    {file.name}
                  </span>
                  <span className="text-xs text-neutral-500">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFile(fileIndex)}
                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileAdd}
        multiple
        className="hidden"
        accept="*/*"
      />

      <div className="w-full mt-4 flex justify-end gap-2">
        <ButtonGroup>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={triggerFileInput}
            className="hover:border-neutral-400 border cursor-pointer gap-2"
          >
            <Paperclip className="h-4 w-4" />
            Attach Files
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setOnOpen(1)}
            className="hover:border-neutral-400 border cursor-pointer gap-2"
          >
            <Folder className="h-4 w-4" />
            Line Assets
          </Button>
        </ButtonGroup>

        <Button
          type="button"
          onClick={() => handleRemoveRequirement(no)}
          size="sm"
          variant="destructive"
          className="hover:border-neutral-400 border cursor-pointer gap-2"
        >
          <Trash className="h-4 w-4" />
          Remove
        </Button>
      </div>

      <Modal
        title=""
        children={undefined}
        onOpen={onOpen === 1}
        className=" min-w-4xl"
        setOnOpen={() => setOnOpen(0)}
        cancelTitle="Close"
      />
    </div>
  );
};

export default memo(ApplicationReqAsset);
