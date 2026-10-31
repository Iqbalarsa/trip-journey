"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, FolderSync, Clock } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full apple-header-glass transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group apple-press focus:outline-none"
        >
          <div className="w-8 h-8 rounded-xl bg-accent-theme text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
            <Compass className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[15px] tracking-tight text-main leading-tight">
              Catatan Kembara
            </span>
            <span className="text-[10px] text-muted-theme font-medium tracking-wide">
              Travel Photo Journal
            </span>
          </div>
        </Link>

        {/* Right: Nav Tabs */}
        <nav className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-subtle border border-theme">
          <Link
            href="/"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition apple-press ${
              pathname === "/"
                ? "bg-surface text-main shadow-xs font-semibold"
                : "text-muted-theme hover:text-main"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Timeline</span>
          </Link>
          <Link
            href="/admin"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition apple-press ${
              pathname.startsWith("/admin")
                ? "bg-surface text-main shadow-xs font-semibold"
                : "text-muted-theme hover:text-main"
            }`}
          >
            <FolderSync className="w-3.5 h-3.5 text-accent-theme" />
            <span>Admin & Sync</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
