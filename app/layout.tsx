import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import SessionProvider from "@/components/SessionProvider";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "Tripwise",
  description: "Plan your perfect vacation",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tripwise",
  },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body
        className={`${dmSans.variable} ${fraunces.variable} font-sans antialiased bg-background text-text-primary min-h-screen`}
      >
        <SessionProvider>{children}</SessionProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
