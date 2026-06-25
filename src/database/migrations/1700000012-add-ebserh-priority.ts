import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEbserhPriority1700000012000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "hospital_tomo"
            ADD COLUMN IF NOT EXISTS "ebserh_priority" BOOLEAN
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "hospital_tomo"
            DROP COLUMN IF EXISTS "ebserh_priority"
        `);
    }
}
