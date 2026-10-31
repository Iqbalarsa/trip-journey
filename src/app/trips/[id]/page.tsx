"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { LightboxModal, PhotoItem } from "@/components/LightboxModal";
import { AudioPlayer } from "@/components/AudioPlayer";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Camera,
  ExternalLink,
  Edit3,
  Share2,
  Check,
  Compass,
  LayoutGrid,
  Rows,
} from "lucide-react";

interface ChapterItem {
  id: string;
  title: string;
  narrative: string;
  audioUrl?: string | null;
  order: number;
  photos: PhotoItem[];
}

interface TripDetail {
  id: string;
  slug: string;
  title: string;
  city: string;
  country: string;
  dateLabel: string;
  quote?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  driveFolderUrl?: string | null;
  coverPhotoUrl: string | null;
  chapters: ChapterItem[];
  photos: PhotoItem[];
}

export default function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const tripIdentifier = unwrappedParams.id;

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [otherVisits, setOtherVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [allFlatPhotos, setAllFlatPhotos] = useState<PhotoItem[]>([]);
  const [copied, setCopied] = useState(false);
  const [galleryLayout, setGalleryLayout] = useState<"justified" | "masonry">("justified");

  useEffect(() => {
    fetchTrip();
  }, [tripIdentifier]);

  const fetchTrip = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripIdentifier}`);
      if (!res.ok) {
        throw new Error("Trip not found");
      }
      const data = await res.json();
      setTrip(data.trip);
      if (data.otherVisits) setOtherVisits(data.otherVisits);

      // Collect all photos in order for the Lightbox
      const collected: PhotoItem[] = [];
      if (data.trip.chapters && data.trip.chapters.length > 0) {
        data.trip.chapters.forEach((ch: ChapterItem) => {
          if (ch.photos) collected.push(...ch.photos);
        });
      }
      // If any photos were outside chapters
      if (data.trip.photos && data.trip.photos.length > 0) {
        data.trip.photos.forEach((p: PhotoItem) => {
          if (!collected.some((existing) => existing.id === p.id)) {
            collected.push(p);
          }
        });
      }
      setAllFlatPhotos(collected);
    } catch (err: any) {
      setError(err.message || "Gagal memuat catatan perjalanan");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse py-8">
        <div className="h-8 w-44 bg-surface-subtle rounded-xl" />
        <div className="h-[460px] w-full bg-surface-subtle rounded-3xl" />
        <div className="space-y-4">
          <div className="h-10 w-64 bg-surface-subtle rounded-xl" />
          <div className="grid grid-cols-3 gap-6">
            <div className="h-64 bg-surface-subtle rounded-2xl" />
            <div className="h-64 bg-surface-subtle rounded-2xl" />
            <div className="h-64 bg-surface-subtle rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="apple-card p-12 text-center space-y-4 max-w-md mx-auto my-12 rounded-3xl">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center">
          <Compass className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-main">Perjalanan Tidak Ditemukan</h2>
        <p className="text-xs text-muted-theme">
          Catatan perjalanan ini mungkin telah dipindahkan atau tautan tidak valid.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-theme text-white text-xs font-semibold apple-press shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Timeline</span>
        </Link>
      </div>
    );
  }

  const coverUrl =
    trip.coverPhotoUrl ||
    allFlatPhotos[0]?.imageUrl ||
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=80";

  const openLightboxForPhoto = (photoId: string) => {
    const idx = allFlatPhotos.findIndex((p) => p.id === photoId);
    if (idx >= 0) setActivePhotoIndex(idx);
  };

  return (
    <div className="space-y-8 sm:space-y-12 pb-24">
      {/* 1. Navigasi Atas: Tombol "← Kembali ke Timeline" & Actions */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface hover:bg-surface-elevated border border-theme text-xs font-semibold text-main transition apple-press shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-accent-theme" />
          <span>Kembali ke Timeline</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-theme bg-surface hover:bg-surface-elevated text-xs font-medium text-main transition apple-press shadow-xs"
            title="Salin tautan album ini"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-semibold">Tersalin!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-muted-theme" />
                <span className="hidden sm:inline">Bagikan</span>
              </>
            )}
          </button>

          {trip.driveFolderUrl && (
            <a
              href={trip.driveFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-theme bg-surface hover:bg-surface-elevated text-xs font-medium text-main transition apple-press shadow-xs"
              title="Buka Folder Foto Asli"
            >
              <ExternalLink className="w-3.5 h-3.5 text-accent-theme" />
              <span className="hidden sm:inline">Folder Album</span>
            </a>
          )}

          <Link
            href={`/admin?edit=${trip.id}`}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-theme bg-surface hover:bg-surface-elevated text-xs font-medium text-main transition apple-press shadow-xs"
            title="Kelola di Admin"
          >
            <Edit3 className="w-3.5 h-3.5 text-muted-theme" />
            <span className="hidden sm:inline">Edit</span>
          </Link>
        </div>
      </div>

      {/* 2. Hero Panoramic Banner: Sinematik & Elegan */}
      <div className="relative w-full aspect-[21/9] min-h-[380px] sm:min-h-[460px] max-h-[580px] rounded-3xl overflow-hidden shadow-2xl bg-black/40 border border-theme">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverUrl}
          alt={trip.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover scale-[1.02] transform transition-transform duration-1000 ease-out"
        />

        {/* Multi-Stop Cinematic Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

        {/* Hero Content: Metadata Badges & Typography */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 text-white space-y-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <div className="px-3.5 py-1.5 rounded-full bg-black/55 backdrop-blur-md border border-white/20 text-xs font-semibold flex items-center gap-1.5 text-white shadow-md">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>{trip.city}, {trip.country}</span>
            </div>

            <div className="px-3.5 py-1.5 rounded-full bg-black/55 backdrop-blur-md border border-white/20 text-xs font-medium flex items-center gap-1.5 text-white/95 shadow-md">
              <Calendar className="w-3.5 h-3.5 text-accent-text" />
              <span>{trip.dateLabel}</span>
            </div>

            {trip.latitude && trip.longitude && (
              <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/55 backdrop-blur-md border border-white/20 text-xs font-mono text-white/80 shadow-md">
                <span>
                  {trip.latitude.toFixed(4)}° N, {trip.longitude.toFixed(4)}° E
                </span>
              </div>
            )}

            <div className="px-3.5 py-1.5 rounded-full bg-black/55 backdrop-blur-md border border-white/20 text-xs font-medium flex items-center gap-1.5 text-white/95 shadow-md">
              <Camera className="w-3.5 h-3.5 text-amber-300" />
              <span>{allFlatPhotos.length} Foto</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-md leading-tight">
            {trip.title}
          </h1>

          {trip.quote && (
            <p className="text-xs sm:text-sm text-white/85 italic font-serif max-w-2xl drop-shadow-sm pt-1">
              &ldquo;{trip.quote}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* Kunjungan Lain ke Negara Ini */}
      {otherVisits.length > 0 && (
        <div className="apple-card p-4 sm:p-5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2 text-muted-theme">
            <Calendar className="w-4 h-4 text-accent-theme" />
            <span className="font-semibold text-main">
              Kunjungan Lain ke {trip.country}:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {otherVisits.map((v) => (
              <Link
                key={v.id}
                href={`/trips/${v.slug || v.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-subtle hover:bg-surface border border-theme font-medium text-main transition apple-press"
              >
                <span>{v.dateLabel}</span>
                <span className="text-[10px] text-muted-theme">
                  ({v._count?.photos || 0} foto)
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 3. Cities & Photo Chapters with Clean Postcard Gallery */}
      <section className="space-y-12 sm:space-y-16">
        {trip.chapters && trip.chapters.length > 0 ? (
          trip.chapters.map((chapter, chIdx) => (
            <div key={chapter.id || chIdx} className="space-y-6">
              {/* Editorial Chapter Header */}
              <div className="space-y-2 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-subtle-theme pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-accent-theme">
                        Chapter {chIdx + 1}
                      </span>
                      <span className="text-muted-theme text-xs">•</span>
                      <span className="text-xs text-muted-theme font-medium flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5" />
                        {chapter.photos?.length || 0} Foto
                      </span>
                      <span className="text-muted-theme text-xs">•</span>
                      <span className="text-xs text-muted-theme font-medium flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {trip.dateLabel}
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-main">
                      {chapter.title}
                    </h2>
                  </div>

                  {/* Right Header Controls: Audio & Layout Switcher */}
                  <div className="flex items-center gap-3">
                    {chapter.audioUrl && (
                      <AudioPlayer
                        src={chapter.audioUrl}
                        title={`Atmosphere • ${chapter.title.split(":")[0]}`}
                      />
                    )}

                    {/* Layout Switcher: Justified Rows (280px) vs Masonry 3 Kolom */}
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-subtle border border-theme text-xs">
                      <button
                        onClick={() => setGalleryLayout("justified")}
                        className={`p-1.5 rounded-lg transition ${
                          galleryLayout === "justified"
                            ? "bg-surface text-accent-theme shadow-xs"
                            : "text-muted-theme hover:text-main"
                        }`}
                        title="Tampilan Rapi Baris (Google Photos)"
                      >
                        <Rows className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setGalleryLayout("masonry")}
                        className={`p-1.5 rounded-lg transition ${
                          galleryLayout === "masonry"
                            ? "bg-surface text-accent-theme shadow-xs"
                            : "text-muted-theme hover:text-main"
                        }`}
                        title="Tampilan Kolom (Maksimal 3 Kolom)"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Optional travel notes / narrative description */}
                {chapter.narrative && (
                  <p className="text-xs sm:text-sm text-muted-theme leading-relaxed italic max-w-3xl pt-1">
                    &ldquo;{chapter.narrative}&rdquo;
                  </p>
                )}
              </div>

              {/* Gallery Display: 100% Clean Postcard Photos without Any Text */}
              {chapter.photos && chapter.photos.length > 0 && (
                galleryLayout === "justified" ? (
                  /* Option A: Justified Row Layout (Google Photos Style ~280px fixed height) */
                  <div className="flex flex-wrap gap-4 sm:gap-6 items-stretch">
                    {chapter.photos.map((photo) => (
                      <div
                        key={photo.id}
                        onClick={() => openLightboxForPhoto(photo.id)}
                        className="relative h-[240px] sm:h-[280px] flex-grow rounded-2xl overflow-hidden cursor-pointer bg-surface-subtle border border-theme/60 shadow-xs hover:shadow-xl hover:border-accent-theme/40 transition-all duration-300 group"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.thumbnailUrl || photo.imageUrl}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover min-w-[170px] sm:min-w-[210px] group-hover:scale-105 transition-transform duration-500 ease-out"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (photo.driveFileId && !target.src.includes("/api/drive-image")) {
                              target.src = `/api/drive-image?id=${photo.driveFileId}&s=800`;
                            }
                          }}
                        />
                      </div>
                    ))}
                    {/* Absorber spacer so the last row does not stretch unnaturally */}
                    <div className="flex-grow-[10] h-0 min-w-[200px]" />
                  </div>
                ) : (
                  /* Option B: Masonry Layout (Max 3 Columns, gap-6, no text) */
                  <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                    {chapter.photos.map((photo) => (
                      <div
                        key={photo.id}
                        onClick={() => openLightboxForPhoto(photo.id)}
                        className="break-inside-avoid rounded-2xl overflow-hidden cursor-pointer bg-surface-subtle border border-theme/60 shadow-xs hover:shadow-xl hover:border-accent-theme/40 transition-all duration-300 group"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.thumbnailUrl || photo.imageUrl}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-full h-auto block object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (photo.driveFileId && !target.src.includes("/api/drive-image")) {
                              target.src = `/api/drive-image?id=${photo.driveFileId}&s=800`;
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          ))
        ) : (
          /* Fallback if photos were not grouped into chapters */
          <div className="flex flex-wrap gap-4 sm:gap-6 items-stretch">
            {allFlatPhotos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => openLightboxForPhoto(photo.id)}
                className="relative h-[240px] sm:h-[280px] flex-grow rounded-2xl overflow-hidden cursor-pointer bg-surface-subtle border border-theme/60 shadow-xs hover:shadow-xl hover:border-accent-theme/40 transition-all duration-300 group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.thumbnailUrl || photo.imageUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover min-w-[170px] sm:min-w-[210px] group-hover:scale-105 transition-transform duration-500 ease-out"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (photo.driveFileId && !target.src.includes("/api/drive-image")) {
                      target.src = `/api/drive-image?id=${photo.driveFileId}&s=800`;
                    }
                  }}
                />
              </div>
            ))}
            <div className="flex-grow-[10] h-0 min-w-[200px]" />
          </div>
        )}
      </section>

      {/* Fullscreen Lightbox Modal (Metadata displays on click here) */}
      <LightboxModal
        photos={allFlatPhotos}
        currentIndex={activePhotoIndex}
        onClose={() => setActivePhotoIndex(null)}
        onNavigate={(newIdx) => setActivePhotoIndex(newIdx)}
      />
    </div>
  );
}
