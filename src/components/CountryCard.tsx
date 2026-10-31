"use client";

import React from "react";
import Link from "next/link";
import { Camera, Calendar } from "lucide-react";

export interface CountryDestination {
  id: string;
  slug: string;
  title: string;
  city: string;
  country: string;
  dateLabel: string;
  coverPhotoUrl: string | null;
  photoCount: number;
  latitude?: number | null;
  longitude?: number | null;
}

interface CountryCardProps {
  destination: CountryDestination;
  isSelected?: boolean;
}

export function CountryCard({ destination, isSelected }: CountryCardProps) {
  const coverUrl =
    destination.coverPhotoUrl ||
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80";

  // Format judul "[Nama Kota], [Negara]" secara rapi
  const locationTitle =
    destination.city &&
    destination.city.toLowerCase() !== destination.country.toLowerCase()
      ? `${destination.city}, ${destination.country}`
      : destination.country || destination.city;

  return (
    <Link
      href={`/trips/${destination.slug || destination.id}`}
      id={`country-card-${destination.id}`}
      className="group block focus:outline-none"
    >
      <div
        className={`relative aspect-[16/10] w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-theme shadow-md hover:shadow-2xl hover:border-accent-theme transition-all duration-500 apple-press bg-surface-subtle ${
          isSelected ? "ring-2 ring-accent-theme border-accent-theme" : ""
        }`}
      >
        {/* Cover Photo Full Card */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverUrl}
          alt={locationTitle}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
        />

        {/* Multi-Stop Cinematic Gradient Overlay for Maximum Legibility */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

        {/* 1. Atas: Badge Tanggal Event (Kiri) & Badge Jumlah Foto (Kanan) */}
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 flex items-center justify-between gap-2 pointer-events-none">
          <div className="px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-md border border-white/20 text-xs font-medium text-white shadow-md flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-accent-text" />
            <span className="truncate max-w-[150px] sm:max-w-[180px]">{destination.dateLabel}</span>
          </div>

          <div className="px-2.5 py-1.5 rounded-full bg-black/55 backdrop-blur-md border border-white/20 text-xs font-medium text-white/95 flex items-center gap-1.5 shadow-md shrink-0">
            <Camera className="w-3.5 h-3.5 text-amber-300" />
            <span>{destination.photoCount} Foto</span>
          </div>
        </div>

        {/* 2. Bawah Kiri: Judul Gabungan "[Nama Kota], [Negara]" */}
        <div className="absolute bottom-3.5 sm:bottom-4 left-3.5 sm:left-4 right-3.5 sm:right-4 pointer-events-none">
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white drop-shadow-md group-hover:text-accent-tint transition-colors line-clamp-1">
            {locationTitle}
          </h3>
        </div>
      </div>
    </Link>
  );
}

export default CountryCard;
