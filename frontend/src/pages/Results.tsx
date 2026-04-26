import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { analysisApi } from "../api/client";
import Navbar from "../components/Navbar";
import type { Analysis } from "../types";

type View = "original" | "processed";

const POLL_MS = 2500;

export default function Results() {
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [view, setView] = useState<View>("processed");
  const [error, setError] = useState("");
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

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen bg-navy-900">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <p className="text-red-400">{error}</p>
          <Link to="/dashboard" className="btn-primary mt-4 inline-flex">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isProcessing = analysis.status === "pending" || analysis.status === "processing";
  const isDone = analysis.status === "done";
  const isImage = analysis.media_type === "image";

  const displayUrl = view === "processed" && analysis.processed_url
    ? analysis.processed_url
    : analysis.original_url;

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/dashboard" className="hover:text-teal-400 transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-300 truncate max-w-xs">{analysis.filename}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Media viewer */}
          <div className="lg:col-span-2 space-y-3">
            {/* Toggle */}
            {isDone && (
              <div className="flex gap-1 p-1 bg-surface-2 rounded-lg w-fit">
                {(["processed", "original"] as View[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize
                      ${view === v
                        ? "bg-teal-500 text-white"
                        : "text-gray-400 hover:text-gray-200"
                      }`}
                  >
                    {v === "processed" ? "AI Output" : "Original"}
                  </button>
                ))}
              </div>
            )}

            {/* Media */}
            <div className="relative rounded-xl overflow-hidden bg-surface border border-surface-2 aspect-video flex items-center justify-center">
              {isProcessing && (
                <div className="flex flex-col items-center gap-4 text-gray-400">
                  <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                  <div className="text-center">
                    <p className="font-medium text-gray-200 capitalize">{analysis.status}…</p>
                    <p className="text-sm text-gray-500 mt-1">
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
                    <p className="font-medium text-red-400">Processing failed</p>
                    <p className="text-sm text-gray-500 mt-1">{analysis.error_message}</p>
                  </div>
                </div>
              )}

              {isDone && displayUrl && isImage && (
                <img
                  src={displayUrl}
                  alt={view}
                  className="w-full h-full object-contain"
                />
              )}

              {isDone && displayUrl && !isImage && (
                <video
                  key={displayUrl}
                  src={displayUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              )}

              {/* View label badge */}
              {isDone && (
                <div className="absolute top-3 left-3">
                  <span className={`badge border ${
                    view === "processed"
                      ? "bg-teal-500/20 text-teal-300 border-teal-500/40"
                      : "bg-surface-2 text-gray-400 border-surface-3"
                  }`}>
                    {view === "processed" ? "AI Annotated" : "Original"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Metadata panel */}
          <div className="space-y-4">
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Detection Results</h3>

              {isProcessing && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-surface-2 rounded-lg animate-pulse" />
                  ))}
                </div>
              )}

              {isDone && (
                <div className="space-y-3">
                  <Stat
                    label="Polyps detected"
                    value={String(analysis.detections_count)}
                    accent={analysis.detections_count > 0}
                  />
                  <Stat
                    label="Avg confidence"
                    value={`${(analysis.avg_confidence * 100).toFixed(1)}%`}
                    accent={analysis.avg_confidence > 0.5}
                  />
                  <Stat
                    label="Processing time"
                    value={`${analysis.processing_time.toFixed(2)}s`}
                  />
                  <Stat
                    label="Media type"
                    value={analysis.media_type.charAt(0).toUpperCase() + analysis.media_type.slice(1)}
                  />
                </div>
              )}

              {analysis.status === "failed" && (
                <p className="text-sm text-red-400">Analysis failed — see error above.</p>
              )}
            </div>

            {/* Download */}
            {isDone && analysis.processed_filename && (
              <a
                href={`/files/download/${analysis.processed_filename}`}
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

            <Link to="/dashboard" className="btn-ghost w-full justify-center border border-surface-3">
              ← Back to Dashboard
            </Link>

            {/* File info */}
            <div className="card py-4">
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">File info</p>
              <p className="text-xs text-gray-400 break-all font-mono">{analysis.filename}</p>
              <p className="text-xs text-gray-600 mt-1">
                {new Date(analysis.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 bg-surface-2 rounded-lg">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm font-mono font-semibold ${accent ? "text-teal-400" : "text-gray-300"}`}>
        {value}
      </span>
    </div>
  );
}
