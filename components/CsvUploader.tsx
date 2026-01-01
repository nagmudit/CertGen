"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { useAppStore } from "@/lib/store";

export default function CsvUploader() {
  const setCsvData = useAppStore((state) => state.setCsvData);
  const csvData = useAppStore((state) => state.csvData);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        Papa.parse(file, {
          header: true,
          complete: (results: Papa.ParseResult<unknown>) => {
            setCsvData(results.data);
          },
          error: (error: Error) => {
            console.error("CSV Error:", error);
            alert("Error parsing CSV");
          },
        });
      }
    },
    [setCsvData]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
  });

  return (
    <div className="flex flex-col gap-4 p-4 border border-black rounded-lg bg-white">
      <h2 className="text-xl font-bold">2. Upload Recipient Data</h2>

      <div
        {...getRootProps()}
        className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors
          ${
            isDragActive
              ? "border-black bg-gray-100"
              : "border-gray-300 hover:border-black"
          }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the CSV file here...</p>
        ) : (
          <p>Drag & drop a CSV file here, or click to select one</p>
        )}
      </div>

      {csvData.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">
            Preview ({csvData.length} rows)
          </h3>
          <div className="overflow-x-auto max-h-60 border border-black rounded">
            <table className="min-w-full divide-y divide-black">
              <thead className="bg-black text-white">
                <tr>
                  {Object.keys(csvData[0]).map((header) => (
                    <th
                      key={header}
                      className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {csvData.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((cell: unknown, j) => (
                      <td
                        key={j}
                        className="px-4 py-2 whitespace-nowrap text-sm text-black"
                      >
                        {String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {csvData.length > 5 && (
              <p className="p-2 text-sm text-black text-center">
                ...and {csvData.length - 5} more rows
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
