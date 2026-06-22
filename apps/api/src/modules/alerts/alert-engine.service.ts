import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Alert } from '../../entities/alert.entity';
import { AlertRule } from '../../entities/alert-rule.entity';
import { Geofence } from '../../entities/geofence.entity';
import { GpsPosition } from '@trackma/shared';
import { pointInPolygon } from '../../utils/geo.util';

@Injectable()
export class AlertEngineService {
  private readonly logger = new Logger(AlertEngineService.name);
  /** vehicleId → Set of geofenceIds the vehicle was inside on last position */
  private readonly geofenceState = new Map<string, Set<string>>();

  constructor(
    @InjectRepository(AlertRule) private rulesRepo: Repository<AlertRule>,
    @InjectRepository(Alert) private alertsRepo: Repository<Alert>,
    @InjectRepository(Geofence) private geofencesRepo: Repository<Geofence>,
  ) {}

  async evaluate(pos: GpsPosition, vehicleId: string, orgId: string): Promise<Alert | null> {
    const rules = await this.rulesRepo.find({
      where: [
        { organizationId: orgId, isActive: true, vehicleId },
        { organizationId: orgId, isActive: true, vehicleId: null as any },
      ],
    });

    for (const rule of rules) {
      const alert = await this.checkRule(rule, pos, vehicleId);
      if (alert) return alert;
    }
    return null;
  }

  private async checkRule(rule: AlertRule, pos: GpsPosition, vehicleId: string): Promise<Alert | null> {
    let triggered = false;
    let message = '';
    let data: Record<string, unknown> = {};

    switch (rule.type) {
      case 'speeding': {
        const limit = (rule.config?.speedLimit as number) ?? 120;
        if (pos.speed > limit) {
          triggered = true;
          message = `Speed ${pos.speed} km/h exceeds limit of ${limit} km/h`;
          data = { speed: pos.speed, limit };
        }
        break;
      }
      case 'ignition_on': {
        if (pos.ignition) {
          triggered = true;
          message = `Vehicle ignition turned ON`;
        }
        break;
      }
      case 'ignition_off': {
        if (!pos.ignition) {
          triggered = true;
          message = `Vehicle ignition turned OFF`;
        }
        break;
      }
      case 'geofence_enter':
      case 'geofence_exit': {
        const geofenceId = rule.config?.geofenceId as string;
        if (!geofenceId) break;
        const geofence = await this.geofencesRepo.findOne({ where: { id: geofenceId, isActive: true } });
        if (!geofence) break;

        const prev = this.geofenceState.get(vehicleId) ?? new Set<string>();
        const wasInside = prev.has(geofenceId);
        const isInside = pointInPolygon(pos.lat, pos.lng, geofence.polygon);

        if (!wasInside) prev.delete(geofenceId);
        if (isInside) prev.add(geofenceId); else prev.delete(geofenceId);
        this.geofenceState.set(vehicleId, prev);

        if (rule.type === 'geofence_enter' && !wasInside && isInside) {
          triggered = true;
          message = `Vehicle entered geofence "${geofence.name}"`;
          data = { geofenceId, geofenceName: geofence.name };
        } else if (rule.type === 'geofence_exit' && wasInside && !isInside) {
          triggered = true;
          message = `Vehicle exited geofence "${geofence.name}"`;
          data = { geofenceId, geofenceName: geofence.name };
        }
        break;
      }
      case 'low_fuel': {
        const threshold = (rule.config?.fuelThreshold as number) ?? 10;
        if (pos.fuelLevel != null && pos.fuelLevel < threshold) {
          triggered = true;
          message = `Fuel level ${pos.fuelLevel}% below threshold of ${threshold}%`;
          data = { fuelLevel: pos.fuelLevel, threshold };
        }
        break;
      }
    }

    if (!triggered) return null;
    if (await this.isDuplicate(rule.id, vehicleId)) return null;

    const alert = this.alertsRepo.create({
      vehicleId,
      ruleId: rule.id,
      type: rule.type,
      severity: this.severityFor(rule.type),
      message,
      data,
      triggeredAt: new Date(),
      acknowledged: false,
    });

    return this.alertsRepo.save(alert);
  }

  private async isDuplicate(ruleId: string, vehicleId: string): Promise<boolean> {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const count = await this.alertsRepo.count({
      where: { ruleId, vehicleId, acknowledged: false, triggeredAt: MoreThan(fiveMinAgo) },
    });
    return count > 0;
  }

  private severityFor(type: string): 'info' | 'warning' | 'critical' {
    if (type === 'speeding' || type === 'geofence_exit') return 'warning';
    if (type === 'low_fuel') return 'critical';
    return 'info';
  }
}
