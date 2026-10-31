import React from "react";
import Link from "next/link";
import { Compass, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-subtle-theme py-8 text-xs text-muted-theme mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-accent-theme" />
          <span className="font-semibold text-main">Catatan Kembara</span>
          <span className="text-faint-theme">•</span>
          <span>Jurnal & Arsip Foto Perjalanan</span>
        </div>

        <div className="flex items-center gap-4 text-muted-theme">
          <Link href="/" className="hover:text-main transition">
            Timeline
          </Link>
          <Link href="/admin" className="hover:text-main transition">
            Admin
          </Link>
          <span className="text-faint-theme">•</span>
          <span>Arsip Foto Pribadi</span>
        </div>
      </div>
    </footer>
  );
}

