"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";

interface JobStatus {
  id: string;
  email: string;
  status: string;
  failedReason?: string;
  finishedOn?: number;
}

export default function ProgressTable() {
  const jobId = useAppStore((state) => state.jobId);
  const [jobs, setJobs] = useState<JobStatus[]>([]);

  useEffect(() => {
    if (!jobId) return;

    const fetchJobs = async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        const data = await res.json();
        if (data.jobs) {
          setJobs(data.jobs);
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
      }
    };

    fetchJobs();
    const interval = setInterval(fetchJobs, 2000);
    return () => clearInterval(interval);
  }, [jobId]);

  if (!jobId) return null;

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-gray-50 mt-8">
      <h2 className="text-xl font-bold">4. Sending Progress</h2>

      <div className="overflow-x-auto border rounded bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {jobs.map((job) => (
              <tr key={job.id}>
                <td className="px-4 py-2 text-sm text-gray-900">{job.email}</td>
                <td className="px-4 py-2 text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold
                    ${
                      job.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : job.status === "failed"
                        ? "bg-red-100 text-red-800"
                        : job.status === "active"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {job.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm text-gray-500">
                  {job.failedReason ||
                    (job.finishedOn
                      ? new Date(job.finishedOn).toLocaleTimeString()
                      : "-")}
                </td>
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-4 text-center text-gray-500">
                  Initializing...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
