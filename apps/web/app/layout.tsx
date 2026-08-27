import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

import { THEME_STORAGE_KEY } from "./components/theme";

// Analytics load only from production builds, so dev servers and local test
// runs do not pollute the property with internal pageviews.
const GA_MEASUREMENT_ID =
  process.env.NODE_ENV === "production" ? "G-87L4KMKRE4" : undefined;

const siteUrl = new URL(process.env.APP_URL ?? "https://elafda.org");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "eLafda: The open-source home of internet lafda",
  description:
    "Follow the conversation, inspect the evidence and keep a record of what actually happened across Indian internet culture.",
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
      <body>
        {/* Runs before first paint of the page content: re-applies a stored
            explicit theme choice so a dark-theme visitor never sees a light
            flash. With nothing stored, the light palette applies. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem(${JSON.stringify(
              THEME_STORAGE_KEY,
            )});if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
        {children}
        {GA_MEASUREMENT_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
