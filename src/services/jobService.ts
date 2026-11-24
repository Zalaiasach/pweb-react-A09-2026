import type { DataSourceMode, JobListing } from "../types";

const REMOTIVE_API_URL =
  "https://remotive.com/api/remote-jobs?category=software-dev&limit=30";
const FALLBACK_URL = "/magang-fallback.json";

interface RemotiveApiResponse {
  jobs?: Array<{
    id: number;
    title: string;
    company_name: string;
    category: string;
    candidate_required_location: string;
    salary?: string;
    tags?: string[];
  }>;
}

export async function fetchJobListings(
  source: DataSourceMode,
  signal: AbortSignal
): Promise<JobListing[]> {
  if (source === "fallback") {
    const response = await fetch(FALLBACK_URL, { signal });
    if (!response.ok) {
      throw new Error("Gagal memuat dataset lokal.");
    }
    const data = (await response.json()) as JobListing[];
    return data.map((item) => ({
      ...item,
      tags: Array.isArray(item.tags) ? item.tags : [],
    }));
  }

  const response = await fetch(REMOTIVE_API_URL, { signal });
  if (!response.ok) {
    throw new Error(`Remotive API error (${response.status})`);
  }

  const json = (await response.json()) as RemotiveApiResponse;
  if (!Array.isArray(json.jobs)) {
    throw new Error("Format respons Remotive tidak valid.");
  }

  return json.jobs.map((job) => ({
    id: job.id,
    title: job.title,
    company_name: job.company_name,
    category: job.category,
    candidate_required_location: job.candidate_required_location || "Remote",
    salary: job.salary || "Tidak dicantumkan",
    tags: Array.isArray(job.tags) && job.tags.length > 0 ? job.tags : ["General"],
  }));
}