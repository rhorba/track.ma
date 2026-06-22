export type VehicleType = 'car' | 'truck' | 'van' | 'motorcycle' | 'boat' | 'scooter';
export type VehicleStatus = 'active' | 'idle' | 'offline' | 'maintenance';

export interface VehicleSummary {
  id: string;
  name: string;
  plate: string;
  type: VehicleType;
  status: VehicleStatus;
  lastPosition?: {
    lat: number;
    lng: number;
    speed: number;
    ignition: boolean;
    timestamp: Date;
  };
}
