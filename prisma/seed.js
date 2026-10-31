const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding travel trips with chapters, coordinates, and boarding pass details...");

  // 1. Leiden, Netherlands Trip
  const leidenTrip = await prisma.trip.create({
    data: {
      title: "Autumn Canals & Windmills of Leiden",
      slug: "autumn-canals-of-leiden",
      city: "Leiden",
      country: "Netherlands",
      dateLabel: "October 2024",
      quote: "Golden elm leaves falling softly across Rapenburg canals as Dutch bicycles clattered over brick bridges.",
      status: "PUBLISHED",
      latitude: 52.1601,
      longitude: 4.4970,
      driveFolderUrl: "https://drive.google.com/drive/folders/17k2eF_x9LeidenCanalTripSample",
      driveFolderId: "17k2eF_x9LeidenCanalTripSample",
      coverPhotoUrl: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1600&q=80",
    },
  });

  const ch1Leiden = await prisma.chapter.create({
    data: {
      tripId: leidenTrip.id,
      title: "Chapter 1: Morning Along the Rapenburg",
      narrative:
        "We started early in the morning along the Rapenburg, often called Leiden's most beautiful canal. The morning mist was just lifting off the quiet water, reflecting the centuries-old Dutch gables. Locals were unlocking bicycles and the aroma of roasted coffee began drifting from cozy waterside bakeries.",
      audioUrl: "https://actions.google.com/sounds/v1/water/lapping_water_waves.ogg",
      order: 1,
    },
  });

  await prisma.photo.createMany({
    data: [
      {
        tripId: leidenTrip.id,
        chapterId: ch1Leiden.id,
        driveFileId: "leiden_photo_1",
        filename: "IMG_4901_Rapenburg_Canal.jpg",
        imageUrl: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1600&q=80",
        caption: "Rapenburg canal with 17th century brick facades mirrored in the calm water.",
        takenAt: new Date("2024-10-18T08:45:00Z"),
        latitude: 52.1601,
        longitude: 4.4970,
        locationTag: "Rapenburg, Leiden, Netherlands",
        isCover: true,
      },
      {
        tripId: leidenTrip.id,
        chapterId: ch1Leiden.id,
        driveFileId: "leiden_photo_3",
        filename: "IMG_4902_Bicycle_Bridge.jpg",
        imageUrl: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1600&q=80",
        caption: "A classic Dutch bicycle parked on the arch bridge over the canal.",
        takenAt: new Date("2024-10-18T09:20:00Z"),
        latitude: 52.1585,
        longitude: 4.4912,
        locationTag: "Kort Rapenburg Bridge, Leiden",
        isCover: false,
      },
    ],
  });

  const ch2Leiden = await prisma.chapter.create({
    data: {
      tripId: leidenTrip.id,
      title: "Chapter 2: The De Valk Windmill & Cobblestone Alleys",
      narrative:
        "By midday we reached the towering Molen De Valk, a preserved seven-story grain windmill from 1743 standing proudly against the Dutch skies. We climbed to the balcony for a panoramic view over Leiden's terracotta rooftops before continuing into the quiet cobblestone alleys around Pieterskerk.",
      order: 2,
    },
  });

  await prisma.photo.createMany({
    data: [
      {
        tripId: leidenTrip.id,
        chapterId: ch2Leiden.id,
        driveFileId: "leiden_photo_2",
        filename: "IMG_4903_DeValk_Windmill.jpg",
        imageUrl: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=1600&q=80",
        caption: "Molen De Valk reaching high into the autumn blue sky.",
        takenAt: new Date("2024-10-18T13:30:00Z"),
        latitude: 52.1642,
        longitude: 4.4855,
        locationTag: "De Valk Windmill, Leiden",
        isCover: false,
      },
      {
        tripId: leidenTrip.id,
        chapterId: ch2Leiden.id,
        driveFileId: "leiden_photo_4",
        filename: "IMG_4904_Pieterskerk_Square.jpg",
        imageUrl: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1600&q=80",
        caption: "Warm afternoon light spilling across the Pieterskerkhof cobblestones.",
        takenAt: new Date("2024-10-18T16:15:00Z"),
        latitude: 52.1578,
        longitude: 4.4886,
        locationTag: "Pieterskerkhof, Leiden",
        isCover: false,
      },
    ],
  });

  // 2. Kyoto, Japan Trip
  const kyotoTrip = await prisma.trip.create({
    data: {
      title: "Kyoto Bamboo Groves & Zen Sanctuaries",
      slug: "kyoto-bamboo-groves-and-zen-sanctuaries",
      city: "Kyoto",
      country: "Japan",
      dateLabel: "May 2024",
      quote: "The rustle of towering green bamboo stalks in the dawn breeze before the city awoke.",
      status: "PUBLISHED",
      latitude: 35.0116,
      longitude: 135.7681,
      driveFolderUrl: "https://drive.google.com/drive/folders/17k2eF_x9KyotoTripSample",
      driveFolderId: "17k2eF_x9KyotoTripSample",
      coverPhotoUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1600&q=80",
    },
  });

  const ch1Kyoto = await prisma.chapter.create({
    data: {
      tripId: kyotoTrip.id,
      title: "Chapter 1: Dawn at Arashiyama",
      narrative:
        "Arriving at Arashiyama at 6:30 AM meant having the emerald bamboo canopy entirely to ourselves. Golden sunlight sliced through the tall bamboo culms, accompanied only by the soft chime of distant temple bells.",
      audioUrl: "https://actions.google.com/sounds/v1/environments/forest_birds.ogg",
      order: 1,
    },
  });

  await prisma.photo.createMany({
    data: [
      {
        tripId: kyotoTrip.id,
        chapterId: ch1Kyoto.id,
        driveFileId: "kyoto_photo_1",
        filename: "IMG_2810_Arashiyama_Grove.jpg",
        imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1600&q=80",
        caption: "Morning light illuminating the Arashiyama bamboo path.",
        takenAt: new Date("2024-05-12T06:45:00Z"),
        latitude: 35.0165,
        longitude: 135.6713,
        locationTag: "Arashiyama Bamboo Grove, Kyoto",
        isCover: true,
      },
      {
        tripId: kyotoTrip.id,
        chapterId: ch1Kyoto.id,
        driveFileId: "kyoto_photo_2",
        filename: "IMG_2812_Fushimi_Torii.jpg",
        imageUrl: "https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?auto=format&fit=crop&w=1600&q=80",
        caption: "Vermillion torii gates winding up the sacred mountain path.",
        takenAt: new Date("2024-05-12T11:00:00Z"),
        latitude: 34.9671,
        longitude: 135.7727,
        locationTag: "Fushimi Inari-taisha, Kyoto",
        isCover: false,
      },
    ],
  });

  const ch2Kyoto = await prisma.chapter.create({
    data: {
      tripId: kyotoTrip.id,
      title: "Chapter 2: Twilight in Gion",
      narrative:
        "As dusk settled over Kyoto, paper lanterns flickered to life along the narrow wooden machiya houses of Shirakawa canal in Gion. The reflection of willows in the twilight river was pure magic.",
      order: 2,
    },
  });

  await prisma.photo.createMany({
    data: [
      {
        tripId: kyotoTrip.id,
        chapterId: ch2Kyoto.id,
        driveFileId: "kyoto_photo_3",
        filename: "IMG_2815_Gion_Lanterns.jpg",
        imageUrl: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1600&q=80",
        caption: "Traditional wooden machiya houses glowing with evening paper lanterns.",
        takenAt: new Date("2024-05-12T19:10:00Z"),
        latitude: 35.0037,
        longitude: 135.7772,
        locationTag: "Gion District, Kyoto",
        isCover: false,
      },
    ],
  });

  console.log("Successfully seeded database with narrative chapters and coordinates!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
