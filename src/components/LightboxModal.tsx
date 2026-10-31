"use client";

import React, { useEffect, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";

export interface PhotoItem {
  id: string;
  driveFileId: string;
  filename: string;
  imageUrl: string;
  thumbnailUrl?: string | null;
  caption?: string | null;
  takenAt: string | Date | null;
  latitude: number | null;
  longitude: number | null;
  locationTag?: string | null;
  isCover?: boolean;
}

interface LightboxModalProps {
  photos: PhotoItem[];
  currentIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function LightboxModal({
  photos,
  currentIndex,
  onClose,
  onNavigate,
}: LightboxModalProps) {
  const isOpen = currentIndex !== null && photos.length > 0;
  const currentPhoto = isOpen ? photos[currentIndex] : null;

  const handlePrev = useCallback(() => {
    if (currentIndex === null) return;
    const nextIdx = (currentIndex - 1 + photos.length) % photos.length;
    onNavigate(nextIdx);
  }, [currentIndex, photos.length, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex === null) return;
    const nextIdx = (currentIndex + 1) % photos.length;
    onNavigate(nextIdx);
  }, [currentIndex, photos.length, onNavigate]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || !currentPhoto) return null;

  const formattedDate = currentPhoto.takenAt
    ? new Date(currentPhoto.takenAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const hasCoords =
    currentPhoto.latitude !== null &&
    currentPhoto.longitude !== null &&
    !isNaN(Number(currentPhoto.latitude)) &&
    !isNaN(Number(currentPhoto.longitude));

  const driveViewUrl = `https://drive.google.com/file/d/${currentPhoto.driveFileId}/view`;

  // Clean photo title (Filters out raw camera filenames like IMG_XXXX.HEIC)
  const isRawFilename = (str?: string | null) => {
    if (!str) return true;
    return /^(IMG_|DSC_|DJI_|PXP_|SAM_|PHOTO_|\d{8}_\d{6})|\.(heic|jpg|jpeg|png|webp|avif)$/i.test(str.trim());
  };

  const displayTitle =
    currentPhoto.caption && !isRawFilename(currentPhoto.caption)
      ? currentPhoto.caption
      : currentPhoto.locationTag || `Foto ${currentIndex + 1}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black/92 backdrop-blur-2xl text-white select-none transition-all duration-200">
      {/* Top Bar: Clean Title, Counter, Close */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 z-20 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/80">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-semibold tracking-tight text-white/95 max-w-[200px] sm:max-w-md truncate">
              {displayTitle}
            </div>
            <div className="text-[11px] text-white/50">
              Foto {currentIndex + 1} dari {photos.length}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={driveViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white/90 transition apple-press"
            title="Buka foto asli resolusi penuh"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Foto Asli</span>
          </a>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition apple-press"
            aria-label="Close Lightbox"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Center Image View & Controls */}
      <div className="relative flex-1 flex items-center justify-center p-2 sm:p-6 min-h-0">
        {/* Previous Button */}
        {photos.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-3 sm:left-6 z-20 w-11 h-11 rounded-full flex items-center justify-center bg-black/50 hover:bg-black/75 border border-white/20 text-white transition apple-press"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* The Image */}
        <div className="relative max-w-full max-h-full flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentPhoto.imageUrl}
            alt={currentPhoto.filename}
            referrerPolicy="no-referrer"
            className="max-h-[75vh] sm:max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl transition-transform duration-200"
            loading="eager"
            onError={(e) => {
              const target = e.currentTarget;
              if (currentPhoto.driveFileId && !target.src.includes("/api/drive-image")) {
                target.src = `/api/drive-image?id=${currentPhoto.driveFileId}&s=1600`;
              }
            }}
          />
        </div>

        {/* Next Button */}
        {photos.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-3 sm:right-6 z-20 w-11 h-11 rounded-full flex items-center justify-center bg-black/50 hover:bg-black/75 border border-white/20 text-white transition apple-press"
            aria-label="Next photo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Metadata Pill & Thumbnails */}
      <div className="px-4 py-3 sm:py-4 z-20 border-t border-white/10 bg-black/40 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Metadata badges */}
        <div className="flex flex-wrap items-center gap-2">
          {formattedDate && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-white/80">
              <Calendar className="w-3.5 h-3.5 text-accent-text" />
              <span>{formattedDate}</span>
            </div>
          )}

          {hasCoords && (
            <a
              href={`https://www.google.com/maps?q=${currentPhoto.latitude},${currentPhoto.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-white/80 hover:bg-white/20 transition"
              title="Open location on Google Maps"
            >
              <MapPin className="w-3.5 h-3.5 text-red-400" />
              <span>
                {currentPhoto.latitude?.toFixed(4)}, {currentPhoto.longitude?.toFixed(4)}
              </span>
            </a>
          )}

          <div className="px-2.5 py-1 rounded-full bg-white/5 text-[11px] text-white/60">
            CDN 1600px
          </div>
        </div>

        {/* Thumbnail Preview strip for quick hopping */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full sm:max-w-md py-1">
          {photos.slice(0, 15).map((p, idx) => (
            <button
              key={p.id || idx}
              onClick={() => onNavigate(idx)}
              className={`relative shrink-0 w-8 h-8 rounded-lg overflow-hidden border transition ${
                idx === currentIndex
                  ? "border-accent-theme ring-2 ring-accent-glow scale-105"
                  : "border-white/20 opacity-60 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.thumbnailUrl || p.imageUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
          {photos.length > 15 && (
            <span className="text-[10px] text-white/40 pl-1">
              +{photos.length - 15} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

