import { slugify } from "./utils";

export { slugify };

export interface SyncedPhoto {
  driveFileId: string;
  filename: string;
  imageUrl: string;
  thumbnailUrl?: string;
  takenAt: Date | null;
  latitude: number | null;
  longitude: number | null;
  locationTag?: string;
  cityName?: string;
}

export interface CityGroup {
  name: string;
  photoCount: number;
  photos: SyncedPhoto[];
}

export interface SyncDriveResult {
  photos: SyncedPhoto[];
  cities: CityGroup[];
  suggestedCity?: string;
  suggestedCountry?: string;
  folderName?: string;
}

/**
 * Parses any Google Drive URL (folders, sharing URLs, files, or bare ID)
 * and extracts the Google Drive Folder or File ID.
 */
export function extractDriveFolderId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // Pattern 1: drive.google.com/drive/folders/{id} or /u/0/folders/{id}
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]{15,})/);
  if (folderMatch) return folderMatch[1];

  // Pattern 2: id= query parameter
  const queryMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
  if (queryMatch) return queryMatch[1];

  // Pattern 3: drive.google.com/file/d/{id}
  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]{15,})/);
  if (fileMatch) return fileMatch[1];

  // Pattern 4: Bare ID
  if (/^[a-zA-Z0-9_-]{15,60}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Resolves Google API Key from params or env
 */
export function getApiKey(providedKey?: string): string | null {
  let raw: string | null = null;
  if (providedKey && providedKey.trim() !== "") {
    raw = providedKey.trim();
  } else if (
    typeof process !== "undefined" &&
    process.env &&
    process.env.GOOGLE_API_KEY &&
    process.env.GOOGLE_API_KEY.trim() !== "" &&
    process.env.GOOGLE_API_KEY !== "your_google_cloud_api_key_here"
  ) {
    raw = process.env.GOOGLE_API_KEY.trim();
  }

  if (raw) {
    // Sanitize in case key was accidentally pasted twice or prefixed (e.g. AIzaSy...AIzaSy...)
    const match = raw.match(/(AIzaSy[a-zA-Z0-9_-]{33})/);
    if (match) return match[1];
    return raw;
  }

  return null;
}

/**
 * Reverse geocodes GPS coordinates to automatically detect Country and City
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<{ country?: string; city?: string }> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&accept-language=en`;
    const res = await fetch(url, {
      headers: { "User-Agent": "CatatanKembaraApp/1.0 (travel@catatankembara.local)" },
      cache: "force-cache",
    });
    if (res.ok) {
      const data = await res.json();
      let country = data.address?.country;
      if (country === "Czech Republic") country = "Czechia";
      if (country?.includes("Holy See") || country?.includes("Vatican")) country = "Vatican City";

      const city =
        data.address?.city ||
        data.address?.town ||
        data.address?.municipality ||
        data.address?.state;
      return { country, city };
    }
  } catch (err) {
    console.warn("Reverse geocode failed:", err);
  }
  return {};
}

/**
 * Normalizes EXIF timestamp from iPhone/cameras
 */
export function parseExifDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  try {
    if (typeof dateStr === "string" && /^\d{4}:\d{2}:\d{2}/.test(dateStr)) {
      const formatted = dateStr.slice(0, 10).replace(/:/g, "-") + "T" + dateStr.slice(11);
      const d = new Date(formatted);
      if (!isNaN(d.getTime())) return d;
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/**
 * Helper to fetch folder metadata (ID and Name)
 */
export async function getFolderMetadata(
  folderId: string,
  apiKey?: string
): Promise<{ id: string; name: string } | null> {
  const effectiveKey = getApiKey(apiKey);
  if (!effectiveKey) return null;

  try {
    const url = `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType&key=${effectiveKey}`;
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      return { id: data.id, name: data.name };
    }
  } catch (err) {
    console.warn("getFolderMetadata exception:", err);
  }
  return null;
}

/**
 * Lists immediate subfolders inside a parent folder, with pagination support
 */
export async function listSubfolders(
  folderId: string,
  apiKey?: string
): Promise<{ id: string; name: string }[]> {
  const effectiveKey = getApiKey(apiKey);
  if (!effectiveKey) return [];

  const subfolders: { id: string; name: string }[] = [];
  let pageToken: string | undefined = undefined;

  try {
    do {
      const q = `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      let url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        q
      )}&fields=nextPageToken,files(id,name)&pageSize=100&key=${effectiveKey}`;
      if (pageToken) {
        url += `&pageToken=${encodeURIComponent(pageToken)}`;
      }

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) break;
      const data = await res.json();
      if (data.files && Array.isArray(data.files)) {
        subfolders.push(...data.files);
      }
      pageToken = data.nextPageToken;
    } while (pageToken && subfolders.length < 200);
  } catch (err) {
    console.warn("listSubfolders exception:", err);
  }

  return subfolders;
}

/**
 * Lists image files inside a folder, with pagination support
 */
export async function listFolderImages(
  folderId: string,
  apiKey?: string,
  maxPhotos = 400
): Promise<any[]> {
  const effectiveKey = getApiKey(apiKey);
  if (!effectiveKey) return [];

  const fields =
    "nextPageToken,files(id, name, mimeType, thumbnailLink, imageMediaMetadata, webViewLink, createdTime)";
  const images: any[] = [];
  let pageToken: string | undefined = undefined;

  try {
    do {
      const q = `'${folderId}' in parents and (mimeType contains 'image/' or mimeType contains 'heic') and trashed = false`;
      let url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        q
      )}&fields=${encodeURIComponent(fields)}&pageSize=100&key=${effectiveKey}`;
      if (pageToken) {
        url += `&pageToken=${encodeURIComponent(pageToken)}`;
      }

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) break;
      const data = await res.json();
      if (data.files && Array.isArray(data.files)) {
        images.push(...data.files);
      }
      pageToken = data.nextPageToken;
    } while (pageToken && images.length < maxPhotos);
  } catch (err) {
    console.warn("listFolderImages exception:", err);
  }

  return images;
}

/**
 * Cleans city folder names (e.g. "Saint-Josse-ten-Noode - Sint-Joost-ten-Node" -> "Saint-Josse-ten-Noode")
 */
function cleanCityName(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.includes(" - ")) {
    return trimmed.split(" - ")[0].trim();
  }
  return trimmed;
}

/**
 * Fetch photos from a public Google Drive folder using Google Drive API v3.
 * Automatically identifies country via iPhone GPS or folder metadata,
 * groups cities into sections, and formats zero-storage high-res CDN previews.
 */
export async function syncDriveFolder(
  folderId: string,
  apiKey?: string,
  overrideFolderName?: string
): Promise<SyncDriveResult> {
  const effectiveKey = getApiKey(apiKey);

  if (effectiveKey) {
    try {
      // Resolve folder name
      let folderName = overrideFolderName;
      if (!folderName) {
        const meta = await getFolderMetadata(folderId, effectiveKey);
        if (meta?.name) folderName = meta.name;
      }

      // 1. Fetch direct images in root folder
      const directFiles = await listFolderImages(folderId, effectiveKey);

      // 2. Fetch subfolders (cities)
      const subfolders = await listSubfolders(folderId, effectiveKey);

      const citiesMap = new Map<string, SyncedPhoto[]>();

      // Parse direct files
      if (directFiles.length > 0) {
        const directPhotos = mapDriveFilesToPhotos(directFiles, "Main");
        citiesMap.set("Main", directPhotos);
      }

      // Parse subfolders per city
      for (const sub of subfolders) {
        const cityName = cleanCityName(sub.name);

        // Fetch images in city subfolder
        let subFiles = await listFolderImages(sub.id, effectiveKey);

        // If no direct images, check if city folder itself has nested subfolders
        if (subFiles.length === 0) {
          const nestedSubs = await listSubfolders(sub.id, effectiveKey);
          for (const nested of nestedSubs) {
            const nestedFiles = await listFolderImages(nested.id, effectiveKey);
            subFiles.push(...nestedFiles);
          }
        }

        if (subFiles.length > 0) {
          const subPhotos = mapDriveFilesToPhotos(subFiles, cityName);
          if (citiesMap.has(cityName)) {
            citiesMap.get(cityName)!.push(...subPhotos);
          } else {
            citiesMap.set(cityName, subPhotos);
          }
        }
      }

      const allPhotos: SyncedPhoto[] = [];
      const cities: CityGroup[] = [];

      for (const [cityName, photos] of citiesMap.entries()) {
        allPhotos.push(...photos);
        cities.push({
          name: cityName,
          photoCount: photos.length,
          photos,
        });
      }

      if (allPhotos.length > 0) {
        // Detect Country / City from GPS
        let detectedCountry: string | undefined = undefined;
        let detectedCity: string | undefined =
          cities.length > 0 && cities[0].name !== "Main" ? cities[0].name : undefined;

        const photoWithGps = allPhotos.find(
          (p) => p.latitude !== null && p.longitude !== null
        );

        if (photoWithGps && photoWithGps.latitude && photoWithGps.longitude) {
          const geo = await reverseGeocode(photoWithGps.latitude, photoWithGps.longitude);
          if (geo.country) detectedCountry = geo.country;
          if (!detectedCity && geo.city) detectedCity = geo.city;
        }

        return {
          photos: allPhotos,
          cities,
          suggestedCity: detectedCity,
          suggestedCountry: detectedCountry || folderName,
          folderName,
        };
      }
    } catch (err) {
      console.warn("Drive API fetch exception:", err);
    }
  }

  // Fallback: Public Folder HTML Scraping
  try {
    const publicUrl = `https://drive.google.com/drive/folders/${folderId}`;
    const pageRes = await fetch(publicUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      cache: "no-store",
    });

    if (pageRes.ok) {
      const html = await pageRes.text();
      const photos = extractPhotosFromDriveHtml(html);
      if (photos.length > 0) {
        return {
          photos,
          cities: [{ name: "Photos", photoCount: photos.length, photos }],
          folderName: overrideFolderName,
        };
      }
    }
  } catch (err) {
    console.warn("Public drive HTML scrape exception:", err);
  }

  throw new Error(
    "Could not sync photos from this Google Drive folder.\n" +
    "1. Make sure the folder is set to 'Anyone with the link can view' (Viewer access).\n" +
    "2. Ensure the folder contains photos or subfolders with photos."
  );
}

function mapDriveFilesToPhotos(files: any[], cityName: string): SyncedPhoto[] {
  return files.map((file: any) => {
    const rawTime = file.imageMediaMetadata?.time || file.createdTime;
    const lat = file.imageMediaMetadata?.location?.latitude ?? null;
    const lng = file.imageMediaMetadata?.location?.longitude ?? null;

    // Use permanent CDN endpoint by Google Drive file ID
    const highResUrl = `https://lh3.googleusercontent.com/d/${file.id}=s1600`;
    const thumbUrl = `https://lh3.googleusercontent.com/d/${file.id}=s800`;

    return {
      driveFileId: file.id,
      filename: file.name,
      imageUrl: highResUrl,
      thumbnailUrl: thumbUrl,
      takenAt: parseExifDate(rawTime),
      latitude: typeof lat === "number" ? lat : null,
      longitude: typeof lng === "number" ? lng : null,
      cityName,
      locationTag: cityName,
    };
  });
}

/**
 * Extracts image file IDs and names from public Google Drive folder HTML.
 */
function extractPhotosFromDriveHtml(html: string): SyncedPhoto[] {
  const foundMap = new Map<string, string>();

  const regex = /\["([a-zA-Z0-9_-]{25,50})",\s*\["([^"]+\.(?:jpg|jpeg|png|webp|heic|avif|gif))"/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const fileId = match[1];
    const filename = match[2];
    if (!foundMap.has(fileId)) {
      foundMap.set(fileId, filename);
    }
  }

  if (foundMap.size === 0) {
    const altRegex = /"([a-zA-Z0-9_-]{28,45})"[^}]*?"title":"([^"]+\.(?:jpg|jpeg|png|webp|heic|avif|gif))"/gi;
    let altMatch;
    while ((altMatch = altRegex.exec(html)) !== null) {
      const fileId = altMatch[1];
      const filename = altMatch[2];
      if (!foundMap.has(fileId)) {
        foundMap.set(fileId, filename);
      }
    }
  }

  return Array.from(foundMap.entries()).map(([fileId, filename]) => ({
    driveFileId: fileId,
    filename,
    imageUrl: `https://lh3.googleusercontent.com/d/${fileId}=s1600`,
    thumbnailUrl: `https://lh3.googleusercontent.com/d/${fileId}=s800`,
    takenAt: null,
    latitude: null,
    longitude: null,
  }));
}
