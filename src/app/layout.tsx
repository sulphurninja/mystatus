import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/contexts/ToastContext";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mystatusads.com";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "MyStatus - Get Rewarded for Your Social Status",
  description: "Revolutionizing social media marketing. Share advertisements and get rewarded instantly on MyStatus Ads.",
  openGraph: {
    title: "MyStatus - Get Rewarded for Your Social Status",
    description:
      "Revolutionizing social media marketing. Share advertisements and get rewarded instantly on MyStatus Ads.",
    url: siteUrl,
    siteName: "MyStatus",
    type: "website",
    images: [
      {
        url: "/mystatus.jpeg",
        alt: "MyStatus",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MyStatus - Get Rewarded for Your Social Status",
    description:
      "Revolutionizing social media marketing. Share advertisements and get rewarded instantly on MyStatus Ads.",
    images: ["/mystatus.jpeg"],
  },
  keywords: ["social media marketing", "earn rewards", "MLM platform", "status marketing", "MyStatus Ads"],
  icons: {
    icon: "/mystatus.jpeg",
    shortcut: "/mystatus.jpeg",
    apple: "/mystatus.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
