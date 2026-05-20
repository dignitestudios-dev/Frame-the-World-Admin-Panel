import type { Metadata } from "next";
import { Geist, Geist_Mono, Figtree } from "next/font/google";
import "./globals.css";
import "./nprogress.css";
import { SidebarConfigProvider } from "@/contexts/sidebar-context";
import { Providers } from "@/components/providers";
import { ProgressBar } from "@/components/progress-bar";
import { ConnectionStatus } from "@/components/connection-status";
import { Toaster } from "sonner";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Frame The World – Admin Panel",
  description: "Admin panel for Frame The World",
  robots: "noindex, nofollow",
  icons: {
    icon: "/images/app_logo.png",
    shortcut: "/images/app_logo.png",
    apple: "/images/app_logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={figtree.variable}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ProgressBar />
        <ConnectionStatus />
        <Toaster position="top-center" richColors />
        <Providers>
          <SidebarConfigProvider>{children}</SidebarConfigProvider>
        </Providers>
      </body>
    </html>
  );
}
