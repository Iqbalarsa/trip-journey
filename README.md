# 🧭 RoamLog — Interactive Travel Cartography & Google Drive Journal

> A family-friendly travel journal and interactive map portfolio designed to share **iPhone travel photos** effortlessly via **Google Drive**, wrapped in the **Apple Liquid Glass Design System**.

---

## 🌟 What's New & Key Capabilities

1. **Family-First Sharing (No Login Required for Family)**:
   - Designed specifically so you can send links to family members without forcing them to register, login, or install an app.
   - Clean, readable editorial design with memorable quotes, country tags, and warm stories.

2. **iPhone EXIF GPS & Timestamp Extraction**:
   - Photos taken with iPhone contain embedded capture timestamps (`imageMediaMetadata.time`) and GPS coordinates (`latitude`, `longitude`).
   - RoamLog automatically detects this metadata from Google Drive and generates contextual photo badges:
     - e.g. `📍 Taken at 08:45 AM • Rapenburg, Leiden, Netherlands`
     - Clickable GPS pill opening the exact location on Google Maps.
   - Automatically derives the destination's pin coordinates on the interactive world map.

3. **Interactive World Flight Map Hero**:
   - Integrated with Leaflet cartography (`CartoDB Voyager` vintage warm tiles).
   - Shows glowing pins for every trip destination.
   - Clicking a pin opens a preview card with a **"Scroll to Journal ↓"** button that smoothly glides down to that trip's boarding pass.

4. **"Boarding Pass / Passport" Timeline Feed**:
   - Styled as vintage physical boarding passes:
     - 3-letter airport city code route (e.g. `AMS → Leiden, Netherlands` or `KIX → Kyoto, Japan`).
     - Perforated dashed tear-lines and ticket styling.
     - Highlight quote, travel season, and photo count pill.
     - **Quick Filter Pills**: Instant filtering by **Country** (e.g. *Netherlands*, *Japan*) and **Year** (e.g. *2024*, *2025*).

5. **Narrative Chapters (Story & Photo Clusters)**:
   - Trips are organized into readable mini-chapters instead of an overwhelming photo dump.
   - 1–2 paragraph reflections paired with responsive photo clusters.
   - Embedded **Ambient Audio Player** for 10–20s voice notes or atmospheric sounds (e.g. canal bells, birds, waves).

6. **Fullscreen Edge-to-Edge Lightbox**:
   - Keyboard navigation (`←`/`→` arrows, `ESC` to close).
   - High-res Google Drive CDN streaming (`lh3.googleusercontent.com/d/{id}=s1600`).
   - EXIF timestamps, GPS coordinates, and direct Google Drive file link.

---

## 🚀 How to Add a Trip from Google Drive

1. **Organize your Google Drive**:
   - In Google Drive, create a folder for your trip (e.g. *Netherlands - Leiden* or *Kyoto*).
   - Upload your iPhone photos into it.
2. **Set Public Viewing**:
   - Right-click folder in Google Drive $\rightarrow$ **Share** $\rightarrow$ Under *General access*, choose **"Anyone with the link"** (Role: **Viewer**).
   - Copy the link.
3. **Publish in RoamLog**:
   - Open [http://localhost:3000/admin](http://localhost:3000/admin) *(Password: `admin`)*.
   - Paste the Google Drive folder link and click **Sync Drive Photos**.
   - RoamLog pulls image IDs, timestamps, and iPhone GPS coordinates.
   - Enter your **City**, **Country**, and **Title**.
   - Click any photo with a ⭐ to assign it as the **Boarding Pass Cover Photo**.
   - Add your story chapters and click **Publish Boarding Pass Trip**!

---

## 🛠️ Tech Stack & Scripts

- **Framework:** Next.js 15 (App Router, React 19, TypeScript)
- **Database:** SQLite (`travel.db`) with Prisma ORM (`Trip`, `Chapter`, `Photo`)
- **Mapping:** Leaflet & CartoDB Voyager tiles
- **Styling:** Tailwind CSS + Apple Liquid Glass Design System
- **Icons:** Lucide React

```bash
# Push database schema
npm run db:push

# Seed demo trips (Leiden & Kyoto)
npm run db:seed

# Development mode
npm run dev

# Production build & start
npm run build
npm run start
```
