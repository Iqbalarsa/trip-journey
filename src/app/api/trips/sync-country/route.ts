import { NextResponse } from "next/server";
import { syncCountryFolder } from "@/lib/syncEngine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { folderUrl } = body;

    if (!folderUrl || typeof folderUrl !== "string") {
      return NextResponse.json(
        { error: "Please provide a valid Google Drive folder link." },
        { status: 400 }
      );
    }

    const result = await syncCountryFolder(folderUrl);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Error in /api/trips/sync-country:", err);
    return NextResponse.json(
      { error: err.message || "Failed to sync Google Drive folder." },
      { status: 500 }
    );
  }
}

