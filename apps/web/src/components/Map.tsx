'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import VehicleMarker from './VehicleMarker';
import type { LivePosition } from '@/lib/socket';

interface Props {
  positions: Record<string, LivePosition>;
}

function RecenterOnLoad() {
  const map = useMap();
  useEffect(() => {
    map.setView([31.7917, -7.0926], 6);
  }, [map]);
  return null;
}

export default function Map({ positions }: Props) {
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
      {vehicles.map((v) => (
        <VehicleMarker key={v.vehicleId} position={v} />
      ))}
    </MapContainer>
  );
}
