"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";

interface MapProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    id: string | number;
    position: [number, number];
    title: string;
    status: "open" | "in-progress" | "resolved" | "closed";
  }>;
  onMarkerClick?: (id: string | number) => void;
  height?: string;
  showUserLocation?: boolean;
  userLocation?: [number, number] | null;
  focusOnMarker?: string | number | null; // New prop to trigger zoom on specific marker
}

export function InteractiveMap({
  center = [73.8278, 15.4909],
  zoom = 12,
  markers = [],
  onMarkerClick,
  height = "600px",
  showUserLocation = true,
  userLocation = null,
  focusOnMarker = null,
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserLocation, setCurrentUserLocation] = useState<
    [number, number] | null
  >(userLocation);
  const [locationPermissionState, setLocationPermissionState] = useState<
    "pending" | "granted" | "denied" | "prompt"
  >("pending");

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    // Load MapTiler SDK dynamically
    const loadMapTiler = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const maptilersdk = await import("@maptiler/sdk");

        // Load MapTiler CSS
        if (!document.querySelector('link[href*="maptiler-sdk.css"]')) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "/maptiler-sdk.css";
          document.head.appendChild(link);
        }

        if (!mapContainerRef.current || mapRef.current) return;

        // Get API key from environment
        const apiKey =
          process.env.NEXT_PUBLIC_MAPTILER_API_KEY || "r4rtlkPK4DaQBrGuTiuR";

        // Initialize map
        mapRef.current = new maptilersdk.Map({
          container: mapContainerRef.current,
          style: `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${apiKey}`,
          center: [center[0], center[1]],
          zoom: zoom,
          apiKey: apiKey,
        });

        // Add navigation controls
        mapRef.current.addControl(
          new maptilersdk.NavigationControl(),
          "top-right",
        );

        // Add geolocate control
        mapRef.current.addControl(
          new maptilersdk.GeolocateControl({
            positionOptions: {
              enableHighAccuracy: true,
            },
            trackUserLocation: true,
          }),
          "top-right",
        );

        // Wait for map to load before adding markers
        mapRef.current.on("load", () => {
          // Don't set loading to false yet if we need location permission
          if (!showUserLocation || userLocation) {
            setIsLoading(false);
          }

          // Request user location if enabled
          if (showUserLocation && !userLocation) {
            if (navigator.geolocation) {
              // Check permission state first
              if (navigator.permissions) {
                navigator.permissions
                  .query({ name: "geolocation" })
                  .then((permissionStatus) => {
                    setLocationPermissionState(permissionStatus.state as any);

                    // Listen for permission changes
                    permissionStatus.onchange = () => {
                      setLocationPermissionState(permissionStatus.state as any);
                    };
                  })
                  .catch(() => {
                    // Fallback if permissions API not available
                    setLocationPermissionState("prompt");
                  });
              }

              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const userLoc: [number, number] = [
                    position.coords.longitude,
                    position.coords.latitude,
                  ];
                  setCurrentUserLocation(userLoc);
                  setLocationPermissionState("granted");
                  setIsLoading(false);
                  // Immediately center map on user location with higher zoom
                  mapRef.current?.flyTo({
                    center: userLoc,
                    zoom: 15,
                    duration: 1000,
                    essential: true,
                  });
                },
                (error) => {
                  console.warn(
                    "Geolocation access denied or unavailable:",
                    error.message || "Unknown error",
                  );
                  setLocationPermissionState("denied");
                  setIsLoading(false);
                },
                {
                  enableHighAccuracy: true,
                  timeout: 5000,
                  maximumAge: 0,
                },
              );
            } else {
              setLocationPermissionState("denied");
              setIsLoading(false);
            }
          }
        });

        mapRef.current.on("error", (e: any) => {
          console.error("Map error:", e);
          if (!process.env.NEXT_PUBLIC_MAPTILER_API_KEY) {
            setError(
              "MapTiler API key not configured. Please add NEXT_PUBLIC_MAPTILER_API_KEY to your environment variables.",
            );
          } else {
            setError("Failed to load map");
          }
          setIsLoading(false);
        });
      } catch (error) {
        console.error("Error loading MapTiler:", error);
        if (!process.env.NEXT_PUBLIC_MAPTILER_API_KEY) {
          setError(
            "MapTiler API key not configured. Please check your environment variables.",
          );
        } else {
          setError("Failed to load map SDK");
        }
        setIsLoading(false);
      }
    };

    loadMapTiler();

    // Cleanup
    return () => {
      if (mapRef.current) {
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // Map initialization should only happen once on mount
    // showUserLocation and userLocation are handled in the load callback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update user location marker - only use internal location if no external location provided
  useEffect(() => {
    if (mapRef.current && !isLoading && showUserLocation) {
      // Only use currentUserLocation if no userLocation prop was passed
      const effectiveUserLocation = userLocation ? null : currentUserLocation;

      if (effectiveUserLocation) {
        import("@maptiler/sdk").then((maptilersdk) => {
          // Remove existing user marker
          if (userMarkerRef.current) {
            userMarkerRef.current.remove();
          }

          // Create user location marker element
          const userEl = document.createElement("div");
          userEl.className = "user-location-marker";
          userEl.style.width = "20px";
          userEl.style.height = "20px";
          userEl.style.borderRadius = "50%";
          userEl.style.backgroundColor = "#3b82f6"; // blue
          userEl.style.border = "1px solid white";
          userEl.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.3)";
          userEl.style.animation = "pulse 2s infinite";

          // Add pulse animation
          if (!document.querySelector("#user-location-pulse-style")) {
            const style = document.createElement("style");
            style.id = "user-location-pulse-style";
            style.textContent = `
              @keyframes pulse {
                0%, 100% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3); }
                50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.1); }
              }
            `;
            document.head.appendChild(style);
          }

          // Create popup for user location
          const userPopup = new maptilersdk.Popup({ offset: 15 }).setHTML(
            `<div style="padding: 8px; color: black;">
              <p style="margin: 0; font-weight: 600; font-size: 12px;">📍 Your Location</p>
            </div>`,
          );

          // Add user marker to map
          userMarkerRef.current = new maptilersdk.Marker({ element: userEl })
            .setLngLat([effectiveUserLocation[0], effectiveUserLocation[1]])
            .setPopup(userPopup)
            .addTo(mapRef.current);
        });
      }
    }
  }, [userLocation, currentUserLocation, isLoading, showUserLocation]);

  // Update markers when they change
  useEffect(() => {
    if (mapRef.current && !isLoading) {
      import("@maptiler/sdk").then((maptilersdk) => {
        // Clear existing markers
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];

        // Add new markers
        markers.forEach((marker) => {
          const el = document.createElement("div");
          el.className = "custom-marker";
          el.style.width = "30px";
          el.style.height = "30px";
          el.style.borderRadius = "50%";
          el.style.cursor = "pointer";
          el.style.border = "3px solid white";
          el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
          el.style.transition = "box-shadow 0.2s ease";

          // Hover effect - use box-shadow instead of scale to prevent movement
          el.addEventListener("mouseenter", () => {
            el.style.boxShadow = "0 4px 16px rgba(0,0,0,0.5)";
          });
          el.addEventListener("mouseleave", () => {
            el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
          });

          // Color based on status
          if (marker.status === "open") {
            el.style.backgroundColor = "#ef4444"; // red
          } else if (marker.status === "in-progress") {
            el.style.backgroundColor = "#eab308"; // yellow
          } else if (
            marker.status === "resolved" ||
            marker.status === "closed"
          ) {
            el.style.backgroundColor = "#3b82f6"; // blue
          } else {
            el.style.backgroundColor = "#6b7280"; // gray for unknown
          }

          // Add click event
          el.addEventListener("click", () => {
            // Zoom to marker on click
            if (mapRef.current) {
              mapRef.current.flyTo({
                center: [marker.position[0], marker.position[1]],
                zoom: 16,
                duration: 1000,
              });
            }
            if (onMarkerClick) {
              onMarkerClick(marker.id);
            }
          });

          // Create popup
          const popup = new maptilersdk.Popup({ offset: 25 }).setHTML(
            `<div style="padding: 12px; color: black; min-width: 200px;">
              <h4 style="margin: 0 0 8px 0; font-weight: 600; font-size: 14px;">${marker.title}</h4>
              <p style="margin: 0; font-size: 12px; text-transform: capitalize; color: #666;">
                Status: ${marker.status.replace("-", " ")}
              </p>
            </div>`,
          );

          // Add marker to map
          const mapMarker = new maptilersdk.Marker({ element: el })
            .setLngLat([marker.position[0], marker.position[1]])
            .setPopup(popup)
            .addTo(mapRef.current);

          markersRef.current.push(mapMarker);
        });
      });
    }
  }, [markers, onMarkerClick, isLoading]);

  // Focus on specific marker when focusOnMarker prop changes
  useEffect(() => {
    if (mapRef.current && !isLoading && focusOnMarker) {
      const marker = markers.find((m) => m.id === focusOnMarker);
      if (marker) {
        mapRef.current.flyTo({
          center: [marker.position[0], marker.position[1]],
          zoom: 16,
          duration: 1500,
        });
      }
    }
  }, [focusOnMarker, markers, isLoading]);

  return (
    <div
      className="w-full rounded-lg overflow-hidden relative"
      style={{ height: height, minHeight: "400px" }}
    >
      <div
        ref={mapContainerRef}
        className="w-full h-full transition-all duration-300"
      />

      {/* Loading state while map is initializing */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-sm flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white mx-auto mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Loading map...
            </p>
          </div>
        </div>
      )}

      {/* Location permission notification (non-blocking) */}
      {showUserLocation &&
        !userLocation &&
        !isLoading &&
        locationPermissionState === "denied" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3 max-w-sm z-10 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Location access denied
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Enable location in browser settings to see your position on
                  the map.
                </p>
              </div>
            </div>
          </div>
        )}

      {/* Map error state */}
      {error && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded-lg">
          <div className="text-center p-4">
            <p className="text-sm text-red-600 dark:text-red-400 mb-2">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs bg-black dark:bg-white text-white dark:text-black px-3 py-1 rounded hover:opacity-80"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
