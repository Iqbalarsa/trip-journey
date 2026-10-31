"use client";

import React from "react";
import Link from "next/link";
import { MapPin, Calendar, Camera, ArrowRight } from "lucide-react";

export interface TripSummary {
  id: string;
  title: string;
  city: string | null;
  country: string | null;
  dateLabel: string | null;
  story: string | null;
  coverPhotoUrl: string | null;
  _count?: {
    photos: number;
  };
  photos?: Array<{
    id: string;
    imageUrl: string;
  }>;
}

interface TripCardProps {
  trip: TripSummary;
}

export function TripCard({ trip }: TripCardProps) {
  const photoCount = trip._count?.photos ?? trip.photos?.length ?? 0;
  const locationText = [trip.city, trip.country].filter(Boolean).join(", ");
  const fallbackCover = trip.photos?.[0]?.imageUrl || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80";
  const coverUrl = trip.coverPhotoUrl || fallbackCover;

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="group block focus:outline-none"
    >
      <article className="apple-card overflow-hidden flex flex-col h-full apple-press transition-all duration-300">
        {/* Cover Photo Area with smooth zoom effect */}
        <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-surface-subtle">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            alt={trip.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />

          {/* Top Floating Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
            {locationText ? (
              <div className="apple-card px-2.5 py-1 rounded-full text-[11px] font-medium text-main flex items-center gap-1.5 shadow-md backdrop-blur-md">
                <MapPin className="w-3 h-3 text-accent-theme shrink-0" />
                <span className="truncate max-w-[160px]">{locationText}</span>
              </div>
            ) : <div />}

            <div className="apple-card px-2.5 py-1 rounded-full text-[11px] font-medium text-main flex items-center gap-1.5 shadow-md backdrop-blur-md">
              <Camera className="w-3 h-3 text-accent-theme shrink-0" />
              <span>{photoCount} {photoCount === 1 ? "Photo" : "Photos"}</span>
            </div>
          </div>

          {/* Bottom subtle shadow vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Card Body */}
        <div className="p-5 flex flex-col flex-1 justify-between">
          <div>
            {/* Date Tag */}
            {trip.dateLabel && (
              <div className="flex items-center gap-1.5 text-xs text-muted-theme font-medium mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-accent-tint" />
                <span>{trip.dateLabel}</span>
              </div>
            )}

            {/* Title */}
            <h3 className="text-lg font-semibold tracking-tight text-main group-hover:text-accent-theme transition-colors line-clamp-1">
              {trip.title}
            </h3>

            {/* Story excerpt */}
            {trip.story && (
              <p className="mt-2 text-xs sm:text-sm text-muted-theme line-clamp-2 leading-relaxed">
                {trip.story}
              </p>
            )}
          </div>

          {/* Card Footer */}
          <div className="pt-4 mt-4 border-t border-subtle-theme flex items-center justify-between text-xs font-medium text-accent-theme">
            <span>Explore Album</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </article>
    </Link>
  );
}

