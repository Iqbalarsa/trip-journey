import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const size = searchParams.get("s") || "800";

    if (!id || !/^[a-zA-Z0-9_-]{15,60}$/.test(id)) {
      return new NextResponse("Invalid or missing file ID", { status: 400 });
    }

    // 1. Try Google Drive CDN endpoint
    const cdnUrl = `https://lh3.googleusercontent.com/d/${id}=s${size}`;
    const cdnRes = await fetch(cdnUrl, {
      cache: "force-cache",
    });

    if (cdnRes.ok && cdnRes.body) {
      const contentType = cdnRes.headers.get("content-type") || "image/jpeg";
      return new NextResponse(cdnRes.body, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=604800, immutable",
        },
      });
    }

    // 2. Fallback: Google Drive API direct media stream
    const apiKey = process.env.GOOGLE_API_KEY;
    if (apiKey) {
      const driveApiUrl = `https://www.googleapis.com/drive/v3/files/${id}?alt=media&key=${apiKey}`;
      const apiRes = await fetch(driveApiUrl);
      if (apiRes.ok && apiRes.body) {
        const contentType = apiRes.headers.get("content-type") || "image/jpeg";
        return new NextResponse(apiRes.body, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=604800, immutable",
          },
        });
      }
    }

    return new NextResponse("Image not found", { status: 404 });
  } catch (err: any) {
    console.error("Drive image proxy error:", err);
    return new NextResponse("Failed to load drive image", { status: 500 });
  }
}

