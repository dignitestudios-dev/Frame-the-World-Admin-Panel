"use client";

import Image from "next/image";
import GridShape from "@/components/grid-shape";
import { PublicRoute } from "@/components/PublicRoute";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PublicRoute>
      <div className="flex h-screen">
        {/* Left side - Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          {children}
        </div>
        {/* Right side - Brand */}
        <div className="lg:w-1/2 w-full h-full bg-brand-gradient lg:grid items-center hidden">
          <div className="relative items-center justify-center flex z-1">
            <GridShape />
            <div className="flex flex-col items-center max-w-xs">
              <Image
                src="/images/app_logo.png"
                alt="Frame The World"
                width={200}
                height={200}
                className="object-contain"
              />
              <h1 className="text-white text-4xl font-semibold mt-4">
                Frame The World
              </h1>
              <p className="text-center text-white/70 mt-2">
                Welcome to the Admin Panel. Please sign in to continue.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicRoute>
  );
}
