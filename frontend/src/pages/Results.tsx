import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { analysisApi, BASE_URL, mediaUrl } from "../api/client";
import Navbar from "../components/Navbar";
import { useLang } from "../contexts/LangContext";
import type { Analysis } from "../types";

type View = "original" | "processed";
const POLL_MS = 2500;

export default function Results() {
  const { id }   = useParams<{ id: string }>();
  const { t }    = useLang();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [view, setView]         = useState<View>("processed");
  const [error, setError]       = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = async () => {
    try {
      const { data } = await analysisApi.get(Number(id));
      setAnalysis(data);
      return data;
    } catch {
      setError(t.results.notFound);
      return null;
    }
  };

  useEffect(() => {
    load().then((data) => {
      if (!data) return;
      if (data.status === "pending" || data.status === "processing") {
        pollRef.current = setInterval(async () => {
          const updated = await load();
          if (updated && updated.status !== "pending" && updated.status !== "processing")
            clearInterval(pollRef.current!);
        }, POLL_MS);
      }
    });
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [id]);

  if (error) return (
    <div className="min-h-screen bg-page">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <p className="text-fg3">{error}</p>
        <Link to="/dashboard" className="btn-ghost mt-6 inline-flex">{t.results.back}</Link>
      </div>
    </div>
  );

  if (!analysis) return (
    <div className="min-h-screen bg-page flex items-center justify-center">
      <div className="w-8 h-8 border-2 rounded-full animate-spin"
           style={{ borderColor: "var(--line)", borderTopColor: "var(--fg2)" }} />
    </div>
  );

  const isProcessing = analysis.status === "pending" || analysis.status === "processing";
  const isDone       = analysis.status === "done";
  const isImage      = analysis.media_type === "image";
  const displayUrl   = view === "processed" && analysis.processed_url
    ? analysis.processed_url : analysis.original_url;

  return (
    <div className="min-h-screen bg-page">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-fg3">
          <Link to="/dashboard" className="hover:text-fg transition-colors">{t.results.breadcrumb}</Link>
          <span>/</span>
          <span className="text-fg2 truncate max-w-xs">{analysis.filename}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Media viewer */}
          <div className="lg:col-span-2 space-y-3">
            {/* Toggle */}
            {isDone && (
              <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: "var(--fg4)" }}>
                {(["processed", "original"] as View[]).map((v) => (
                  <button key={v} onClick={() => setView(v)}
                    className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 capitalize"
                    style={
                      view === v
                        ? { backgroundColor: "var(--btn-bg)", color: "var(--btn-fg)" }
                        : { backgroundColor: "transparent", color: "var(--fg3)" }
                    }
                  >
                    {v === "processed" ? t.results.aiOutput : t.results.original}
                  </button>
                ))}
              </div>
            )}

            {/* Viewer */}
            <div className="relative rounded-2xl overflow-hidden aspect-video flex items-center justify-center"
                 style={{ backgroundColor: "var(--fg4)", border: "1px solid var(--line)" }}>
              {isProcessing && (
                <div className="flex flex-col items-center gap-5">
                  <div className="w-10 h-10 border-2 rounded-full animate-spin"
                       style={{ borderColor: "var(--line)", borderTopColor: "var(--fg2)" }} />
                  <div className="text-center">
                    <p className="font-semibold text-fg capitalize">{analysis.status}…</p>
                    <p className="text-sm text-fg3 mt-1">
                      {isImage ? t.results.processingImage : t.results.processingVideo}
                    </p>
                  </div>
                </div>
              )}

              {analysis.status === "failed" && (
                <div className="flex flex-col items-center gap-3 text-center px-6">
                  <svg className="w-10 h-10" style={{ color: "#ef4444" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold" style={{ color: "#ef4444" }}>{t.results.failed}</p>
                    <p className="text-sm text-fg3 mt-1">{analysis.error_message}</p>
                  </div>
                </div>
              )}

              {isDone && displayUrl && isImage && (
                <img src={mediaUrl(displayUrl)} alt={view} className="w-full h-full object-contain" />
              )}
              {isDone && displayUrl && !isImage && (
                <video key={displayUrl} src={mediaUrl(displayUrl)} controls className="w-full h-full object-contain" />
              )}

              {isDone && (
                <div className="absolute top-3 left-3">
                  <span className="badge text-[11px] font-semibold"
                        style={
                          view === "processed"
                            ? { backgroundColor: "var(--btn-bg)", color: "var(--btn-fg)", borderColor: "transparent" }
                            : { backgroundColor: "var(--fg4)", color: "var(--fg3)", borderColor: "var(--line)" }
                        }>
                    {view === "processed" ? t.results.aiAnnotated : t.results.original}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Metadata panel */}
          <div className="space-y-4">
            <div className="card">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-fg3 mb-5">
                {t.results.detectionResults}
              </h3>

              {isProcessing && (
                <div className="space-y-3">
                  {[1,2,3].map((i) => (
                    <div key={i} className="h-12 rounded-xl animate-pulse" style={{ backgroundColor: "var(--fg4)" }} />
                  ))}
                </div>
              )}

              {isDone && (
                <div className="space-y-2.5">
                  <Stat label={t.results.polypsDetected}  value={String(analysis.detections_count)} highlight={analysis.detections_count > 0} />
                  <Stat label={t.results.avgConfidence}   value={`${(analysis.avg_confidence * 100).toFixed(1)}%`} highlight={analysis.avg_confidence > 0.5} />
                  <Stat label={t.results.processingTime}  value={`${analysis.processing_time.toFixed(2)}s`} />
                  <Stat label={t.results.mediaType}       value={analysis.media_type.charAt(0).toUpperCase() + analysis.media_type.slice(1)} />
                </div>
              )}

              {analysis.status === "failed" && (
                <p className="text-sm" style={{ color: "#ef4444" }}>{t.results.failed}</p>
              )}
            </div>

            {isDone && analysis.processed_filename && (
              <a href={`${BASE_URL}/files/download/${analysis.processed_filename}`} download
                 className="btn-primary w-full">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t.results.download} {analysis.media_type}
              </a>
            )}

            <Link to="/dashboard" className="btn-ghost w-full justify-center rounded-xl border"
                  style={{ borderColor: "var(--line)" }}>
              {t.results.back}
            </Link>

            <div className="rounded-2xl p-4" style={{ border: "1px solid var(--line)" }}>
              <p className="text-xs font-semibold uppercase tracking-widest text-fg3 mb-2">
                {t.results.fileInfo}
              </p>
              <p className="text-xs text-fg2 break-all font-mono">{analysis.filename}</p>
              <p className="text-xs text-fg3 mt-1 font-mono">
                {new Date(analysis.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ backgroundColor: "var(--fg4)" }}>
      <span className="text-xs font-medium text-fg3">{label}</span>
      <span className="text-sm font-mono font-bold" style={{ color: highlight ? "var(--fg)" : "var(--fg2)" }}>
        {value}
      </span>
    </div>
  );
}
