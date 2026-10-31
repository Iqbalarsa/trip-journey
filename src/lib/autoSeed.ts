import { prisma } from "@/lib/prisma";
import initialData from "../../prisma/initialData.json";

let isSeeding = false;

export async function ensureInitialData() {
  if (isSeeding) return;

  try {
    const count = await prisma.trip.count();
    if (count > 0) return;

    isSeeding = true;
    console.log("Empty database detected, seeding initial travel data to Neon Postgres...");

    for (const trip of initialData) {
      const { chapters, photos, id, ...tripData } = trip as any;

      const createdTrip = await prisma.trip.upsert({
        where: { id },
        update: {},
        create: {
          id,
          title: tripData.title,
          slug: tripData.slug,
          city: tripData.city,
          country: tripData.country,
          dateLabel: tripData.dateLabel,
          quote: tripData.quote || null,
          status: tripData.status || "PUBLISHED",
          latitude: tripData.latitude || null,
          longitude: tripData.longitude || null,
          driveFolderUrl: tripData.driveFolderUrl || null,
          driveFolderId: tripData.driveFolderId || null,
          coverPhotoUrl: tripData.coverPhotoUrl || null,
          createdAt: new Date(tripData.createdAt),
          updatedAt: new Date(tripData.updatedAt),
        },
      });

      if (chapters && chapters.length > 0) {
        for (const ch of chapters) {
          const { photos: chPhotos, id: chId, tripId: _, ...chData } = ch;
          const createdChapter = await prisma.chapter.upsert({
            where: { id: chId },
            update: {},
            create: {
              id: chId,
              tripId: createdTrip.id,
              title: chData.title,
              narrative: chData.narrative || "",
              audioUrl: chData.audioUrl || null,
              order: chData.order || 0,
              createdAt: new Date(chData.createdAt),
            },
          });

          if (chPhotos && chPhotos.length > 0) {
            for (const p of chPhotos) {
              const { id: pId, tripId: _t, chapterId: _c, ...pData } = p;
              await prisma.photo.upsert({
                where: { driveFileId: pData.driveFileId },
                update: {},
                create: {
                  id: pId,
                  tripId: createdTrip.id,
                  chapterId: createdChapter.id,
                  driveFileId: pData.driveFileId,
                  filename: pData.filename,
                  imageUrl: pData.imageUrl,
                  caption: pData.caption || null,
                  takenAt: pData.takenAt ? new Date(pData.takenAt) : null,
                  latitude: pData.latitude || null,
                  longitude: pData.longitude || null,
                  locationTag: pData.locationTag || null,
                  isCover: pData.isCover || false,
                  createdAt: new Date(pData.createdAt),
                },
              });
            }
          }
        }
      }

      if (photos && photos.length > 0) {
        for (const p of photos) {
          if (!p.chapterId) {
            const { id: pId, tripId: _t, chapterId: _c, ...pData } = p;
            await prisma.photo.upsert({
              where: { driveFileId: pData.driveFileId },
              update: {},
              create: {
                id: pId,
                tripId: createdTrip.id,
                driveFileId: pData.driveFileId,
                filename: pData.filename,
                imageUrl: pData.imageUrl,
                caption: pData.caption || null,
                takenAt: pData.takenAt ? new Date(pData.takenAt) : null,
                latitude: pData.latitude || null,
                longitude: pData.longitude || null,
                locationTag: pData.locationTag || null,
                isCover: pData.isCover || false,
                createdAt: new Date(pData.createdAt),
              },
            });
          }
        }
      }
    }

    console.log("Initial travel data seeded successfully to Neon Postgres!");
  } catch (err) {
    console.error("Auto-seed error:", err);
  } finally {
    isSeeding = false;
  }
}

