import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrgBranding1719100000000 implements MigrationInterface {
  async up(qr: QueryRunner): Promise<void> {
    await qr.query(
      `ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "logo_url" varchar`,
    );
    await qr.query(
      `ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "primary_color" varchar DEFAULT '#2563eb'`,
    );
  }

  async down(qr: QueryRunner): Promise<void> {
    await qr.query(
      `ALTER TABLE "organizations" DROP COLUMN IF EXISTS "logo_url"`,
    );
    await qr.query(
      `ALTER TABLE "organizations" DROP COLUMN IF EXISTS "primary_color"`,
    );
  }
}
