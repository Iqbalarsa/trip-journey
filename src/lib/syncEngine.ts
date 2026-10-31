import { prisma } from "./prisma";
import {
  extractDriveFolderId,
  syncDriveFolder,
  SyncedPhoto,
  reverseGeocode,
  getFolderMetadata,
  listSubfolders,
  listFolderImages,
  getApiKey,
} from "./drive";
import { slugify } from "./utils";

const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function formatDateLabel(startDate: Date, endDate: Date): string {
  const startDay = startDate.getDate();
  const startMonth = MONTH_NAMES_ID[startDate.getMonth()];
  const startYear = startDate.getFullYear();

  const endDay = endDate.getDate();
  const endMonth = MONTH_NAMES_ID[endDate.getMonth()];
  const endYear = endDate.getFullYear();

  if (startYear === endYear) {
    if (startMonth === endMonth) {
      if (startDay === endDay) {
        return `${startDay} ${startMonth} ${startYear}`;
      }
      return `${startDay} – ${endDay} ${startMonth} ${startYear}`;
    }
    return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${startYear}`;
  }
  return `${startDay} ${startMonth} ${startYear} – ${endDay} ${endMonth} ${endYear}`;
}

export interface PhotoCluster {
  startDate: Date;
  endDate: Date;
  dateLabel: string;
  photos: SyncedPhoto[];
  cities: Set<string>;
  latitude: number | null;
  longitude: number | null;
}

/**
 * Clusters photos into separate visits based on a time gap threshold (> 14 days)
 */
export function clusterPhotosByTime(
  photos: SyncedPhoto[],
  maxGapDays = 14
): PhotoCluster[] {
  if (!photos || photos.length === 0) return [];

  // Sort photos chronologically by takenAt
  const sorted = [...photos].sort((a, b) => {
    const timeA = a.takenAt ? new Date(a.takenAt).getTime() : 0;
    const timeB = b.takenAt ? new Date(b.takenAt).getTime() : 0;
    return timeA - timeB;
  });

  const maxGapMs = maxGapDays * 24 * 60 * 60 * 1000;
  const clusters: PhotoCluster[] = [];

  for (const photo of sorted) {
    const photoTime = photo.takenAt ? new Date(photo.takenAt) : new Date();

    if (clusters.length === 0) {
      clusters.push({
        startDate: photoTime,
        endDate: photoTime,
        dateLabel: "",
        photos: [photo],
        cities: new Set(photo.cityName && photo.cityName !== "Main" ? [photo.cityName] : []),
        latitude: photo.latitude,
        longitude: photo.longitude,
      });
      continue;
    }

    const currentCluster = clusters[clusters.length - 1];
    const diffMs = photoTime.getTime() - currentCluster.endDate.getTime();

    if (diffMs > maxGapMs) {
      // Time gap > 14 days: Create a new visit cluster
      clusters.push({
        startDate: photoTime,
        endDate: photoTime,
        dateLabel: "",
        photos: [photo],
        cities: new Set(photo.cityName && photo.cityName !== "Main" ? [photo.cityName] : []),
        latitude: photo.latitude,
        longitude: photo.longitude,
      });
    } else {
      // Same visit: add photo to current cluster
      currentCluster.photos.push(photo);
      if (photoTime.getTime() > currentCluster.endDate.getTime()) {
        currentCluster.endDate = photoTime;
      }
      if (photo.cityName && photo.cityName !== "Main") {
        currentCluster.cities.add(photo.cityName);
      }
      if (!currentCluster.latitude && photo.latitude) {
        currentCluster.latitude = photo.latitude;
        currentCluster.longitude = photo.longitude;
      }
    }
  }

  // Format date labels for each cluster
  for (const cluster of clusters) {
    cluster.dateLabel = formatDateLabel(cluster.startDate, cluster.endDate);
  }

  return clusters;
}

export interface SyncCountryResult {
  success: boolean;
  country: string;
  driveFolderId: string;
  totalDrivePhotos: number;
  newPhotosCount: number;
  existingPhotosCount: number;
  visits: {
    tripId: string;
    slug: string;
    title: string;
    dateLabel: string;
    city: string;
    photoCount: number;
    isNewTrip: boolean;
  }[];
}

/**
 * Normalizes country names from geocoding or folder names
 */
function cleanCountryName(name?: string): string {
  if (!name) return "Travel Destination";
  const trimmed = name.trim();
  if (trimmed === "Czech Republic") return "Czechia";
  if (trimmed.includes("Holy See") || trimmed.includes("Vatican")) return "Vatican City";
  return trimmed;
}

/**
 * Internal worker to sync a single country folder into Prisma database
 */
async function syncSingleCountryInternal({
  folderId,
  folderName,
  folderUrl,
}: {
  folderId: string;
  folderName?: string;
  folderUrl: string;
}): Promise<SyncCountryResult> {
  // Fetch photos from Google Drive for this country
  const driveResult = await syncDriveFolder(folderId, undefined, folderName);
  const allPhotos = driveResult.photos || [];

  if (allPhotos.length === 0) {
    return {
      success: true,
      country: folderName || "Travel Destination",
      driveFolderId: folderId,
      totalDrivePhotos: 0,
      newPhotosCount: 0,
      existingPhotosCount: 0,
      visits: [],
    };
  }

  // Determine Country Name
  let country = driveResult.suggestedCountry;
  if (!country) {
    const gpsPhoto = allPhotos.find((p) => p.latitude && p.longitude);
    if (gpsPhoto && gpsPhoto.latitude && gpsPhoto.longitude) {
      const geo = await reverseGeocode(gpsPhoto.latitude, gpsPhoto.longitude);
      if (geo.country) country = geo.country;
    }
  }

  country = cleanCountryName(country || folderName || driveResult.folderName);

  // Smart Folder Date Inheritance:
  // If a photo lacks camera EXIF date (e.g. from Telegram/WhatsApp/screenshot),
  // inherit the date from photos in the same city folder so it doesn't split into a weird new visit.
  const cityDatesMap = new Map<string, Date[]>();
  for (const p of allPhotos) {
    if (p.hasExifDate && p.takenAt) {
      const k = p.cityName || "Main";
      if (!cityDatesMap.has(k)) cityDatesMap.set(k, []);
      cityDatesMap.get(k)!.push(new Date(p.takenAt));
    }
  }

  const allExifDates = Array.from(cityDatesMap.values()).flat();
  const countryFallbackDate = allExifDates.length > 0 ? allExifDates[0] : null;

  for (const p of allPhotos) {
    if (!p.hasExifDate) {
      const k = p.cityName || "Main";
      const pool = cityDatesMap.get(k);
      if (pool && pool.length > 0) {
        p.takenAt = pool[0];
      } else if (countryFallbackDate) {
        p.takenAt = countryFallbackDate;
      }
    }
  }

  // Cluster photos by >14 days gap
  const clusters = clusterPhotosByTime(allPhotos, 14);

  // Check which photos already exist in database to prevent duplicates
  const allDriveFileIds = allPhotos.map((p) => p.driveFileId);
  const existingPhotos = await prisma.photo.findMany({
    where: { driveFileId: { in: allDriveFileIds } },
    select: { driveFileId: true, tripId: true },
  });
  const existingIdSet = new Set(existingPhotos.map((p) => p.driveFileId));

  let totalNewPhotos = 0;
  const visitSummaries: SyncCountryResult["visits"] = [];

  for (const cluster of clusters) {
    const clusterCities = Array.from(cluster.cities);
    const cityLabel = clusterCities.length > 0 ? clusterCities.join(", ") : country;
    const baseSlug = slugify(`${country}-${cluster.dateLabel}`);
    const tripTitle = `${country} — ${cluster.dateLabel}`;

    // Find if a Trip for this visit already exists
    let trip = await prisma.trip.findFirst({
      where: {
        OR: [
          { driveFolderId: folderId, dateLabel: cluster.dateLabel },
          { slug: baseSlug },
        ],
      },
      include: { chapters: true },
    });

    let isNewTrip = false;

    if (!trip) {
      isNewTrip = true;
      let finalSlug = baseSlug;
      let count = 1;
      while (await prisma.trip.findUnique({ where: { slug: finalSlug } })) {
        finalSlug = `${baseSlug}-${count++}`;
      }

      trip = await prisma.trip.create({
        data: {
          title: tripTitle,
          slug: finalSlug,
          country,
          city: cityLabel,
          dateLabel: cluster.dateLabel,
          status: "PUBLISHED",
          latitude: cluster.latitude,
          longitude: cluster.longitude,
          driveFolderUrl: folderUrl.trim(),
          driveFolderId: folderId,
          coverPhotoUrl: cluster.photos[0]?.imageUrl || null,
        },
        include: { chapters: true },
      });
    } else {
      // Update existing trip with any newly detected cities or coordinates
      await prisma.trip.update({
        where: { id: trip.id },
        data: {
          city: cityLabel,
          driveFolderUrl: folderUrl.trim(),
          driveFolderId: folderId,
          latitude: trip.latitude || cluster.latitude,
          longitude: trip.longitude || cluster.longitude,
          coverPhotoUrl: trip.coverPhotoUrl || cluster.photos[0]?.imageUrl || null,
        },
      });
    }

    // Ensure Chapters exist for each city in this cluster
    const existingChapters = trip.chapters || [];
    const chapterMap = new Map<string, string>(); // cityName -> chapterId

    let orderIdx = existingChapters.length + 1;
    for (const cityName of clusterCities) {
      const match = existingChapters.find(
        (c) => c.title.toLowerCase() === cityName.toLowerCase()
      );
      if (match) {
        chapterMap.set(cityName.toLowerCase(), match.id);
      } else {
        const newChapter = await prisma.chapter.create({
          data: {
            tripId: trip.id,
            title: cityName,
            narrative: "",
            order: orderIdx++,
          },
        });
        chapterMap.set(cityName.toLowerCase(), newChapter.id);
      }
    }

    // Process photos for this cluster:
    // 1. If photo already in DB, ensure it is connected to this visit trip and chapter
    // 2. If photo is new, insert it!
    for (let idx = 0; idx < cluster.photos.length; idx++) {
      const p = cluster.photos[idx];
      let assignedChapterId: string | null = null;
      if (p.cityName && chapterMap.has(p.cityName.toLowerCase())) {
        assignedChapterId = chapterMap.get(p.cityName.toLowerCase()) || null;
      }

      if (existingIdSet.has(p.driveFileId)) {
        await prisma.photo.update({
          where: { driveFileId: p.driveFileId },
          data: {
            tripId: trip.id,
            chapterId: assignedChapterId,
            locationTag: p.cityName ? `${p.cityName}, ${country}` : country,
          },
        });
      } else {
        await prisma.photo.create({
          data: {
            tripId: trip.id,
            chapterId: assignedChapterId,
            driveFileId: p.driveFileId,
            filename: p.filename,
            imageUrl: p.imageUrl,
            takenAt: p.takenAt,
            latitude: p.latitude,
            longitude: p.longitude,
            locationTag: p.cityName ? `${p.cityName}, ${country}` : country,
            isCover: idx === 0 && !trip.coverPhotoUrl,
          },
        });
        totalNewPhotos++;
        existingIdSet.add(p.driveFileId);
      }
    }

    // Ensure trip has a cover photo from its photos
    if (!trip.coverPhotoUrl && cluster.photos.length > 0) {
      await prisma.trip.update({
        where: { id: trip.id },
        data: { coverPhotoUrl: cluster.photos[0].imageUrl },
      });
    }

    // Count total photos now associated with this trip
    const currentPhotoCount = await prisma.photo.count({
      where: { tripId: trip.id },
    });

    visitSummaries.push({
      tripId: trip.id,
      slug: trip.slug,
      title: trip.title,
      dateLabel: trip.dateLabel,
      city: cityLabel,
      photoCount: currentPhotoCount,
      isNewTrip,
    });
  }

  // Clean up any old empty trips with 0 photos for this folder
  try {
    const emptyTrips = await prisma.trip.findMany({
      where: {
        driveFolderId: folderId,
        photos: { none: {} },
      },
      select: { id: true },
    });
    for (const empty of emptyTrips) {
      await prisma.trip.delete({ where: { id: empty.id } });
    }
  } catch (cleanErr) {
    console.warn("Could not clean up empty trips:", cleanErr);
  }

  return {
    success: true,
    country,
    driveFolderId: folderId,
    totalDrivePhotos: allPhotos.length,
    newPhotosCount: totalNewPhotos,
    existingPhotosCount: existingIdSet.size - totalNewPhotos,
    visits: visitSummaries,
  };
}

/**
 * Syncs a Google Drive Country Folder OR a Master Trips Folder:
 * 1. Automatically detects whether the folder is a Master Trips Folder (contains country subfolders)
 *    or a single Country Folder.
 * 2. If Master Folder, recursively syncs all country subfolders into separate Trips.
 * 3. If Country Folder, syncs that country and clusters visits (>14 days gap).
 * 4. Inserts new photos into DB without duplicating existing driveFileIds.
 */
export async function syncCountryFolder(
  folderUrl: string
): Promise<SyncCountryResult> {
  const folderId = extractDriveFolderId(folderUrl);
  if (!folderId) {
    throw new Error("Invalid Google Drive folder link or folder ID.");
  }

  const effectiveKey = getApiKey();

  // 1. Inspect folder metadata, subfolders, and direct photos
  const folderMeta = await getFolderMetadata(folderId, effectiveKey || undefined);
  const folderName = folderMeta?.name || "";
  const subfolders = await listSubfolders(folderId, effectiveKey || undefined);
  const directImages = await listFolderImages(folderId, effectiveKey || undefined, 5);

  // 2. Check if this folder is a Master Trips Folder
  let isMasterFolder = false;

  if (directImages.length === 0 && subfolders.length > 0) {
    // Check if the folder name indicates a collection or trips root
    const isNamedMaster = /trips?|travels?|liburan|kembara|vacation|holidays?|destinasi|destinations?/i.test(
      folderName
    );

    // Check if any subfolder contains its own subfolders (e.g. Country -> City)
    let hasChildSubfolders = false;
    for (const sub of subfolders.slice(0, 5)) {
      const childSubs = await listSubfolders(sub.id, effectiveKey || undefined);
      if (childSubs.length > 0) {
        hasChildSubfolders = true;
        break;
      }
    }

    if (hasChildSubfolders || isNamedMaster) {
      isMasterFolder = true;
    }
  }

  // 3. Handle Master Trips Folder: iterate each Country subfolder
  if (isMasterFolder) {
    const syncedCountries: string[] = [];
    const allVisits: SyncCountryResult["visits"] = [];
    let totalDrivePhotos = 0;
    let totalNewPhotos = 0;
    let totalExistingPhotos = 0;

    for (const sub of subfolders) {
      try {
        const countryResult = await syncSingleCountryInternal({
          folderId: sub.id,
          folderName: sub.name,
          folderUrl: `https://drive.google.com/drive/folders/${sub.id}`,
        });

        if (countryResult.totalDrivePhotos > 0 || countryResult.visits.length > 0) {
          syncedCountries.push(countryResult.country);
          allVisits.push(...countryResult.visits);
          totalDrivePhotos += countryResult.totalDrivePhotos;
          totalNewPhotos += countryResult.newPhotosCount;
          totalExistingPhotos += countryResult.existingPhotosCount;
        }
      } catch (err) {
        console.warn(`Could not sync country folder "${sub.name}" (${sub.id}):`, err);
      }
    }

    if (allVisits.length === 0 && totalDrivePhotos === 0) {
      throw new Error(
        "Tidak ada foto yang ditemukan di dalam subfolder negara Google Drive. Pastikan folder dapat diakses publik ('Anyone with the link can view')."
      );
    }

    return {
      success: true,
      country: `${syncedCountries.length} Negara (${syncedCountries.join(", ")})`,
      driveFolderId: folderId,
      totalDrivePhotos,
      newPhotosCount: totalNewPhotos,
      existingPhotosCount: totalExistingPhotos,
      visits: allVisits,
    };
  }

  // 4. Handle Single Country Folder
  return await syncSingleCountryInternal({
    folderId,
    folderName,
    folderUrl,
  });
}
