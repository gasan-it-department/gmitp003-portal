import { memo } from "react";
import { Download, File } from "lucide-react";
//
import { downloadFromLink, fileSizeConverter } from "@/utils/helper";

//interface/
interface Props<T> {
  file: T;
  no: number | undefined;
}

const DownloadableFileItem = ({ file, no }: Props<any>) => {
  return (
    <div
      className="w-full bg-white cursor-pointer hover:bg-gray-50 border border-gray-200 rounded-lg p-3 transition-all duration-150 group"
      onClick={() => downloadFromLink(file.fileUrl, file.fileName)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
            <File className="w-4 h-4 text-blue-600" />
          </div>

          <div>
            <p className="font-medium text-gray-900 text-sm">{file.fileName}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">
                {fileSizeConverter(file.fileSize)}
              </span>
              {no !== undefined && (
                <span className="text-xs text-gray-400">•</span>
              )}
              {no !== undefined && (
                <span className="text-xs text-gray-500">File {no + 1}</span>
              )}
            </div>
          </div>
        </div>

        <Download className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
      </div>
    </div>
  );
};

export default memo(DownloadableFileItem);
