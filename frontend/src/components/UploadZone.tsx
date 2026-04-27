import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useLang } from "../contexts/LangContext";

interface Props { onUpload: (file: File) => void; uploading: boolean; }

const ACCEPTED = {
  "image/*": [".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"],
  "video/*": [".mp4", ".mov", ".avi", ".mkv", ".webm"],
  "application/vnd.oasis.opendocument.text": [".odt"],
};

export default function UploadZone({ onUpload, uploading }: Props) {
  const { t } = useLang();
  const [dragError, setDragError] = useState("");

  const onDrop = useCallback((accepted: File[], rejected: any[]) => {
    setDragError("");
    if (rejected.length > 0) { setDragError(t.upload.unsupported); return; }
    if (accepted[0]) onUpload(accepted[0]);
  }, [onUpload, t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: ACCEPTED, multiple: false, disabled: uploading, maxSize: 500 * 1024 * 1024,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`relative rounded-2xl border-2 border-dashed p-14 text-center cursor-pointer select-none transition-all duration-200 ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
        style={{
          borderColor: isDragActive ? "var(--fg)" : "var(--line)",
          backgroundColor: isDragActive ? "var(--fg4)" : "transparent",
        }}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-5">
          {uploading ? (
            <>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "var(--fg4)" }}>
                <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "var(--line)", borderTopColor: "var(--fg)" }} />
              </div>
              <p className="text-fg2 font-medium">{t.upload.uploading}</p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-colors" style={{ backgroundColor: "var(--fg4)" }}>
                <svg className="w-6 h-6" style={{ color: "var(--fg2)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-fg">{t.upload.drag}</p>
                <p className="mt-1.5 text-sm text-fg3">{t.upload.hint}</p>
              </div>
              <div className="flex gap-2 font-mono text-xs text-fg3 flex-wrap justify-center">
                {["JPG", "PNG", "MP4", "MOV", "ODT"].map((f) => (
                  <span key={f} className="px-2.5 py-1 rounded-lg border" style={{ borderColor: "var(--line)" }}>{f}</span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      {dragError && <p className="mt-2 text-sm text-red-500 text-center">{dragError}</p>}
    </div>
  );
}
