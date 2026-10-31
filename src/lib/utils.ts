import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Creates a clean URL-friendly slug from title
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/&/g, "-and-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

const MONTH_INDEX_MAP: Record<string, number> = {
  januari: 0, january: 0, jan: 0,
  februari: 1, february: 1, feb: 1,
  maret: 2, march: 2, mar: 2,
  april: 3, apr: 3,
  mei: 4, may: 4,
  juni: 5, june: 5, jun: 5,
  juli: 6, july: 6, jul: 6,
  agustus: 7, august: 7, aug: 7,
  september: 8, sept: 8, sep: 8,
  oktober: 9, october: 9, okt: 9, oct: 9,
  november: 10, nov: 10,
  desember: 11, december: 11, des: 11, dec: 11,
};

/**
 * Extracts a comparable millisecond timestamp from dateLabel (e.g. "Juni 2026", "November 2025")
 */
export function parseDateLabelToTimestamp(dateLabel?: string | null): number {
  if (!dateLabel) return 0;
  const raw = dateLabel.toLowerCase().trim();

  // Find 4-digit year (e.g. 2026, 2025)
  const yearMatch = raw.match(/\b(19\d{2}|20\d{2})\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : 2024;

  // Find month: if range like "September – Oktober 2024", search for any matching month name
  let month = 0;
  for (const [mName, mIdx] of Object.entries(MONTH_INDEX_MAP)) {
    if (raw.includes(mName)) {
      month = mIdx;
    }
  }

  // Day number if present e.g. "19 Januari 2026"
  const dayMatch = raw.match(/\b([1-9]|[12]\d|3[01])\b/);
  const day = dayMatch ? parseInt(dayMatch[1], 10) : 1;

  return new Date(year, month, day).getTime();
}

/**
 * Gets the most accurate timestamp for a trip to order by timeline recency:
 * Priority 1: Actual photo timestamps (`takenAt`)
 * Priority 2: Parsed `dateLabel` (e.g. "Juni 2026")
 * Priority 3: `createdAt` fallback
 */
export function getTripTimelineTimestamp(trip: {
  dateLabel?: string | null;
  photos?: { takenAt?: Date | string | null }[];
  createdAt?: Date | string;
}): number {
  if (trip.photos && trip.photos.length > 0) {
    const validTimes = trip.photos
      .map((p) => (p.takenAt ? new Date(p.takenAt).getTime() : 0))
      .filter((t) => t > 0);
    if (validTimes.length > 0) {
      return Math.max(...validTimes);
    }
  }

  const labelTime = parseDateLabelToTimestamp(trip.dateLabel);
  if (labelTime > 0) return labelTime;

  if (trip.createdAt) {
    const createdTime = new Date(trip.createdAt).getTime();
    if (!isNaN(createdTime)) return createdTime;
  }

  return 0;
}
