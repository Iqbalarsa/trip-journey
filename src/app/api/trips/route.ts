import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractDriveFolderId, slugify } from "@/lib/drive";
import { getTripTimelineTimestamp } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const country = searchParams.get("country")?.trim() || "";
    const year = searchParams.get("year")?.trim() || "";
    const admin = searchParams.get("admin") === "true";

    const andConditions: any[] = [];

    // Filter by published status for public view
    if (!admin) {
      andConditions.push({ status: "PUBLISHED" });
    }

    if (search) {
      andConditions.push({
        OR: [
          { title: { contains: search } },
          { city: { contains: search } },
          { country: { contains: search } },
          { quote: { contains: search } },
          { dateLabel: { contains: search } },
        ],
      });
    }

    if (country && country !== "All") {
      andConditions.push({ country: { equals: country } });
    }

    if (year && year !== "All") {
      andConditions.push({ dateLabel: { contains: year } });
    }

    const whereClause = andConditions.length > 0 ? { AND: andConditions } : {};

    const trips = await prisma.trip.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { photos: true, chapters: true },
        },
        photos: {
          take: 4,
          select: {
            id: true,
            imageUrl: true,
            isCover: true,
            driveFileId: true,
            takenAt: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    // Sort trips strictly by timeline date: newest visit first!
    trips.sort(
      (a, b) => getTripTimelineTimestamp(b) - getTripTimelineTimestamp(a)
    );

    return NextResponse.json({ trips });
  } catch (err: any) {
    console.error("Failed to fetch trips:", err);
    return NextResponse.json(
      { error: "Failed to fetch trips from database." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      slug: customSlug,
      city,
      country,
      dateLabel,
      quote,
      status = "PUBLISHED",
      latitude: inputLat,
      longitude: inputLng,
      driveFolderUrl,
      coverPhotoUrl,
      chapters = [],
      photos = [],
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Trip title is required." },
        { status: 400 }
      );
    }

    if (!city || !city.trim() || !country || !country.trim()) {
      return NextResponse.json(
        { error: "City and Country are required." },
        { status: 400 }
      );
    }

    // Generate unique slug
    let baseSlug = customSlug ? slugify(customSlug) : slugify(title);
    if (!baseSlug) baseSlug = "trip-" + Date.now();

    // Check slug collision
    let finalSlug = baseSlug;
    let count = 1;
    while (await prisma.trip.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${count++}`;
    }

    const driveFolderId = driveFolderUrl
      ? extractDriveFolderId(driveFolderUrl) || null
      : null;

    // Determine destination coordinates:
    // If not manually entered, derive from photos with GPS
    let finalLat = typeof inputLat === "number" && !isNaN(inputLat) ? inputLat : null;
    let finalLng = typeof inputLng === "number" && !isNaN(inputLng) ? inputLng : null;

    if ((finalLat === null || finalLng === null) && photos.length > 0) {
      const gpsPhotos = photos.filter(
        (p: any) =>
          typeof p.latitude === "number" &&
          typeof p.longitude === "number" &&
          !isNaN(p.latitude) &&
          !isNaN(p.longitude)
      );
      if (gpsPhotos.length > 0) {
        finalLat = gpsPhotos[0].latitude;
        finalLng = gpsPhotos[0].longitude;
      }
    }

    // Determine cover photo
    let chosenCoverUrl = coverPhotoUrl;
    if (!chosenCoverUrl && photos.length > 0) {
      const coverPhoto = photos.find((p: any) => p.isCover) || photos[0];
      chosenCoverUrl = coverPhoto.imageUrl;
    }

    // Create Trip
    const newTrip = await prisma.trip.create({
      data: {
        title: title.trim(),
        slug: finalSlug,
        city: city.trim(),
        country: country.trim(),
        dateLabel: dateLabel?.trim() || "Recent",
        quote: quote?.trim() || null,
        status: status === "DRAFT" ? "DRAFT" : "PUBLISHED",
        latitude: finalLat,
        longitude: finalLng,
        driveFolderUrl: driveFolderUrl ? driveFolderUrl.trim() : null,
        driveFolderId,
        coverPhotoUrl: chosenCoverUrl || null,
      },
    });

    // Create chapters if any
    const createdChapters: any[] = [];
    if (Array.isArray(chapters) && chapters.length > 0) {
      for (let i = 0; i < chapters.length; i++) {
        const ch = chapters[i];
        const chapterRecord = await prisma.chapter.create({
          data: {
            tripId: newTrip.id,
            title: ch.title || `Chapter ${i + 1}`,
            narrative: ch.narrative || "",
            audioUrl: ch.audioUrl || null,
            order: ch.order || i + 1,
          },
        });
        createdChapters.push(chapterRecord);
      }
    }

    // Save photos
    if (Array.isArray(photos) && photos.length > 0) {
      // Map photos to chapters if designated, by cityName match, or index
      await prisma.photo.createMany({
        data: photos.map((p: any, idx: number) => {
          let assignedChapterId = p.chapterId || null;

          if (!assignedChapterId && createdChapters.length > 0) {
            if (p.cityName) {
              const matched = createdChapters.find((c) =>
                c.title.toLowerCase().includes(p.cityName.toLowerCase())
              );
              if (matched) assignedChapterId = matched.id;
            }
            if (!assignedChapterId && typeof p.chapterIndex === "number" && createdChapters[p.chapterIndex]) {
              assignedChapterId = createdChapters[p.chapterIndex].id;
            }
            if (!assignedChapterId) {
              const chIdx = Math.floor((idx / photos.length) * createdChapters.length);
              assignedChapterId = createdChapters[chIdx]?.id || null;
            }
          }

          return {
            tripId: newTrip.id,
            chapterId: assignedChapterId,
            driveFileId: p.driveFileId || `photo_${Date.now()}_${idx}`,
            filename: p.filename || `Photo ${idx + 1}`,
            imageUrl: p.imageUrl,
            caption: p.caption || null,
            takenAt: p.takenAt ? new Date(p.takenAt) : null,
            latitude: typeof p.latitude === "number" ? p.latitude : null,
            longitude: typeof p.longitude === "number" ? p.longitude : null,
            locationTag: p.locationTag || p.cityName || `${city.trim()}, ${country.trim()}`,
            isCover: p.imageUrl === chosenCoverUrl,
          };
        }),
      });
    }

    const completeTrip = await prisma.trip.findUnique({
      where: { id: newTrip.id },
      include: {
        chapters: { include: { photos: true } },
        photos: true,
        _count: { select: { photos: true, chapters: true } },
      },
    });

    return NextResponse.json({ trip: completeTrip }, { status: 201 });
  } catch (err: any) {
    console.error("Failed to create trip:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create trip record." },
      { status: 500 }
    );
  }
}
