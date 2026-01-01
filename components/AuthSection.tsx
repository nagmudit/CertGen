"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

export default function AuthSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authStatus = useAppStore((state) => state.authStatus);
  const setAuthStatus = useAppStore((state) => state.setAuthStatus);
  const csvData = useAppStore((state) => state.csvData);
  const templateJson = useAppStore((state) => state.templateJson);
  const setJobId = useAppStore((state) => state.setJobId);

  const [emailSubject, setEmailSubject] = useState("Your Certificate");
  const [emailBody, setEmailBody] = useState(
    "Hi {{name}},\n\nPlease find your certificate attached.\n\nBest,\nTeam"
  );
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (searchParams.get("auth") === "success") {
      setAuthStatus("authenticated");
      // Clean up URL
      router.replace("/dashboard");
    }
  }, [searchParams, setAuthStatus, router]);

  const handleLogin = (provider: "google" | "outlook") => {
    window.location.href = `/api/auth/login/${provider}`;
  };

  const handleSend = async () => {
    if (!templateJson || csvData.length === 0) {
      alert("Please design a certificate and upload CSV data first.");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: templateJson,
          recipients: csvData,
          subject: emailSubject,
          body: emailBody,
        }),
      });

      const data = await response.json();
      if (data.jobId) {
        setJobId(data.jobId);
        alert("Emails queued successfully!");
      } else {
        alert("Failed to queue emails: " + data.error);
      }
    } catch (error) {
      console.error("Send error:", error);
      alert("An error occurred while sending.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-gray-50">
      <h2 className="text-xl font-bold">3. Send Certificates</h2>

      {authStatus === "unauthenticated" ? (
        <div className="flex flex-col gap-4">
          <p className="text-gray-600">
            Connect your email account to send certificates.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => handleLogin("google")}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50"
            >
              <Image
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                className="w-6 h-6"
                alt="Google"
                width={24}
                height={24}
              />
              Continue with Gmail
            </button>
            <button
              onClick={() => handleLogin("outlook")}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50"
            >
              <Image
                src="https://www.svgrepo.com/show/452069/microsoft.svg"
                className="w-6 h-6"
                alt="Microsoft"
                width={24}
                height={24}
              />
              Continue with Outlook
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-green-50 text-green-700 rounded border border-green-200">
            ✅ Authenticated successfully
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-medium">Email Subject</label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="p-2 border rounded"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-medium">Email Body</label>
            <textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              className="p-2 border rounded h-32"
            />
            <p className="text-xs text-gray-500">
              Supports variables like {`{{name}}`}
            </p>
          </div>

          <button
            onClick={handleSend}
            disabled={isSending}
            className="px-6 py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isSending ? "Queueing..." : `Send to ${csvData.length} Recipients`}
          </button>
        </div>
      )}
    </div>
  );
}
