import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DB_BASE_OPTIONS, DB_ENTITIES } from "./db.config";

@Module({
    imports: [
        TypeOrmModule.forRoot({
            ...DB_BASE_OPTIONS,
            synchronize: false,
            migrations: ["dist/database/migrations/*.js"],
        }),
    ],
})
export class DatabaseModule {}
