import { SkipThrottle } from "@nestjs/throttler";
import { Body, Controller, Get, Param, ParseIntPipe, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { DeliveredRtxTrsService } from "./delivered-rtx-trs.service";
import { UpdateDeliveredRtxTrsDto } from "./dto/delivered-rtx-trs.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";

@ApiTags("DeliveredRtxTrs")
@ApiBearerAuth("bearer")
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("transporte")
@SkipThrottle()
@Controller("/delivered-rtx-trs")
export class DeliveredRtxTrsController {
    constructor(private readonly service: DeliveredRtxTrsService) {}

    @Get()
    findAll() { return this.service.findAll(); }

    @Put(":ufId")
        updateByUfId(@Param("ufId", ParseIntPipe) ufId: number, @Body() body: UpdateDeliveredRtxTrsDto) {
        return this.service.updateByUfId(ufId, body);
    }
}
