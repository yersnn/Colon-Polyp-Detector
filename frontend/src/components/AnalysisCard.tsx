import { Link } from "react-router-dom";
import { mediaUrl } from "../api/client";
import { useLang } from "../contexts/LangContext";
import type { Analysis } from "../types";

interface Props { analysis: Analysis; onDelete: (id: number) => void; }

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string; dot: string; anim?: string }> = {
  pending:    { bg: "rgba(234,179,8,0.1)",  text: "#ca8a04", border: "rgba(234,179,8,0.25)",  dot: "#eab308" },
  processing: { bg: "rgba(59,130,246,0.1)", text: "#3b82f6", border: "rgba(59,130,246,0.25)", dot: "#3b82f6", anim: "animate-pulse" },
  done:       { bg: "rgba(34,197,94,0.1)",  text: "#16a34a", border: "rgba(34,197,94,0.25)",  dot: "#22c55e" },
  failed:     { bg: "rgba(239,68,68,0.1)",  text: "#dc2626", border: "rgba(239,68,68,0.25)",  dot: "#ef4444" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function truncate(s: string, n = 26) { return s.length > n ? `${s.slice(0, n)}…` : s; }

export default function AnalysisCard({ analysis, onDelete }: Props) {
  const { t } = useLang();
  const isImage = analysis.media_type === "image";
  const st = STATUS_STYLE[analysis.status] ?? STATUS_STYLE.pending;

  return (
    <div className="rounded-2xl overflow-hidden transition-shadow duration-200 hover:shadow-lg"
         style={{ backgroundColor: "var(--surface)", border: "1px solid var(--line)" }}>

      {/* Thumbnail */}
      <div className="w-full h-40 flex items-center justify-center overflow-hidden"
           style={{ backgroundColor: "var(--fg4)" }}>
        {analysis.original_url && isImage ? (
          <img src={mediaUrl(analysis.original_url)} alt={analysis.filename} className="w-full h-full object-cover" />
        ) : (
          <svg className="w-10 h-10" style={{ color: "var(--fg3)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isImage ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
                d="M15 10l4.553-2.069A1 1 0 0121 8.862v6.276a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            )}
          </svg>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Name + Status */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-tight" style={{ color: "var(--fg)" }}>
            {truncate(analysis.filename)}
          </p>
          <span className="badge shrink-0 text-[11px]"
                style={{ backgroundColor: st.bg, color: st.text, borderColor: st.border }}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.anim ?? ""}`} style={{ backgroundColor: st.dot }} />
            {t.status[analysis.status as keyof typeof t.status]}
          </span>
        </div>

        {/* Stats */}
        {analysis.status === "done" && (
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: t.card.detections, value: String(analysis.detections_count) },
              { label: t.card.confidence, value: `${(analysis.avg_confidence * 100).toFixed(1)}%` },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl p-2.5" style={{ backgroundColor: "var(--fg4)" }}>
                <p className="text-[11px] font-medium mb-0.5" style={{ color: "var(--fg3)" }}>{label}</p>
                <p className="font-mono font-bold text-base" style={{ color: "var(--fg)" }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {analysis.status === "failed" && (
          <p className="text-xs rounded-xl p-2.5 truncate" style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
            {analysis.error_message || t.upload.unsupported}
          </p>
        )}

        <p className="text-xs font-mono" style={{ color: "var(--fg3)" }}>{formatDate(analysis.created_at)}</p>

        {/* Actions */}
        <div className="flex gap-2 pt-0.5">
          {(analysis.status === "done" || analysis.status === "processing" || analysis.status === "pending") && (
            <Link
              to={`/results/${analysis.id}`}
              className="flex-1 text-center text-xs py-2.5 rounded-xl font-semibold transition-opacity duration-150 hover:opacity-80"
              style={
                analysis.status === "done"
                  ? { backgroundColor: "var(--btn-bg)", color: "var(--btn-fg)" }
                  : { backgroundColor: "var(--fg4)", color: "var(--fg2)", border: "1px solid var(--line)" }
              }
            >
              {analysis.status === "done" ? t.card.viewResults : t.card.viewStatus}
            </Link>
          )}
          <button
            onClick={() => onDelete(analysis.id)}
            className="px-3 py-2.5 rounded-xl transition-all duration-150"
            style={{ color: "var(--fg3)" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.08)"; e.currentTarget.style.color = "#ef4444"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--fg3)"; }}
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
