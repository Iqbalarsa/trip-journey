import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [tripCount, photoCount, trips] = await Promise.all([
      prisma.trip.count(),
      prisma.photo.count(),
      prisma.trip.findMany({ select: { country: true } }),
    ]);

    // Unique countries
    const uniqueCountries = new Set(
      trips.map((t) => t.country?.trim()).filter(Boolean)
    );

    const hasApiKey = Boolean(
      process.env.GOOGLE_API_KEY &&
      process.env.GOOGLE_API_KEY.trim() !== "" &&
      process.env.GOOGLE_API_KEY !== "your_google_cloud_api_key_here"
    );

    return NextResponse.json({
      stats: {
        trips: tripCount,
        photos: photoCount,
        countries: uniqueCountries.size,
      },
      hasApiKey,
      adminConfigured: Boolean(process.env.ADMIN_PASSWORD),
    });
  } catch (err: any) {
    console.error("Failed to fetch settings/stats:", err);
    return NextResponse.json(
      {
        stats: { trips: 0, photos: 0, countries: 0 },
        hasApiKey: false,
      },
      { status: 200 }
    );
  }
}

