import { useCallback, useEffect, useState } from "react";
import { analysisApi } from "../api/client";
import AnalysisCard from "../components/AnalysisCard";
import Navbar from "../components/Navbar";
import UploadZone from "../components/UploadZone";
import type { Analysis, Stats } from "../types";

export default function Dashboard() {
  const [analyses, setAnalyses]     = useState<Analysis[]>([]);
  const [stats, setStats]           = useState<Stats | null>(null);
  const [uploading, setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [loadingList, setLoadingList] = useState(true);

  const fetchList = useCallback(async () => {
    try {
      const [listRes, statsRes] = await Promise.all([analysisApi.list(), analysisApi.stats()]);
      setAnalyses(listRes.data);
      setStats(statsRes.data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchList().finally(() => setLoadingList(false));

    const interval = setInterval(async () => {
      const { data } = await analysisApi.list().catch(() => ({ data: [] as Analysis[] }));
      setAnalyses(data);
      if (!data.some((a) => a.status === "pending" || a.status === "processing")) {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchList]);

  const handleUpload = async (file: File) => {
    setUploadError("");
    setUploading(true);
    try {
      const { data } = await analysisApi.upload(file);
      setAnalyses((prev) => [data, ...prev]);
    } catch (err: any) {
      setUploadError(err.response?.data?.detail || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await analysisApi.delete(id);
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
      const { data } = await analysisApi.stats();
      setStats(data);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">

        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total analyses",  value: stats.total_analyses,  unit: "" },
              { label: "Completed",        value: stats.completed,        unit: "" },
              { label: "Total detections", value: stats.total_detections, unit: "" },
              { label: "Avg confidence",   value: `${(stats.avg_confidence * 100).toFixed(1)}`, unit: "%" },
            ].map(({ label, value, unit }) => (
              <div key={label} className="card py-5 px-5">
                <p className="text-xs font-semibold text-black/40 uppercase tracking-wider mb-2">{label}</p>
                <p className="text-3xl font-bold font-mono text-black leading-none">
                  {value}
                  <span className="text-lg text-black/30 ml-0.5">{unit}</span>
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Upload zone */}
        <section>
          <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">
            New Analysis
          </p>
          <UploadZone onUpload={handleUpload} uploading={uploading} />
          {uploadError && (
            <p className="mt-3 text-sm text-red-400 text-center">{uploadError}</p>
          )}
        </section>

        {/* History */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest">
              Analysis History
            </p>
            {analyses.length > 0 && (
              <span className="text-xs text-white/20 font-mono">
                {analyses.length} record{analyses.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {loadingList ? (
            <div className="flex justify-center py-20">
              <div className="w-7 h-7 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
            </div>
          ) : analyses.length === 0 ? (
            <div className="border border-dashed border-white/15 rounded-2xl text-center py-20 text-white/20">
              <svg className="w-10 h-10 mx-auto mb-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">No analyses yet. Upload an image or video above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {analyses.map((a) => (
                <AnalysisCard key={a.id} analysis={a} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
