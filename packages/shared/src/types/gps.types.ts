export interface GpsPosition {
  vehicleId: string;
  imei: string;
  lat: number;
  lng: number;
  speed: number;       // km/h
  heading: number;     // degrees 0-360
  altitude: number;    // meters
  satellites: number;
  ignition: boolean;
  fuelLevel?: number;  // percentage 0-100
  odometer?: number;   // meters
  timestamp: Date;
}

export interface RawTeltonikaPdu {
  imei: string;
  records: TeltonikRecord[];
}

export interface TeltonikRecord {
  timestamp: number;
  priority: number;
  lat: number;
  lng: number;
  altitude: number;
  angle: number;
  satellites: number;
  speed: number;
  ioElements: Record<string, number>;
}
