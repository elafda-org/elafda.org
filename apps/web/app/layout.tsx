import type { Metadata } from "next";
import "./globals.css";

const siteUrl = new URL(process.env.APP_URL ?? "https://elafda.org");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "eLafda: The open-source home of internet lafda",
  description:
    "Follow the conversation, inspect the evidence, and preserve what actually happened across Indian internet culture.",
  applicationName: "eLafda",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [
      { url: "/apple-touch-icon-180.png", type: "image/png", sizes: "180x180" },
    ],
  },
  openGraph: {
    title: "eLafda: Internet forgets. Receipts shouldn’t.",
    description: "Follow the conversation. Inspect the evidence.",
    url: "/",
    siteName: "eLafda",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1600,
        height: 840,
        alt: "eLafda: Follow the conversation. Inspect the evidence.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "eLafda: Internet forgets. Receipts shouldn’t.",
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
