"use client";

import React, {
  useRef,
  useEffect,
  useState,
  createContext,
  useContext,
} from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import { cn } from "@/lib/utils";

// Map Context
const MapContext = createContext<{
  map: maptilersdk.Map | null;
  mapContainer: React.RefObject<HTMLDivElement> | null;
}>({
  map: null,
  mapContainer: null,
});

// Main Map Component
interface MapProps {
  center?: [number, number];
  zoom?: number;
  className?: string;
  children?: React.ReactNode;
}

export function Map({
  center = [-74.006, 40.7128],
  zoom = 11,
  className,
  children,
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maptilersdk.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<maptilersdk.Map | null>(null);

  useEffect(() => {
    if (map.current) return;

    maptilersdk.config.apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || "";

    if (mapContainer.current) {
      map.current = new maptilersdk.Map({
        container: mapContainer.current,
        style: maptilersdk.MapStyle.STREETS,
        center: center,
        zoom: zoom,
      });

      setMapInstance(map.current);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        setMapInstance(null);
      }
    };
  }, [center, zoom]);

  return (
    <MapContext.Provider value={{ map: mapInstance, mapContainer }}>
      <div className={cn("relative w-full h-full", className)}>
        <div ref={mapContainer} className="w-full h-full" />
        {children}
      </div>
    </MapContext.Provider>
  );
}

// MapControls Component
interface MapControlsProps {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  showZoom?: boolean;
  showCompass?: boolean;
  showLocate?: boolean;
  showFullscreen?: boolean;
  className?: string;
}

export function MapControls({
  position = "top-right",
  showZoom = true,
  showCompass = true,
  showLocate = true,
  showFullscreen = true,
  className,
}: MapControlsProps) {
  const { map } = useContext(MapContext);

  useEffect(() => {
    if (!map) return;

    const controls: any[] = [];

    if (showZoom) {
      const nav = new maptilersdk.NavigationControl();
      map.addControl(nav, position);
      controls.push(nav);
    }

    if (showLocate) {
      const geolocate = new maptilersdk.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
      });
      map.addControl(geolocate, position);
      controls.push(geolocate);
    }

    if (showFullscreen) {
      const fullscreen = new maptilersdk.FullscreenControl();
      map.addControl(fullscreen, position);
      controls.push(fullscreen);
    }

    return () => {
      controls.forEach((control) => {
        try {
          map.removeControl(control);
        } catch (e) {
          // Controls might have been removed already
        }
      });
    };
  }, [map, position, showZoom, showCompass, showLocate, showFullscreen]);

  return (
    <div className={cn("absolute z-10", className)}>
      {/* Additional custom controls can be added here */}
    </div>
  );
}

// MapMarker Component
interface MapMarkerProps {
  longitude: number;
  latitude: number;
  children?: React.ReactNode;
  onClick?: () => void;
}

export function MapMarker({
  longitude,
  latitude,
  children,
  onClick,
}: MapMarkerProps) {
  const { map } = useContext(MapContext);
  const markerRef = useRef<maptilersdk.Marker | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!map) return;

    // Create marker element
    const el = document.createElement("div");
    el.className = "marker-element";
    elementRef.current = el;

    // Create marker
    const marker = new maptilersdk.Marker(el)
      .setLngLat([longitude, latitude])
      .addTo(map);

    markerRef.current = marker;

    // Add click handler
    if (onClick) {
      el.addEventListener("click", onClick);
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
      }
      if (onClick && el) {
        el.removeEventListener("click", onClick);
      }
    };
  }, [map, longitude, latitude, onClick]);

  // Render children into the marker element
  useEffect(() => {
    if (elementRef.current && children) {
      const portal = document.createElement("div");
      elementRef.current.appendChild(portal);

      // This is a simple way to render React children into the DOM element
      // In a more complex setup, you might want to use ReactDOM.createPortal
      return () => {
        if (elementRef.current?.contains(portal)) {
          elementRef.current.removeChild(portal);
        }
      };
    }
  }, [children]);

  return null;
}

// MarkerContent Component
interface MarkerContentProps {
  children: React.ReactNode;
}

export function MarkerContent({ children }: MarkerContentProps) {
  return <div className="marker-content">{children}</div>;
}

// MarkerTooltip Component
interface MarkerTooltipProps {
  children: React.ReactNode;
}

export function MarkerTooltip({ children }: MarkerTooltipProps) {
  return (
    <div className="marker-tooltip absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity">
      {children}
    </div>
  );
}

// MarkerPopup Component
interface MarkerPopupProps {
  children: React.ReactNode;
}

export function MarkerPopup({ children }: MarkerPopupProps) {
  return (
    <div className="marker-popup hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 bg-white border border-gray-200 rounded shadow-lg min-w-[200px]">
      {children}
    </div>
  );
}

// Export context for advanced usage
export { MapContext };
