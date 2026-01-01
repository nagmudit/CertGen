import CertificateEditor from "@/components/CertificateEditor";
import CsvUploader from "@/components/CsvUploader";
import AuthSection from "@/components/AuthSection";
import ProgressTable from "@/components/ProgressTable";
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-black">
            Certificate Generator
          </h1>
          <p className="text-black">
            Design, generate, and bulk send certificates securely.
          </p>
        </header>

        <CertificateEditor />
        <CsvUploader />
        <Suspense fallback={<div>Loading auth...</div>}>
          <AuthSection />
        </Suspense>
        <ProgressTable />
      </div>
    </div>
  );
}
