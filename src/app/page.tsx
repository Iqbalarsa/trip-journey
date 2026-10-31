"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { CountryCard, CountryDestination } from "@/components/CountryCard";
import { getTripTimelineTimestamp } from "@/lib/utils";
import {
  Compass,
  MapPin,
  Camera,
  Globe,
  Search,
  Plane,
  Calendar,
  Layers,
} from "lucide-react";

// Dynamically import Leaflet Map to avoid SSR issues
const WorldMap = dynamic(() => import("@/components/WorldMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[420px] rounded-3xl apple-card flex flex-col items-center justify-center gap-3 animate-pulse">
      <Compass className="w-9 h-9 text-accent-theme animate-spin" />
      <span className="text-xs font-medium text-muted-theme">
        Memuat peta perjalanan...
      </span>
    </div>
  ),
});

export default function HomePage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ trips: 0, photos: 0, countries: 0 });

  useEffect(() => {
    fetchStats();
    fetchTrips();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.stats) setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTrips = async (searchQuery = search) => {
    setLoading(true);
    try {
      const url = searchQuery
        ? `/api/trips?search=${encodeURIComponent(searchQuery)}`
        : "/api/trips";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTrips(data.trips || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTrips(search);
  };

  // Timeline entries: each trip visit based on its time period (e.g. "Austria — Januari 2026")
  const visitDestinations: (CountryDestination & { rawTrip?: any })[] = trips.map((trip) => ({
    id: trip.id,
    slug: trip.slug,
    title: trip.title,
    city: trip.city,
    country: trip.country,
    dateLabel: trip.dateLabel,
    coverPhotoUrl: trip.coverPhotoUrl,
    photoCount: trip._count?.photos || trip.photos?.length || 0,
    latitude: trip.latitude,
    longitude: trip.longitude,
    rawTrip: trip,
  }));

  // Sort visits chronologically: Newest visit first
  visitDestinations.sort((a, b) => {
    const timeA = getTripTimelineTimestamp(a.rawTrip || a);
    const timeB = getTripTimelineTimestamp(b.rawTrip || b);
    return timeB - timeA;
  });

  // Filter visits by search query
  const filteredVisits = visitDestinations.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.country.toLowerCase().includes(q) ||
      d.city.toLowerCase().includes(q) ||
      d.title.toLowerCase().includes(q) ||
      d.dateLabel.toLowerCase().includes(q)
    );
  });

  // Map destination pins (WorldMap aggregates 1 pin per country/location)
  const mapPins = trips
    .filter((t) => t.latitude && t.longitude)
    .map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      city: t.city,
      country: t.country,
      dateLabel: t.dateLabel,
      coverPhotoUrl: t.coverPhotoUrl,
      latitude: t.latitude ?? null,
      longitude: t.longitude ?? null,
      photoCount: t._count?.photos || t.photos?.length || 0,
    }));

  return (
    <div className="space-y-8 sm:space-y-12 pb-24">
      {/* Editorial Journal Header */}
      <header className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-light-theme text-accent-theme text-xs font-semibold">
              <Compass className="w-3.5 h-3.5" />
              <span>Jurnal Perjalanan Pribadi</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-main leading-tight">
              Catatan Kembara
            </h1>
            <p className="text-xs sm:text-sm text-muted-theme max-w-xl">
              Kumpulan foto, cerita, dan sudut-sudut kota.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="apple-card px-4 py-2 rounded-2xl text-xs flex items-center gap-2 shadow-xs">
              <Globe className="w-4 h-4 text-accent-theme" />
              <span className="font-bold text-main">{stats.countries}</span>
              <span className="text-muted-theme">Negara</span>
            </div>
            <div className="apple-card px-4 py-2 rounded-2xl text-xs flex items-center gap-2 shadow-xs">
              <Camera className="w-4 h-4 text-accent-theme" />
              <span className="font-bold text-main">{stats.photos}</span>
              <span className="text-muted-theme">Foto</span>
            </div>
          </div>
        </div>
      </header>

      {/* 1. Full-Width Hero Section Map (55vh Height) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-theme">
              Peta Perjalanan
            </span>
          </div>
          <span className="text-[11px] font-mono text-muted-theme">
            {mapPins.length} Negara
          </span>
        </div>

        <div className="relative w-full h-[55vh] min-h-[420px] max-h-[620px] rounded-3xl overflow-hidden border border-theme shadow-xl bg-surface-subtle">
          <WorldMap
            destinations={mapPins}
            className="w-full h-full"
          />
        </div>
      </section>

      {/* 2. Timeline Kunjungan: Main Vertical Editorial Feed */}
      <section className="space-y-6 pt-4">
        {/* Section Header & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-subtle-theme pb-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-accent-theme" />
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-main">
                Catatan Perjalanan
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-surface-subtle border border-theme text-xs font-semibold text-muted-theme">
                {filteredVisits.length}
              </span>
            </div>
            <p className="text-xs text-muted-theme">
              Foto dan cerita berdasarkan urutan waktu perjalanan.
            </p>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari negara, kota, tahun..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-theme bg-surface text-main focus:outline-none focus:ring-2 focus:ring-accent-theme/40 transition placeholder:text-muted-theme shadow-xs"
            />
            <Search className="w-4 h-4 text-muted-theme absolute left-3 top-2.5" />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  fetchTrips("");
                }}
                className="absolute right-2.5 top-2 text-xs text-muted-theme hover:text-main px-1"
              >
                ×
              </button>
            )}
          </form>
        </div>

        {/* 3. Spacious 2-3 Column Editorial Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="apple-card aspect-[16/10] rounded-3xl animate-pulse bg-surface-subtle"
              />
            ))}
          </div>
        ) : filteredVisits.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {filteredVisits.map((dest) => (
              <CountryCard key={dest.id} destination={dest} />
            ))}
          </div>
        ) : (
          <div className="apple-card p-12 text-center text-sm text-muted-theme space-y-2 rounded-3xl">
            <Plane className="w-8 h-8 mx-auto text-accent-theme/60 mb-2" />
            <p className="font-semibold text-main">Tidak ada perjalanan yang cocok.</p>
            <p className="text-xs text-muted-theme">
              Coba kata kunci pencarian yang lain atau bersihkan filter pencarian.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
