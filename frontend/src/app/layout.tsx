import type { Metadata, Viewport } from "next";
import "./globals.css";
import AuthBootstrap from "@/components/AuthBootstrap";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "JanMithra - AI Agricultural & Government Scheme Assistant",
  description: "Accessible, multilingual, voice-first AI platform for Indian farmers to discover government schemes, inspect land records with vision OCR, and connect with nearby peer farmers.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FF6115",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="neon-porcelain" suppressHydrationWarning>
      <head>
        {/* Apply the last-used theme before first paint (defaults to Neon Porcelain). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("janmitra:theme:last");var ok=["neon-porcelain","quantum-blue","clay-brown","signal-violet","forest-graphite"];document.documentElement.setAttribute("data-theme",ok.indexOf(t)>-1?t:"neon-porcelain")}catch(e){document.documentElement.setAttribute("data-theme","neon-porcelain")}`,
          }}
        />
      </head>
      <body className="antialiased min-h-screen font-sans">
        <ThemeProvider>
          <AuthBootstrap />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
