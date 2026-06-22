'use client';

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { LivePosition } from '@/lib/socket';

function makeIcon(ignition: boolean, heading: number) {
  const color = ignition ? '#22c55e' : '#94a3b8';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <g transform="rotate(${heading}, 16, 16)">
        <polygon points="16,4 22,26 16,22 10,26" fill="${color}" stroke="#0f172a" stroke-width="1.5"/>
      </g>
      <circle cx="16" cy="16" r="4" fill="${color}" stroke="#0f172a" stroke-width="1.5"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

interface Props {
  position: LivePosition;
}

export default function VehicleMarker({ position }: Props) {
  const icon = makeIcon(position.ignition, position.heading);

  return (
    <Marker position={[position.lat, position.lng]} icon={icon}>
      <Popup>
        <div className="text-xs space-y-1 min-w-[140px]">
          <div className="font-semibold text-sm">{position.imei}</div>
          <div className="flex justify-between">
            <span className="text-slate-500">Speed</span>
            <span>{position.speed} km/h</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Ignition</span>
            <span className={position.ignition ? 'text-green-600' : 'text-slate-400'}>
              {position.ignition ? 'ON' : 'OFF'}
            </span>
          </div>
          {position.fuelLevel !== undefined && (
            <div className="flex justify-between">
              <span className="text-slate-500">Fuel</span>
              <span>{position.fuelLevel}%</span>
            </div>
          )}
          <div className="text-slate-400 text-[10px] pt-1">
            {new Date(position.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
