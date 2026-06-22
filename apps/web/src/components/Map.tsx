'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap, Polygon, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import VehicleMarker from './VehicleMarker';
import type { LivePosition } from '@/lib/socket';

interface Geofence {
  id: string;
  name: string;
  polygon: { lat: number; lng: number }[];
}

interface Props {
  positions: Record<string, LivePosition>;
  geofences?: Geofence[];
}

function RecenterOnLoad() {
  const map = useMap();
  useEffect(() => {
    map.setView([31.7917, -7.0926], 6);
  }, [map]);
  return null;
}

export default function Map({ positions, geofences = [] }: Props) {
  const vehicles = Object.values(positions);

  return (
    <MapContainer
      center={[31.7917, -7.0926]}
      zoom={6}
      className="w-full h-full"
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
      />
      <RecenterOnLoad />

      {geofences.map((g) => (
        <Polygon
          key={g.id}
          positions={g.polygon.map((p) => [p.lat, p.lng] as [number, number])}
          pathOptions={{ color: '#7c3aed', fillColor: '#7c3aed', fillOpacity: 0.12, weight: 2 }}
        >
          <Tooltip sticky>{g.name}</Tooltip>
        </Polygon>
      ))}

      {vehicles.map((v) => (
        <VehicleMarker key={v.vehicleId} position={v} />
      ))}
    </MapContainer>
  );
}
