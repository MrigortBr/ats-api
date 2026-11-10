import { Body, Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";
import { ComboImportService } from "./combo-import.service";
import { ComboImportDto } from "./dto/combo-import.dto";

@Controller("combo-import")
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("admin")
export class ComboImportController {
    constructor(private readonly service: ComboImportService) {}

    @Post("preview")
    @HttpCode(200)
    preview(@Body() dto: ComboImportDto) {
        return this.service.preview(dto.rows);
    }

    @Post("apply")
    @HttpCode(200)
    apply(@Body() dto: ComboImportDto) {
        return this.service.apply(dto.rows);
    }
}
