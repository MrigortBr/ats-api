import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
    @Get()
    health() {
        return { status: "ok", app: "ATS API", version: "1.2.0" };
    }
}
