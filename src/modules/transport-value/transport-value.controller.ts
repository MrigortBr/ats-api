import { SkipThrottle } from "@nestjs/throttler";
import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";
import { TransportValueService } from "./transport-value.service";
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("transporte")
@SkipThrottle()
@Controller("transport-value")
export class TransportValueController {
    constructor(private readonly service: TransportValueService) {}

    @Get()
    findAll() {
        return this.service.findAll();
    }
}
