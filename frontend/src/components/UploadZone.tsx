import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

interface Props {
  onUpload: (file: File) => void;
  uploading: boolean;
}

const ACCEPTED = {
  "image/*": [".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"],
  "video/*": [".mp4", ".mov", ".avi", ".mkv", ".webm"],
};

export default function UploadZone({ onUpload, uploading }: Props) {
  const [dragError, setDragError] = useState("");

  const onDrop = useCallback(
    (accepted: File[], rejected: any[]) => {
      setDragError("");
      if (rejected.length > 0) {
        setDragError("Unsupported file type. Use JPG, PNG, MP4, MOV, etc.");
        return;
      }
      if (accepted[0]) onUpload(accepted[0]);
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    multiple: false,
    disabled: uploading,
    maxSize: 500 * 1024 * 1024,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          relative rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer
          transition-all duration-200 select-none
          ${isDragActive
            ? "border-teal-400 bg-teal-500/10 scale-[1.01]"
            : "border-surface-3 bg-surface/50 hover:border-teal-500/50 hover:bg-surface"
          }
          ${uploading ? "opacity-60 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-4">
          {uploading ? (
            <>
              <div className="w-12 h-12 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-300 font-medium">Uploading & analysing…</p>
            </>
          ) : (
            <>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors
                ${isDragActive ? "bg-teal-500/20" : "bg-surface-2"}`}>
                <svg className={`w-8 h-8 transition-colors ${isDragActive ? "text-teal-400" : "text-gray-400"}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>

              <div>
                <p className="text-base font-semibold text-gray-200">
                  {isDragActive ? "Drop to analyse" : "Drag & drop or click to upload"}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Images (JPG, PNG) or Videos (MP4, MOV) · up to 500 MB
                </p>
              </div>

              <div className="flex gap-2 text-xs text-gray-600">
                <span className="px-2 py-1 bg-surface-2 rounded">JPG</span>
                <span className="px-2 py-1 bg-surface-2 rounded">PNG</span>
                <span className="px-2 py-1 bg-surface-2 rounded">MP4</span>
                <span className="px-2 py-1 bg-surface-2 rounded">MOV</span>
              </div>
            </>
          )}
        </div>
      </div>

      {dragError && (
        <p className="mt-2 text-sm text-red-400 text-center">{dragError}</p>
      )}
    </div>
  );
}
