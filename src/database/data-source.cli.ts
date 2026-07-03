import { DataSource } from "typeorm";
import { DB_BASE_OPTIONS } from "./db.config";

export default new DataSource({
    ...DB_BASE_OPTIONS,
    migrations: ["src/database/migrations/*.ts"],
});
