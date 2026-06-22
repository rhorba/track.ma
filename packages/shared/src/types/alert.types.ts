export type AlertType = 'speeding' | 'geofence_enter' | 'geofence_exit' | 'ignition_on' | 'ignition_off' | 'low_fuel' | 'offline';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface AlertEvent {
  id: string;
  vehicleId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  data?: Record<string, unknown>;
  triggeredAt: Date;
  acknowledged: boolean;
}
