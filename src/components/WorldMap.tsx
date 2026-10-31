"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { Compass, MapPin } from "lucide-react";

export interface MapDestination {
  id: string;
  slug: string;
  title: string;
  city: string;
  country: string;
  dateLabel: string;
  coverPhotoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  photoCount: number;
}

interface WorldMapProps {
  destinations: MapDestination[];
  onSelectDestination?: (id: string, slug: string) => void;
  className?: string;
}

export function WorldMap({ destinations, onSelectDestination, className }: WorldMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Valid destinations with coordinates
    const valid = destinations.filter(
      (d) =>
        typeof d.latitude === "number" &&
        typeof d.longitude === "number" &&
        !isNaN(d.latitude) &&
        !isNaN(d.longitude)
    );

    // Initial center (Europe/global view)
    const initialCenter: [number, number] =
      valid.length > 0 ? [valid[0].latitude!, valid[0].longitude!] : [30.0, 10.0];
    const initialZoom = valid.length > 1 ? 3 : 5;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      scrollWheelZoom: false,
      attributionControl: false,
    });

    L.control
      .zoom({
        position: "bottomright",
      })
      .addTo(map);

    // CartoDB Positron & Minimalist Light layers (User requested: https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png)
    const cartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY || "";
    const cartoPositron = L.tileLayer(
      `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png${cartoKey ? `?key=${cartoKey}` : ""}`,
      {
        maxZoom: 19,
        subdomains: ["a", "b", "c", "d"],
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
      }
    );

    // Minimalist Light Gray Canvas (Identical clean Positron aesthetic, 100% free with no API key requirement)
    const esriLightBase = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 16,
        attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
      }
    );
    const esriLightRef = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 16,
      }
    );
    const minimalistLightGroup = L.layerGroup([esriLightBase, esriLightRef]);

    const esriStreet = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 19,
        attribution: "Tiles &copy; Esri",
      }
    );

    // If CARTO API key is provided, use Carto Positron; otherwise use the identical Clean Minimalist Light Canvas
    if (cartoKey) {
      cartoPositron.addTo(map);
    } else {
      minimalistLightGroup.addTo(map);
    }

    // Quick map style switcher in top right
    L.control
      .layers(
        {
          "Minimalist Light (Positron)": cartoKey ? cartoPositron : minimalistLightGroup,
          "CartoDB Positron": cartoPositron,
          "Street View": esriStreet,
        },
        undefined,
        { position: "topright" }
      )
      .addTo(map);

    mapInstanceRef.current = map;

    // Group pins uniquely by country so 1 pin represents the travel history of that country
    const groupedMap = new Map<
      string,
      {
        country: string;
        city: string;
        latitude: number;
        longitude: number;
        coverPhotoUrl: string | null;
        totalPhotos: number;
        latestSlug: string;
        latestId: string;
        visitLabels: string[];
      }
    >();

    for (const d of valid) {
      const key = d.country.toLowerCase().trim();
      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          country: d.country,
          city: d.city,
          latitude: d.latitude!,
          longitude: d.longitude!,
          coverPhotoUrl: d.coverPhotoUrl,
          totalPhotos: d.photoCount,
          latestSlug: d.slug,
          latestId: d.id,
          visitLabels: [d.dateLabel],
        });
      } else {
        const item = groupedMap.get(key)!;
        item.totalPhotos += d.photoCount;
        if (!item.city.includes(d.city)) {
          item.city += `, ${d.city}`;
        }
        if (!item.visitLabels.includes(d.dateLabel)) {
          item.visitLabels.push(d.dateLabel);
        }
      }
    }

    const markers: L.Marker[] = [];

    // Add 1 glowing pin per Country
    Array.from(groupedMap.values()).forEach((item, index) => {
      const customIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div class="pulsing-radar-ring" style="position: absolute; width: 32px; height: 32px; border-radius: 9999px; background: #007AFF;"></div>
            <div class="pulsing-pin-core" style="position: relative; width: 14px; height: 14px; border-radius: 9999px; background: #007AFF; border: 2.5px solid #ffffff; box-shadow: 0 2px 8px rgba(0, 122, 255, 0.45);"></div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const marker = L.marker([item.latitude, item.longitude], {
        icon: customIcon,
      }).addTo(map);

      const visitsText =
        item.visitLabels.length > 1
          ? `${item.visitLabels.length} Kunjungan: ${item.visitLabels.join(", ")}`
          : item.visitLabels[0] || "Recent";

      // Popup content with preview card
      const popupHtml = `
        <div style="width: 210px; overflow: hidden; border-radius: 0.85rem; font-family: inherit;">
          <div style="width: 100%; height: 95px; background: #e2e8f0; position: relative;">
            <img 
              src="${item.coverPhotoUrl || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=400&q=80"}" 
              alt="${item.country}" 
              referrerpolicy="no-referrer"
              style="width: 100%; height: 100%; object-fit: cover;"
            />
          </div>
          <div style="padding: 10px;">
            <div style="font-size: 10px; font-weight: 600; text-transform: uppercase; color: var(--accent); margin-bottom: 2px;">
              ${item.city}, ${item.country}
            </div>
            <div style="font-size: 12px; font-weight: 700; color: #1e293b; line-height: 1.25; margin-bottom: 4px;">
              ${item.country}
            </div>
            <div style="font-size: 10px; color: #64748b; margin-bottom: 4px; line-height: 1.3;">
              🗓️ ${visitsText}
            </div>
            <div style="font-size: 10px; color: #64748b; margin-bottom: 8px;">
              📸 ${item.totalPhotos} photos
            </div>
            <button 
              id="map-btn-${index}"
              style="
                width: 100%; 
                padding: 6px 0; 
                background: var(--accent); 
                color: white; 
                border: none; 
                border-radius: 0.5rem; 
                font-size: 11px; 
                font-weight: 600; 
                cursor: pointer;
              "
            >
              Lihat Album →
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        offset: [0, -10],
        closeButton: false,
      });

      marker.on("popupopen", () => {
        const btn = document.getElementById(`map-btn-${index}`);
        if (btn) {
          btn.onclick = () => {
            if (onSelectDestination) {
              onSelectDestination(item.latestId, item.latestSlug);
            }
            window.location.href = `/trips/${item.latestSlug || item.latestId}`;
          };
        }
      });

      markers.push(marker);
    });

    // Fit bounds if multiple pins exist
    if (markers.length > 1) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.2));
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [destinations, onSelectDestination]);

  return <div ref={mapContainerRef} className={className || "w-full h-full"} />;
}

export default WorldMap;
