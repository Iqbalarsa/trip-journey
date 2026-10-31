"use client";

import React from "react";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  Camera,
  ArrowRight,
  Plane,
  Ticket,
  Compass,
  Quote,
} from "lucide-react";

export interface BoardingPassTrip {
  id: string;
  slug: string;
  title: string;
  city: string;
  country: string;
  dateLabel: string;
  quote?: string | null;
  coverPhotoUrl: string | null;
  latitude?: number | null;
  longitude?: number | null;
  _count?: {
    photos: number;
    chapters?: number;
  };
  photos?: Array<{
    id: string;
    imageUrl: string;
  }>;
}

interface BoardingPassCardProps {
  trip: BoardingPassTrip;
}

// Helper to generate simulated 3-letter IATA city code
function getCityCode(city: string, country: string): string {
  const map: Record<string, string> = {
    leiden: "AMS",
    amsterdam: "AMS",
    rotterdam: "RTM",
    kyoto: "KIX",
    tokyo: "HND",
    osaka: "ITM",
    paris: "CDG",
    rome: "FCO",
    london: "LHR",
    bali: "DPS",
    jakarta: "CGK",
    zurich: "ZRH",
  };
  const key = (city || "").toLowerCase().trim();
  if (map[key]) return map[key];
  return (city || "TRP").slice(0, 3).toUpperCase();
}

export function BoardingPassCard({ trip }: BoardingPassCardProps) {
  const photoCount = trip._count?.photos ?? trip.photos?.length ?? 0;
  const coverUrl =
    trip.coverPhotoUrl ||
    trip.photos?.[0]?.imageUrl ||
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80";

  const cityCode = getCityCode(trip.city, trip.country);
  const targetUrl = `/trips/${trip.slug || trip.id}`;

  return (
    <article
      id={`trip-${trip.slug || trip.id}`}
      className="group apple-card overflow-hidden transition-all duration-300 hover:shadow-xl relative"
    >
      <div className="flex flex-col lg:flex-row">
        {/* Left / Hero Section: Cover Image */}
        <div className="relative lg:w-5/12 aspect-[16/10] lg:aspect-auto overflow-hidden bg-surface-subtle shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            alt={trip.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
          />

          {/* Top Destination Floating Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full apple-card text-xs font-semibold text-main shadow-md backdrop-blur-md">
            <Plane className="w-3.5 h-3.5 text-accent-theme" />
            <span>{trip.country}</span>
          </div>

          {/* Photo Count Badge */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full apple-card text-[11px] font-medium text-main shadow-md backdrop-blur-md">
            <Camera className="w-3 h-3 text-accent-theme" />
            <span>{photoCount} Photos</span>
          </div>
        </div>

        {/* Center / Boarding Pass Body */}
        <div className="p-6 lg:p-7 flex-1 flex flex-col justify-between">
          <div>
            {/* Header: Destination Codes & Flight Pass Header */}
            <div className="flex items-center justify-between pb-3 border-b border-subtle-theme">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-accent-theme" />
                <span className="text-[11px] font-mono tracking-widest uppercase font-semibold text-muted-theme">
                  BOARDING PASS • JOURNAL ENTRY
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-accent-light-theme text-accent-theme font-mono text-[10px] font-bold tracking-wider">
                CLASS: EXPLORER
              </span>
            </div>

            {/* City Code Route Display */}
            <div className="pt-4 flex items-baseline gap-3">
              <span className="text-3xl font-black font-mono tracking-tight text-main">
                {cityCode}
              </span>
              <span className="text-muted-theme font-mono text-sm">→</span>
              <div className="flex flex-col">
                <span className="text-base font-bold text-main tracking-tight">
                  {trip.city}, {trip.country}
                </span>
                <span className="text-[11px] text-muted-theme">
                  Destination Coordinates: {trip.latitude?.toFixed(3) || "0.000"}° N,{" "}
                  {trip.longitude?.toFixed(3) || "0.000"}° E
                </span>
              </div>
            </div>

            {/* Title */}
            <h3 className="mt-3 text-xl font-bold tracking-tight text-main group-hover:text-accent-theme transition-colors">
              {trip.title}
            </h3>

            {/* Memorable Highlight Quote */}
            {trip.quote && (
              <div className="mt-3 p-3 rounded-xl bg-surface-subtle border border-theme flex items-start gap-2.5">
                <Quote className="w-4 h-4 text-accent-theme shrink-0 mt-0.5" />
                <p className="text-xs text-muted-theme italic leading-relaxed">
                  &ldquo;{trip.quote}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Ticket Footer / Stub */}
          <div className="pt-5 mt-5 border-t border-dashed border-subtle-theme flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-theme font-medium">
                <Calendar className="w-3.5 h-3.5 text-accent-theme" />
                <span className="font-mono">{trip.dateLabel}</span>
              </div>

              {/* Barcode simulation */}
              <div className="hidden sm:flex items-center gap-0.5 opacity-60">
                <span className="w-0.5 h-5 bg-main inline-block" />
                <span className="w-1.5 h-5 bg-main inline-block" />
                <span className="w-0.5 h-5 bg-main inline-block" />
                <span className="w-1 h-5 bg-main inline-block" />
                <span className="w-0.5 h-5 bg-main inline-block" />
                <span className="w-2 h-5 bg-main inline-block" />
                <span className="w-0.5 h-5 bg-main inline-block" />
                <span className="w-1 h-5 bg-main inline-block" />
              </div>
            </div>

            {/* Board Trip Action CTA */}
            <Link
              href={targetUrl}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-theme text-white text-xs font-semibold hover:bg-accent-hover-theme transition apple-press shadow-sm"
            >
              <span>Board Trip</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default BoardingPassCard;

