import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { analysisApi, BASE_URL, mediaUrl } from "../api/client";
import Navbar from "../components/Navbar";
import type { Analysis } from "../types";

type View = "original" | "processed";

const POLL_MS = 2500;

export default function Results() {
  const { id } = useParams<{ id: string }>();
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
      setError("Analysis not found");
      return null;
    }
  };

  useEffect(() => {
    load().then((data) => {
      if (!data) return;
      if (data.status === "pending" || data.status === "processing") {
        pollRef.current = setInterval(async () => {
          const updated = await load();
          if (updated && updated.status !== "pending" && updated.status !== "processing") {
            clearInterval(pollRef.current!);
          }
        }, POLL_MS);
      }
    });
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <p className="text-white/40">{error}</p>
          <Link to="/dashboard" className="mt-6 inline-flex btn-ghost">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  const isProcessing = analysis.status === "pending" || analysis.status === "processing";
  const isDone       = analysis.status === "done";
  const isImage      = analysis.media_type === "image";

  const displayUrl = view === "processed" && analysis.processed_url
    ? analysis.processed_url
    : analysis.original_url;

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-white/30 font-mono">
          <Link to="/dashboard" className="hover:text-white/60 transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-white/60 truncate max-w-xs">{analysis.filename}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Media viewer ── */}
          <div className="lg:col-span-2 space-y-3">
            {/* Toggle */}
            {isDone && (
              <div className="flex gap-1 p-1 bg-white/8 rounded-xl w-fit">
                {(["processed", "original"] as View[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 capitalize
                      ${view === v
                        ? "bg-white text-black shadow-sm"
                        : "text-white/40 hover:text-white/70"
                      }`}
                  >
                    {v === "processed" ? "AI Output" : "Original"}
                  </button>
                ))}
              </div>
            )}

            {/* Viewer */}
            <div className="relative rounded-2xl overflow-hidden border border-white/8 bg-white/3 aspect-video flex items-center justify-center">
              {isProcessing && (
                <div className="flex flex-col items-center gap-5 text-white/40">
                  <div className="w-10 h-10 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
                  <div className="text-center">
                    <p className="font-semibold text-white/70 capitalize">{analysis.status}…</p>
                    <p className="text-sm text-white/30 mt-1">
                      {isImage ? "Running polyp detection" : "Processing video frames"}
                    </p>
                  </div>
                </div>
              )}

              {analysis.status === "failed" && (
                <div className="flex flex-col items-center gap-3 text-center px-6">
                  <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-red-400">Processing failed</p>
                    <p className="text-sm text-white/30 mt-1">{analysis.error_message}</p>
                  </div>
                </div>
              )}

              {isDone && displayUrl && isImage && (
                <img
                  src={mediaUrl(displayUrl)}
                  alt={view}
                  className="w-full h-full object-contain"
                />
              )}

              {isDone && displayUrl && !isImage && (
                <video
                  key={displayUrl}
                  src={mediaUrl(displayUrl)}
                  controls
                  className="w-full h-full object-contain"
                />
              )}

              {/* Badge */}
              {isDone && (
                <div className="absolute top-3 left-3">
                  <span className={`badge border text-xs font-semibold
                    ${view === "processed"
                      ? "bg-white text-black border-transparent shadow-sm"
                      : "bg-black/50 text-white/70 border-white/20 backdrop-blur-sm"
                    }`}
                  >
                    {view === "processed" ? "AI Annotated" : "Original"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Metadata panel ── */}
          <div className="space-y-4">
            <div className="card">
              <h3 className="text-xs font-semibold text-black/40 uppercase tracking-widest mb-5">
                Detection Results
              </h3>

              {isProcessing && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-black/5 rounded-xl animate-pulse" />
                  ))}
                </div>
              )}

              {isDone && (
                <div className="space-y-2.5">
                  <Stat label="Polyps detected"  value={String(analysis.detections_count)} highlight={analysis.detections_count > 0} />
                  <Stat label="Avg confidence"   value={`${(analysis.avg_confidence * 100).toFixed(1)}%`} highlight={analysis.avg_confidence > 0.5} />
                  <Stat label="Processing time"  value={`${analysis.processing_time.toFixed(2)}s`} />
                  <Stat label="Media type"       value={analysis.media_type.charAt(0).toUpperCase() + analysis.media_type.slice(1)} />
                </div>
              )}

              {analysis.status === "failed" && (
                <p className="text-sm text-red-500">Analysis failed — see error above.</p>
              )}
            </div>

            {/* Download */}
            {isDone && analysis.processed_filename && (
              <a
                href={`${BASE_URL}/files/download/${analysis.processed_filename}`}
                download
                className="btn-primary w-full"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download processed {analysis.media_type}
              </a>
            )}

            <Link to="/dashboard" className="btn-ghost w-full justify-center border border-white/10 rounded-xl">
              ← Back to Dashboard
            </Link>

            {/* File info */}
            <div className="border border-white/8 rounded-2xl p-4">
              <p className="text-xs text-white/25 mb-2 font-semibold uppercase tracking-widest">File info</p>
              <p className="text-xs text-white/50 break-all font-mono">{analysis.filename}</p>
              <p className="text-xs text-white/25 mt-1 font-mono">
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
    <div className="flex items-center justify-between px-4 py-3 bg-black/4 rounded-xl">
      <span className="text-xs text-black/40 font-medium">{label}</span>
      <span className={`text-sm font-mono font-bold ${highlight ? "text-black" : "text-black/60"}`}>
        {value}
      </span>
    </div>
  );
}
