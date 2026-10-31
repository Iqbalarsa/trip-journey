import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTripTimelineTimestamp } from "@/lib/utils";

export async function GET() {
  try {
    const allTrips = await prisma.trip.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { photos: true, chapters: true },
        },
        photos: {
          take: 2,
          select: { takenAt: true },
        },
      },
    });

    // Group by Country and/or Drive Folder
    const countryMap = new Map<
      string,
      {
        country: string;
        driveFolderId: string | null;
        driveFolderUrl: string | null;
        coverPhotoUrl: string | null;
        totalPhotos: number;
        visits: {
          id: string;
          title: string;
          slug: string;
          dateLabel: string;
          city: string;
          photoCount: number;
          status: string;
          createdAt: string;
          timelineTimestamp: number;
        }[];
      }
    >();

    for (const trip of allTrips) {
      const groupKey = trip.driveFolderId || trip.country;
      const count = trip._count?.photos || 0;
      const timelineTime = getTripTimelineTimestamp(trip);

      const visitItem = {
        id: trip.id,
        title: trip.title,
        slug: trip.slug,
        dateLabel: trip.dateLabel,
        city: trip.city,
        photoCount: count,
        status: trip.status,
        createdAt: trip.createdAt.toISOString(),
        timelineTimestamp: timelineTime,
      };

      if (!countryMap.has(groupKey)) {
        countryMap.set(groupKey, {
          country: trip.country,
          driveFolderId: trip.driveFolderId,
          driveFolderUrl: trip.driveFolderUrl,
          coverPhotoUrl: trip.coverPhotoUrl,
          totalPhotos: count,
          visits: [visitItem],
        });
      } else {
        const existing = countryMap.get(groupKey)!;
        existing.totalPhotos += count;
        if (!existing.driveFolderUrl && trip.driveFolderUrl) {
          existing.driveFolderUrl = trip.driveFolderUrl;
          existing.driveFolderId = trip.driveFolderId;
        }
        if (!existing.coverPhotoUrl && trip.coverPhotoUrl) {
          existing.coverPhotoUrl = trip.coverPhotoUrl;
        }
        existing.visits.push(visitItem);
      }
    }

    const countries = Array.from(countryMap.values()).map((c) => {
      // Sort visits within country newest first
      c.visits.sort((a, b) => b.timelineTimestamp - a.timelineTimestamp);
      return c;
    });

    // Sort countries by their most recent visit
    countries.sort((a, b) => {
      const timeA = a.visits[0]?.timelineTimestamp || 0;
      const timeB = b.visits[0]?.timelineTimestamp || 0;
      return timeB - timeA;
    });

    return NextResponse.json({ countries });
  } catch (err: any) {
    console.error("Error in /api/admin/countries:", err);
    return NextResponse.json(
      { error: "Failed to fetch country folders." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const country = searchParams.get("country");
    const driveFolderId = searchParams.get("driveFolderId");

    // 1. Reset all trips and photos (fresh start for testing)
    if (action === "reset-all") {
      await prisma.trip.deleteMany({});
      return NextResponse.json({
        success: true,
        message: "Semua album perjalanan dan foto berhasil dibersihkan dari database.",
      });
    }

    // 2. Delete a single country folder and all its visits
    if (country || driveFolderId) {
      const orConditions: any[] = [];
      if (country) orConditions.push({ country });
      if (driveFolderId) orConditions.push({ driveFolderId });

      await prisma.trip.deleteMany({
        where: { OR: orConditions },
      });

      return NextResponse.json({
        success: true,
        message: `Folder negara "${country || driveFolderId}" berhasil dihapus.`,
      });
    }

    return NextResponse.json(
      { error: "Missing delete criteria." },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Error in DELETE /api/admin/countries:", err);
    return NextResponse.json(
      { error: err.message || "Gagal menghapus folder negara." },
      { status: 500 }
    );
  }
}
