import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from '../../entities/alert.entity';
import { AlertRule } from '../../entities/alert-rule.entity';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert) private alertsRepo: Repository<Alert>,
    @InjectRepository(AlertRule) private rulesRepo: Repository<AlertRule>,
  ) {}

  getAlerts(organizationId: string) {
    return this.alertsRepo
      .createQueryBuilder('a')
      .innerJoin('a.rule', 'r', 'r.organizationId = :organizationId', { organizationId })
      .leftJoinAndSelect('a.vehicle', 'v')
      .orderBy('a.triggeredAt', 'DESC')
      .take(100)
      .getMany();
  }

  getRules(organizationId: string) {
    return this.rulesRepo.find({ where: { organizationId } });
  }

  createRule(data: Partial<AlertRule>) {
    return this.rulesRepo.save(this.rulesRepo.create(data));
  }

  acknowledge(id: string) {
    return this.alertsRepo.update(id, { acknowledged: true, acknowledgedAt: new Date() });
  }
}
