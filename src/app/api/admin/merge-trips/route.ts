import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sourceTripId, targetTripId } = body;

    if (!sourceTripId || !targetTripId) {
      return NextResponse.json(
        { error: "sourceTripId and targetTripId are required." },
        { status: 400 }
      );
    }

    if (sourceTripId === targetTripId) {
      return NextResponse.json(
        { error: "Cannot merge a trip into itself." },
        { status: 400 }
      );
    }

    const sourceTrip = await prisma.trip.findUnique({
      where: { id: sourceTripId },
      include: { chapters: true, photos: true },
    });

    const targetTrip = await prisma.trip.findUnique({
      where: { id: targetTripId },
      include: { chapters: true, photos: true },
    });

    if (!sourceTrip || !targetTrip) {
      return NextResponse.json(
        { error: "Source or target trip not found." },
        { status: 404 }
      );
    }

    // 1. Map or create chapters in targetTrip for sourceTrip chapters
    const targetChapters = targetTrip.chapters || [];
    const chapterMap = new Map<string, string>(); // sourceChapterId -> targetChapterId

    let nextOrder = targetChapters.length + 1;
    for (const srcChapter of sourceTrip.chapters) {
      const match = targetChapters.find(
        (tc) => tc.title.toLowerCase().trim() === srcChapter.title.toLowerCase().trim()
      );
      if (match) {
        chapterMap.set(srcChapter.id, match.id);
      } else {
        const newChapter = await prisma.chapter.create({
          data: {
            tripId: targetTrip.id,
            title: srcChapter.title,
            narrative: srcChapter.narrative || "",
            order: nextOrder++,
          },
        });
        targetChapters.push(newChapter);
        chapterMap.set(srcChapter.id, newChapter.id);
      }
    }

    // 2. Move all photos from sourceTrip to targetTrip
    for (const photo of sourceTrip.photos) {
      const assignedChapterId =
        photo.chapterId && chapterMap.has(photo.chapterId)
          ? chapterMap.get(photo.chapterId)
          : null;

      await prisma.photo.update({
        where: { id: photo.id },
        data: {
          tripId: targetTrip.id,
          chapterId: assignedChapterId || undefined,
        },
      });
    }

    // 3. Update combined cities on targetTrip
    const targetCities = targetTrip.city
      ? targetTrip.city.split(",").map((s) => s.trim())
      : [];
    const sourceCities = sourceTrip.city
      ? sourceTrip.city.split(",").map((s) => s.trim())
      : [];
    const combinedCities = Array.from(new Set([...targetCities, ...sourceCities]))
      .filter(Boolean)
      .join(", ");

    // 4. Ensure target has cover photo if missing
    const newCover = targetTrip.coverPhotoUrl || sourceTrip.coverPhotoUrl;

    await prisma.trip.update({
      where: { id: targetTrip.id },
      data: {
        city: combinedCities,
        coverPhotoUrl: newCover,
      },
    });

    // 5. Delete sourceTrip
    await prisma.trip.delete({
      where: { id: sourceTrip.id },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil menggabungkan foto ke "${targetTrip.title}".`,
      targetTripId: targetTrip.id,
    });
  } catch (err: any) {
    console.error("Error merging trips:", err);
    return NextResponse.json(
      { error: err.message || "Failed to merge trips." },
      { status: 500 }
    );
  }
}

