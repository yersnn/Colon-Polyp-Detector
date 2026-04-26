export interface User {
  id: number;
  email: string;
}

export type AnalysisStatus = "pending" | "processing" | "done" | "failed";

export interface Analysis {
  id: number;
  filename: string;
  media_type: "image" | "video";
  status: AnalysisStatus;
  detections_count: number;
  avg_confidence: number;
  processing_time: number;
  error_message: string | null;
  original_url: string | null;
  processed_url: string | null;
  processed_filename: string | null;
  created_at: string;
}

export interface Stats {
  total_analyses: number;
  completed: number;
  total_detections: number;
  avg_confidence: number;
}
