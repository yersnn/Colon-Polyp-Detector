import { Link } from "react-router-dom";
import { mediaUrl } from "../api/client";
import type { Analysis } from "../types";

interface Props {
  analysis: Analysis;
  onDelete: (id: number) => void;
}

const STATUS_STYLES: Record<string, string> = {
  pending:    "bg-black/5  text-black/50 border-black/10",
  processing: "bg-black/8  text-black/70 border-black/15",
  done:       "bg-black    text-white    border-black",
  failed:     "bg-red-50   text-red-600  border-red-200",
};

const STATUS_DOT: Record<string, string> = {
  pending:    "bg-black/30",
  processing: "bg-black/60 animate-pulse",
  done:       "bg-white",
  failed:     "bg-red-500",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function truncate(s: string, n = 28) {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

export default function AnalysisCard({ analysis, onDelete }: Props) {
  const isImage = analysis.media_type === "image";

  return (
    <div className="card hover:shadow-lg transition-shadow duration-200 group p-0 overflow-hidden">
      {/* Thumbnail */}
      <div className="w-full h-40 bg-black/5 flex items-center justify-center overflow-hidden">
        {analysis.original_url && isImage ? (
          <img
            src={mediaUrl(analysis.original_url)}
            alt={analysis.filename}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-black/20">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isImage ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.862v6.276a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              )}
            </svg>
            <span className="text-xs font-medium">{isImage ? "Image" : "Video"}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-black leading-tight">
            {truncate(analysis.filename)}
          </p>
          <span className={`badge border shrink-0 ${STATUS_STYLES[analysis.status]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[analysis.status]}`} />
            {analysis.status}
          </span>
        </div>

        {analysis.status === "done" && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-black/4 rounded-xl p-3">
              <p className="text-black/40 mb-0.5 font-medium">Detections</p>
              <p className="font-mono font-bold text-black text-base">{analysis.detections_count}</p>
            </div>
            <div className="bg-black/4 rounded-xl p-3">
              <p className="text-black/40 mb-0.5 font-medium">Confidence</p>
              <p className="font-mono font-bold text-black text-base">
                {(analysis.avg_confidence * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        )}

        {analysis.status === "failed" && (
          <p className="text-xs text-red-500 bg-red-50 rounded-xl p-2.5 truncate border border-red-100">
            {analysis.error_message || "Processing failed"}
          </p>
        )}

        <p className="text-xs text-black/30 font-mono">{formatDate(analysis.created_at)}</p>

        <div className="flex gap-2 pt-0.5">
          {(analysis.status === "done" || analysis.status === "processing" || analysis.status === "pending") && (
            <Link
              to={`/results/${analysis.id}`}
              className={`flex-1 text-center text-xs py-2.5 rounded-xl font-semibold transition-colors duration-150
                ${analysis.status === "done"
                  ? "bg-black text-white hover:bg-black/80"
                  : "bg-black/5 text-black/60 hover:bg-black/10 border border-black/10"
                }`}
            >
              {analysis.status === "done" ? "View Results" : "View Status"}
            </Link>
          )}
          <button
            onClick={() => onDelete(analysis.id)}
            className="px-3 py-2.5 rounded-xl text-black/25 hover:text-red-500 hover:bg-red-50 transition-colors duration-150"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
