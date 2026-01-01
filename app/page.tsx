import Link from "next/link";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-(family-name:--font-geist-sans)">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold">Certificate Generator</h1>
        <p className="text-lg text-black">
          Securely generate and send certificates via Gmail or Outlook.
        </p>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <Link
            href="/dashboard"
            className="rounded-full border border-solid border-black transition-colors flex items-center justify-center bg-black text-white gap-2 hover:bg-white hover:text-black text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
          >
            Go to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
