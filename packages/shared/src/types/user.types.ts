export type UserRole = 'org_admin' | 'fleet_manager' | 'viewer' | 'driver';

export interface JwtPayload {
  sub: string;
  email: string;
  orgId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export const REDIS_CHANNELS = {
  GPS_POSITION: 'gps:position',
  ALERT_TRIGGER: 'alert:trigger',
} as const;
