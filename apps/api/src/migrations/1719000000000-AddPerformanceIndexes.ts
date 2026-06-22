import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1719000000000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1719000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // positions — already has IDX(vehicleId, timestamp) from entity; add explicitly for prod
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_positions_vehicle_timestamp"
      ON "positions" ("vehicle_id", "timestamp" DESC)
    `);

    // alerts — history queries: WHERE vehicleId AND triggeredAt range
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_alerts_vehicle_triggered"
      ON "alerts" ("vehicle_id", "triggered_at" DESC)
    `);

    // alerts — acknowledge filter: WHERE vehicleId AND acknowledged = false
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_alerts_vehicle_acknowledged"
      ON "alerts" ("vehicle_id", "acknowledged")
    `);

    // geofences — list per org: WHERE organizationId AND isActive = true
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_geofences_org_active"
      ON "geofences" ("organization_id", "is_active")
      WHERE "is_active" = true
    `);

    // trips — history per vehicle: WHERE vehicleId ORDER BY startedAt DESC
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_trips_vehicle_started"
      ON "trips" ("vehicle_id", "started_at" DESC)
    `);

    // trips — open trip lookup (critical path on every GPS event)
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_trips_vehicle_incomplete"
      ON "trips" ("vehicle_id", "is_complete")
      WHERE "is_complete" = false
    `);

    // alert_rules — loaded on every GPS position event (hot path)
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_alert_rules_org_active"
      ON "alert_rules" ("organization_id", "is_active")
      WHERE "is_active" = true
    `);

    // vehicles — fleet list per org
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "IDX_vehicles_org_active"
      ON "vehicles" ("organization_id", "is_active")
      WHERE "is_active" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "IDX_positions_vehicle_timestamp"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "IDX_alerts_vehicle_triggered"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "IDX_alerts_vehicle_acknowledged"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "IDX_geofences_org_active"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "IDX_trips_vehicle_started"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "IDX_trips_vehicle_incomplete"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "IDX_alert_rules_org_active"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "IDX_vehicles_org_active"`);
  }
}
