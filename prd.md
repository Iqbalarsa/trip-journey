# Product Requirement Document (PRD): RoamLog (Interactive Travel Map & Google Drive Journal)

## 1. Project Overview & Scope
* **Project Name:** RoamLog (Personal Travel Journal & Interactive Cartography)
* **Target Audience:** Single-user owner (Public showcase for friends/family to view without complex sign-ins)
* **Language:** English (UI and codebase)
* **Core Philosophy:** Moving away from flat, boring photo grids toward an immersive travel experience:
  1. An interactive world trip map hero section with glowing location pins.
  2. A nostalgic, passport/boarding-pass styled vertical timeline.
  3. Chapter-based photo-story pairing (narratives paired with photo clusters, auto-extracted GPS/time badges, and ambient audio clips).
  4. Effortless media sourcing: simply paste a Google Drive folder link (e.g., *"Leiden"*) to sync images, without manual file re-uploading.

---

## 2. Tech Stack & Architecture
* **Framework:** Next.js (App Router, TypeScript)
* **Styling & Components:** Tailwind CSS + Shadcn UI (Editorial travel magazine aesthetic, warm paper tokens, custom boarding pass cards)
* **Database & ORM:** SQLite (`travel.db`) via Prisma ORM
* **Mapping Engine:** Leaflet / `react-leaflet` with CartoDB Voyager or OpenStreetMap warm-toned tiles
* **External Integration:** Google Drive API v3 (Public read via Google API Key)
* **Image Delivery:** Google Drive CDN endpoints (`https://lh3.googleusercontent.com/d/{fileId}=s1600`) for zero-egress, fast responsive caching
* **Audio Support:** HTML5 Audio player for short ambient clips / micro voice notes

---

## 3. Key Functional Modules & User Stories

### A. Public Homepage: Interactive Cartography & Boarding Pass Timeline

1. **Interactive World Map (Hero Section):**
   * Top-of-page interactive world map displaying pins for every trip destination.
   * Hovering/clicking a pin displays a preview card (city, cover photo, travel date, trip title).
   * Clicking a pin triggers a smooth animated scroll down to that trip's timeline card.
   * Map styling: Minimalist, warm vintage cartographic skin.

2. **"Boarding Pass / Passport" Timeline Feed:**
   * Chronological vertical timeline ordered from newest to oldest trip.
   * Styled like physical boarding passes or vintage travel tickets:
     * Country flag & destination city code/name (e.g., `AMS • Leiden, Netherlands`).
     * Date stamp & travel season (e.g., `OCT 2024`).
     * Hero cover photo preview with smooth hover zoom.
     * One-sentence memorable quote / trip highlight.
     * Photo counter (e.g., `📸 42 Photos`).
     * "Board Trip" CTA button linking to `/trips/[id]`.
   * **"Relive the Journey" Quick Filters:** Filter pills by **Year** (e.g., `2024`, `2025`, `2026`) or **Country** (e.g., `Netherlands`, `Japan`).

---

### B. Trip Detail: Immersive Photo Essays & Chapters

1. **Trip Header:**
   * Panoramic hero cover, destination title, date badge, and coordinates pill.
   * Overview travel summary blurb.

2. **Narrative Chapters (Photo + Story Pairing):**
   * Photos are organized into mini-chapters rather than an unstructured photo dump (e.g., *"Chapter 1: Morning Canals & Windmills"*, *"Chapter 2: Sunset by the Old Barracks"*).
   * Each chapter combines a 1–2 paragraph story with a responsive masonry photo cluster (2–4 photos).

3. **Contextual EXIF Badges:**
   * Automatic pill overlay on photos: *"Taken at 06:45 AM • Leiden, Netherlands"*.

4. **Ambient Audio / Micro Voice Notes:**
   * Embedded audio clip player on selected milestone photos (supports short 10–20s ambient sound recordings like canal bells, rain, or personal voice notes).

5. **Fullscreen Lightbox Modal:**
   * Tap any image for full-screen inspection with keyboard navigation (Arrow keys: Prev/Next, ESC: close).

---

### C. Admin Workspace (`/admin`)

1. **Trip Editor & Status Management:**
   * Create/edit trips with `DRAFT` vs `PUBLISHED` toggle.
   * Fields: Title, City, Country, Primary Coordinates (`latitude`, `longitude`), Travel Date, and Highlight Quote.

2. **Google Drive Sync Engine:**
   * Input field: Google Drive Folder URL (e.g., `https://drive.google.com/drive/folders/{folderId}`).
   * **"Sync Drive Photos" Action:**
     * Parses `{folderId}` and queries Google Drive API v3.
     * Pulls image IDs, filenames, capture timestamps (`imageMediaMetadata.time`), and GPS coordinates (`imageMediaMetadata.location`).
     * Caches image records in the SQLite database.

3. **Photo Curation & Cover Selection:**
   * Visual photo management grid inside the trip editor.
   * One-click star (⭐) to assign any photo as the primary Boarding Pass Cover.
   * Ability to group synced photos into specific story chapters and add story text.

---

## 4. Database Schema (Prisma / SQLite)

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./travel.db"
}

generator client {
  provider = "prisma-client-js"
}

model Trip {
  id             String      @id @default(uuid())
  title          String      // e.g., "Autumn Canals of Leiden"
  slug           String      @unique
  city           String      // e.g., "Leiden"
  country        String      // e.g., "Netherlands"
  dateLabel      String      // e.g., "October 2024"
  quote          String?     // Short 1-sentence memorable highlight
  status         String      @default("DRAFT") // DRAFT, PUBLISHED
  latitude       Float?      // Destination coordinates for hero map pin
  longitude      Float?
  driveFolderUrl String?
  driveFolderId  String?
  coverPhotoUrl  String?
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  chapters       Chapter[]
  photos         Photo[]
}

model Chapter {
  id          String   @id @default(uuid())
  tripId      String
  trip        Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)
  title       String   // e.g., "Morning by the Canals"
  narrative   String   // Markdown story reflection
  audioUrl    String?  // Optional ambient audio / voice note URL
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  photos      Photo[]
}

model Photo {
  id           String    @id @default(uuid())
  tripId       String
  trip         Trip      @relation(fields: [tripId], references: [id], onDelete: Cascade)
  chapterId    String?
  chapter      Chapter?  @relation(fields: [chapterId], references: [id], onDelete: SetNull)
  driveFileId  String
  filename     String
  imageUrl     String
  caption      String?
  takenAt      DateTime?
  latitude     Float?
  longitude    Float?
  locationTag  String?   // e.g., "Leiden, Netherlands"
  isCover      Boolean   @default(false)
  createdAt    DateTime  @default(now())
}
```

---

## 5. Implementation Milestones for Antigravity

* **Phase 1: Project Setup & Database Layer**
  * Scaffold Next.js project with TypeScript, Tailwind CSS, and Prisma SQLite.
  * Execute migration for `Trip`, `Chapter`, and `Photo` models.
* **Phase 2: Google Drive Importer & Admin Management**
  * Build `/admin` dashboard with trip creator, draft/publish switcher, and Drive folder sync.
  * Implement Google Drive API service to fetch image metadata and GPS coordinates.
  * Add one-click star (⭐) cover photo selector and chapter narrative editor.
* **Phase 3: Public Homepage (Map + Boarding Pass Timeline)**
  * Implement Leaflet world map with destination pins in the hero section.
  * Build the boarding pass vintage timeline cards with country/year filters.
  * Link map pin clicks to smooth-scroll to timeline cards.
* **Phase 4: Trip Narrative & Chapter Photo Essays**
  * Build dynamic `/trips/[slug]` view with photo-story clusters.
  * Integrate audio player for micro ambient sounds and EXIF metadata badges.
  * Add fullscreen responsive image lightbox viewer.