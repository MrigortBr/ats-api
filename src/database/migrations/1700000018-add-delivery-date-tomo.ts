import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeliveryDateTomo1700000018000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "hospital_tomo" ADD COLUMN IF NOT EXISTS "delivery_date" VARCHAR`
        );
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "hospital_tomo" DROP COLUMN IF EXISTS "delivery_date"`
        );
    }
}
