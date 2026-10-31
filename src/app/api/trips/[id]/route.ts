import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/drive";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: param } = await params;

    // Search by slug OR by id
    const trip = await prisma.trip.findFirst({
      where: {
        OR: [{ id: param }, { slug: param }],
      },
      include: {
        chapters: {
          orderBy: { order: "asc" },
          include: {
            photos: {
              orderBy: [{ isCover: "desc" }, { takenAt: "asc" }, { createdAt: "asc" }],
            },
          },
        },
        photos: {
          orderBy: [{ isCover: "desc" }, { takenAt: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found." }, { status: 404 });
    }

    // Fetch other visits to the same country
    const otherVisits = await prisma.trip.findMany({
      where: {
        country: trip.country,
        id: { not: trip.id },
        status: "PUBLISHED",
      },
      select: {
        id: true,
        slug: true,
        title: true,
        dateLabel: true,
        city: true,
        _count: { select: { photos: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ trip, otherVisits });
  } catch (err: any) {
    console.error("Failed to fetch trip detail:", err);
    return NextResponse.json(
      { error: "Failed to fetch trip detail." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: param } = await params;
    const body = await request.json();
    const {
      title,
      slug: customSlug,
      city,
      country,
      dateLabel,
      quote,
      status,
      latitude,
      longitude,
      coverPhotoUrl,
      chapters,
      photos,
    } = body;

    const existing = await prisma.trip.findFirst({
      where: { OR: [{ id: param }, { slug: param }] },
    });

    if (!existing) {
      return NextResponse.json({ error: "Trip not found." }, { status: 404 });
    }

    // Update basic trip fields
    const updated = await prisma.trip.update({
      where: { id: existing.id },
      data: {
        ...(title && { title: title.trim() }),
        ...(customSlug && { slug: slugify(customSlug) }),
        ...(city && { city: city.trim() }),
        ...(country && { country: country.trim() }),
        ...(dateLabel && { dateLabel: dateLabel.trim() }),
        quote: quote !== undefined ? quote?.trim() || null : undefined,
        status: status ? (status === "DRAFT" ? "DRAFT" : "PUBLISHED") : undefined,
        latitude: typeof latitude === "number" ? latitude : undefined,
        longitude: typeof longitude === "number" ? longitude : undefined,
        coverPhotoUrl: coverPhotoUrl !== undefined ? coverPhotoUrl : undefined,
      },
      include: {
        chapters: { include: { photos: true } },
        photos: true,
      },
    });

    return NextResponse.json({ trip: updated });
  } catch (err: any) {
    console.error("Failed to update trip:", err);
    return NextResponse.json(
      { error: "Failed to update trip record." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: param } = await params;
    const existing = await prisma.trip.findFirst({
      where: { OR: [{ id: param }, { slug: param }] },
    });

    if (!existing) {
      return NextResponse.json({ error: "Trip not found." }, { status: 404 });
    }

    await prisma.trip.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true, message: "Trip deleted successfully." });
  } catch (err: any) {
    console.error("Failed to delete trip:", err);
    return NextResponse.json(
      { error: "Failed to delete trip." },
      { status: 500 }
    );
  }
}
