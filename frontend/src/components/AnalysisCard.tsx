import { Link } from "react-router-dom";
import type { Analysis } from "../types";

interface Props {
  analysis: Analysis;
  onDelete: (id: number) => void;
}

const STATUS_STYLES: Record<string, string> = {
  pending:    "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  processing: "bg-blue-500/10  text-blue-400  border-blue-500/30",
  done:       "bg-teal-500/10  text-teal-400  border-teal-500/30",
  failed:     "bg-red-500/10   text-red-400   border-red-500/30",
};

const STATUS_DOT: Record<string, string> = {
  pending:    "bg-yellow-400",
  processing: "bg-blue-400 animate-pulse",
  done:       "bg-teal-400",
  failed:     "bg-red-400",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function truncate(s: string, n = 32) {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

export default function AnalysisCard({ analysis, onDelete }: Props) {
  const isImage = analysis.media_type === "image";

  return (
    <div className="card hover:border-surface-3 transition-colors group">
      {/* Thumbnail */}
      <div className="w-full h-36 rounded-lg overflow-hidden bg-surface-2 mb-4 flex items-center justify-center">
        {analysis.original_url && isImage ? (
          <img
            src={analysis.original_url}
            alt={analysis.filename}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-600">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isImage ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.862v6.276a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              )}
            </svg>
            <span className="text-xs">{isImage ? "Image" : "Video"}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-gray-200 leading-tight">
            {truncate(analysis.filename)}
          </p>
          <span className={`badge border shrink-0 ${STATUS_STYLES[analysis.status]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[analysis.status]}`} />
            {analysis.status}
          </span>
        </div>

        {analysis.status === "done" && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-surface-2 rounded-lg p-2">
              <p className="text-gray-500 mb-0.5">Detections</p>
              <p className="font-mono font-semibold text-teal-400">{analysis.detections_count}</p>
            </div>
            <div className="bg-surface-2 rounded-lg p-2">
              <p className="text-gray-500 mb-0.5">Confidence</p>
              <p className="font-mono font-semibold text-teal-400">
                {(analysis.avg_confidence * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        )}

        {analysis.status === "failed" && (
          <p className="text-xs text-red-400 bg-red-500/10 rounded-lg p-2 truncate">
            {analysis.error_message || "Processing failed"}
          </p>
        )}

        <p className="text-xs text-gray-600">{formatDate(analysis.created_at)}</p>

        <div className="flex gap-2 pt-1">
          {analysis.status === "done" ? (
            <Link to={`/results/${analysis.id}`} className="btn-primary flex-1 text-xs py-2">
              View Results
            </Link>
          ) : analysis.status === "processing" || analysis.status === "pending" ? (
            <Link to={`/results/${analysis.id}`} className="btn-ghost flex-1 text-xs py-2 border border-surface-3">
              View Status
            </Link>
          ) : null}
          <button
            onClick={() => onDelete(analysis.id)}
            className="btn-ghost px-2.5 py-2 text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
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
