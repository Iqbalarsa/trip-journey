import { NextResponse } from "next/server";
import { extractDriveFolderId, syncDriveFolder } from "@/lib/drive";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { folderUrl, apiKey } = body;

    if (!folderUrl || typeof folderUrl !== "string") {
      return NextResponse.json(
        { error: "Please provide a valid Google Drive folder link or folder ID." },
        { status: 400 }
      );
    }

    const folderId = extractDriveFolderId(folderUrl);
    if (!folderId) {
      return NextResponse.json(
        {
          error:
            "Could not parse a Google Drive folder ID from this link. Please ensure it looks like: https://drive.google.com/drive/folders/YOUR_FOLDER_ID",
        },
        { status: 400 }
      );
    }

    const result = await syncDriveFolder(folderId, apiKey);
    const photos = result.photos || [];

    // Extract any iPhone GPS coordinates found
    const photosWithGps = photos.filter(
      (p) =>
        typeof p.latitude === "number" &&
        typeof p.longitude === "number" &&
        !isNaN(p.latitude) &&
        !isNaN(p.longitude)
    );

    const detectedCoordinates =
      photosWithGps.length > 0
        ? {
            latitude: photosWithGps[0].latitude,
            longitude: photosWithGps[0].longitude,
            countWithGps: photosWithGps.length,
          }
        : null;

    return NextResponse.json({
      success: true,
      folderId,
      count: photos.length,
      photos,
      cities: result.cities || [],
      detectedCoordinates,
      suggestedCity: result.suggestedCity || null,
      suggestedCountry: result.suggestedCountry || null,
    });
  } catch (err: any) {
    console.error("Error in /api/trips/sync-drive:", err);
    return NextResponse.json(
      {
        error:
          err.message ||
          "Failed to fetch photos from Google Drive. Please verify the folder is set to 'Anyone with the link can view' or configure a Google Cloud API Key.",
      },
      { status: 500 }
    );
  }
}
