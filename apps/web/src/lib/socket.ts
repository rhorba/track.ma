'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/fleet`, {
      autoConnect: false,
    });
  }
  return socket;
}

export interface LivePosition {
  vehicleId: string;
  imei: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  ignition: boolean;
  fuelLevel?: number;
  timestamp: string;
}

export function useFleetSocket(orgId: string | null) {
  const [positions, setPositions] = useState<Record<string, LivePosition>>({});
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!orgId) return;
    const s = getSocket();

    if (!s.connected) s.connect();

    if (!joinedRef.current) {
      s.emit('join', { orgId });
      joinedRef.current = true;
    }

    s.on('position', (pos: LivePosition) => {
      setPositions((prev) => ({ ...prev, [pos.vehicleId]: pos }));
    });

    return () => {
      s.off('position');
    };
  }, [orgId]);

  return positions;
}
