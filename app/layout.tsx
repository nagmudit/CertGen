import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CertGen — Certificate Generator",
  description:
    "Design and generate personalized certificates for events and courses.",
  applicationName: "CertGen",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "CertGen — Certificate Generator",
    description:
      "Design and generate personalized certificates for events and courses.",
    siteName: "CertGen",
    images: ["/favicon.svg"],
  },
  twitter: {
    card: "summary",
    title: "CertGen — Certificate Generator",
    description:
      "Design and generate personalized certificates for events and courses.",
    images: ["/favicon.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
