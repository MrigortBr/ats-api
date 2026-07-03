import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
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

@ApiTags("companies")
@Controller("/companies")
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequiresModule("admin")
@ApiBearerAuth("bearer")
export class CompanyController {
    constructor(private readonly service: CompanyService) {}

    @Get()
    @ApiOperation({ summary: "Listar empresas (admin)" })
    findAll() {
        return this.service.findAll();
    }

    @Get(":id")
    @ApiOperation({ summary: "Buscar empresa por ID (admin)" })
    findOne(@Param("id", ParseIntPipe) id: number) {
        return this.service.findOne(id);
    }

    @Post()
    @ApiOperation({ summary: "Criar empresa (admin)" })
    create(@Body() body: CreateCompanyDto) {
        return this.service.create(body);
    }

    @Put(":id")
    @ApiOperation({ summary: "Atualizar empresa (admin)" })
    update(@Param("id", ParseIntPipe) id: number, @Body() body: CreateCompanyDto) {
        return this.service.update(id, body);
    }

    @Delete(":id")
    @ApiOperation({ summary: "Remover empresa (admin)" })
    remove(@Param("id", ParseIntPipe) id: number) {
        return this.service.remove(id);
    }
}
