import { SkipThrottle } from "@nestjs/throttler";
import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { TransportValueService } from "./transport-value.service";

@ApiTags("transport-value")
@UseGuards(JwtAuthGuard)
@SkipThrottle()
@Controller("transport-value")
export class TransportValueController {
    constructor(private readonly service: TransportValueService) {}

    @Get()
    @ApiOperation({ summary: "Lista valores unitarios dos veiculos" })
    findAll() {
        return this.service.findAll();
    }
}
