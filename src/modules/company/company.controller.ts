import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from "@nestjs/common";
import { CompanyService } from "./company.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleGuard } from "../auth/guards/module.guard";
import { RequiresModule } from "../auth/decorators/requires-module.decorator";
import { IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
class CreateCompanyDto {
    @ApiProperty() @IsString() name!: string;
    @ApiPropertyOptional() @IsOptional() @IsString() cnpj?: string;
}
@Controller("/companies")
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("admin")
export class CompanyController {
    constructor(private readonly service: CompanyService) {}

    @Get()
    findAll() {
        return this.service.findAll();
    }

    @Get(":id")
    findOne(@Param("id", ParseIntPipe) id: number) {
        return this.service.findOne(id);
    }

    @Post()
    create(@Body() body: CreateCompanyDto) {
        return this.service.create(body);
    }

    @Put(":id")
    update(@Param("id", ParseIntPipe) id: number, @Body() body: CreateCompanyDto) {
        return this.service.update(id, body);
    }

    @Delete(":id")
    remove(@Param("id", ParseIntPipe) id: number) {
        return this.service.remove(id);
    }
}
