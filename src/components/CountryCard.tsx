"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Camera, Calendar, Globe } from "lucide-react";

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

// Country flag emoji mapping helper
function getCountryFlag(countryName: string): string {
  const norm = countryName.toLowerCase().trim();
  const flagMap: Record<string, string> = {
    austria: "🇦🇹",
    czechia: "🇨🇿",
    "czech republic": "🇨🇿",
    japan: "🇯🇵",
    jepang: "🇯🇵",
    france: "🇫🇷",
    prancis: "🇫🇷",
    germany: "🇩🇪",
    jerman: "🇩🇪",
    italy: "🇮🇹",
    italia: "🇮🇹",
    switzerland: "🇨🇭",
    swiss: "🇨🇭",
    indonesia: "🇮🇩",
    singapore: "🇸🇬",
    singapura: "🇸🇬",
    spain: "🇪🇸",
    spanyol: "🇪🇸",
    netherlands: "🇳🇱",
    belanda: "🇳🇱",
    "united kingdom": "🇬🇧",
    uk: "🇬🇧",
    england: "🇬🇧",
    inggris: "🇬🇧",
    "united states": "🇺🇸",
    usa: "🇺🇸",
    amerika: "🇺🇸",
    canada: "🇨🇦",
    australia: "🇦🇺",
    "new zealand": "🇳🇿",
    korea: "🇰🇷",
    "south korea": "🇰🇷",
    china: "🇨🇳",
    tiongkok: "🇨🇳",
    thailand: "🇹🇭",
    vietnam: "🇻🇳",
    malaysia: "🇲🇾",
    norway: "🇳🇴",
    norwegia: "🇳🇴",
    sweden: "🇸🇪",
    swedia: "🇸🇪",
    finland: "🇫🇮",
    finlandia: "🇫🇮",
    denmark: "🇩🇰",
    greece: "🇬🇷",
    yunani: "🇬🇷",
    turkey: "🇹🇷",
    turki: "🇹🇷",
    portugal: "🇵🇹",
  };
  return flagMap[norm] || "🌍";
}

export function CountryCard({ destination, isSelected }: CountryCardProps) {
  const coverUrl =
    destination.coverPhotoUrl ||
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80";

  const flag = getCountryFlag(destination.country);
  const displayTitle = destination.title.includes(" — ")
    ? destination.title.split(" — ")[0]
    : destination.title;

  return (
    <Link
      href={`/trips/${destination.slug || destination.id}`}
      id={`country-card-${destination.id}`}
      className="group block focus:outline-none"
    >
      <div
        className={`apple-card overflow-hidden rounded-2xl sm:rounded-3xl border border-theme bg-surface hover:border-accent-theme hover:shadow-xl transition-all duration-300 apple-press ${
          isSelected ? "ring-2 ring-accent-theme border-accent-theme" : ""
        }`}
      >
        {/* Cover Photo Container with Cinematic Aspect Ratio */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-subtle">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            alt={destination.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
          />

          {/* Vignette Shadow Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

          {/* Top Floating Badges: Flag & Photo Count */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
            <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs font-semibold text-white flex items-center gap-1.5 shadow-md">
              <span className="text-sm leading-none">{flag}</span>
              <span className="truncate max-w-[120px]">{destination.country}</span>
            </div>

            <div className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[11px] font-medium text-white/90 flex items-center gap-1 shadow-md">
              <Camera className="w-3 h-3 text-amber-300" />
              <span>{destination.photoCount} Foto</span>
            </div>
          </div>

          {/* Bottom Title & Date Overlay inside photo for quick preview */}
          <div className="absolute bottom-3 left-3.5 right-3.5 text-white space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-white/85">
              <Calendar className="w-3 h-3 text-accent-text" />
              <span>{destination.dateLabel}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold tracking-tight text-white drop-shadow-sm group-hover:text-accent-tint transition-colors truncate">
              {displayTitle}
            </h3>
          </div>
        </div>

        {/* Card Body: Cities Footprint & Explore CTA */}
        <div className="p-4 sm:p-5 flex items-center justify-between gap-3 border-t border-subtle-theme bg-surface">
          <div className="min-w-0 text-xs text-muted-theme">
            <span className="truncate font-medium">{destination.city}</span>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-accent-theme group-hover:translate-x-1 transition-transform shrink-0">
            <span>Buka Album</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default CountryCard;
