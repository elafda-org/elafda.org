import type { Metadata } from "next";
import "./globals.css";

const siteUrl = new URL(process.env.APP_URL ?? "https://elafda.org");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "eLafda — The open-source home of internet lafda",
  description:
    "Follow the conversation, inspect the evidence, and preserve what actually happened across Indian internet culture.",
  applicationName: "eLafda",
  openGraph: {
    title: "eLafda — Internet forgets. Receipts shouldn’t.",
    description: "Follow the conversation. Inspect the evidence.",
    url: "/",
    siteName: "eLafda",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "eLafda — Follow the conversation. Inspect the evidence.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "eLafda — Internet forgets. Receipts shouldn’t.",
    description: "Follow the conversation. Inspect the evidence.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
