import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { photos } = body;

    if (!Array.isArray(photos) || photos.length === 0) {
      return NextResponse.json(
        { error: "No photos provided." },
        { status: 400 }
      );
    }

    const createdPhotos = await prisma.$transaction(
      photos.map((p: any) =>
        prisma.photo.create({
          data: {
            tripId: id,
            driveFileId: p.driveFileId,
            filename: p.filename || "Photo",
            imageUrl: p.imageUrl,
            takenAt: p.takenAt ? new Date(p.takenAt) : null,
            latitude: p.latitude ?? null,
            longitude: p.longitude ?? null,
            isCover: Boolean(p.isCover),
          },
        })
      )
    );

    return NextResponse.json({ photos: createdPhotos });
  } catch (err: any) {
    console.error("Failed to add photos:", err);
    return NextResponse.json(
      { error: "Failed to add photos to trip." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params;
    const body = await request.json();
    const { photoId, action } = body;

    if (action === "setCover") {
      const targetPhoto = await prisma.photo.findUnique({
        where: { id: photoId },
      });

      if (!targetPhoto || targetPhoto.tripId !== tripId) {
        return NextResponse.json({ error: "Photo not found." }, { status: 404 });
      }

      await prisma.$transaction([
        prisma.photo.updateMany({
          where: { tripId },
          data: { isCover: false },
        }),
        prisma.photo.update({
          where: { id: photoId },
          data: { isCover: true },
        }),
        prisma.trip.update({
          where: { id: tripId },
          data: { coverPhotoUrl: targetPhoto.imageUrl },
        }),
      ]);

      return NextResponse.json({ success: true, coverPhotoUrl: targetPhoto.imageUrl });
    }

    if (action === "delete") {
      await prisma.photo.delete({
        where: { id: photoId },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    console.error("Failed to update photo:", err);
    return NextResponse.json(
      { error: "Failed to update photo." },
      { status: 500 }
    );
  }
}

