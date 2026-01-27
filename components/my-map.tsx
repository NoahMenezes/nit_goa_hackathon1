import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerTooltip,
  MarkerPopup,
} from "@/components/ui/map";
import { Card } from "@/components/ui/card";

// Basic Map Example
export function BasicMapExample() {
  return (
    <div className="h-[400px] w-full">
      <Map center={[-74.006, 40.7128]} zoom={12} />
    </div>
  );
}

// Map Controls Example
export function MapControlsExample() {
  return (
    <div className="h-[400px] w-full">
      <Map center={[2.3522, 48.8566]} zoom={11}>
        <MapControls
          position="bottom-right"
          showZoom
          showCompass
          showLocate
          showFullscreen
        />
      </Map>
    </div>
  );
}

// Markers Example
const locations = [
  {
    id: 1,
    name: "Empire State Building",
    lng: -73.9857,
    lat: 40.7484,
  },
  {
    id: 2,
    name: "Central Park",
    lng: -73.9654,
    lat: 40.7829,
  },
  {
    id: 3,
    name: "Times Square",
    lng: -73.9855,
    lat: 40.758,
  },
];

export function MarkersExample() {
  return (
    <div className="h-[400px] w-full">
      <Map center={[-73.98, 40.76]} zoom={12}>
        {locations.map((location) => (
          <MapMarker
            key={location.id}
            longitude={location.lng}
            latitude={location.lat}
          >
            <MarkerContent>
              <div className="size-4 rounded-full bg-primary border-2 border-white shadow-lg" />
            </MarkerContent>
            <MarkerTooltip>{location.name}</MarkerTooltip>
            <MarkerPopup>
              <div className="space-y-1">
                <p className="font-medium text-foreground">{location.name}</p>
                <p className="text-xs text-muted-foreground">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
              </div>
            </MarkerPopup>
          </MapMarker>
        ))}
      </Map>
    </div>
  );
}

// Main MyMap component (default export)
export function MyMap() {
  return (
    <Card className="h-[300px] p-0 overflow-hidden">
      <Map center={[-74.006, 40.7128]} zoom={11}>
        <MapControls />
      </Map>
    </Card>
  );
}
