import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsNumber, IsArray, IsNotEmpty, IsIn, IsBoolean, IsInt, ValidateNested, ArrayMaxSize, ArrayMinSize } from "class-validator";
import { Type } from "class-transformer";

export class UpdateHospitalTomoDto {
    @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() contract?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() structure90Days?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() formSent?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() formReceived?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() contactNotes?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() contactResponsible?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() priorityGroup?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() deliveryOrder?: number | null;
    @ApiPropertyOptional() @IsOptional() @IsString() construction?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() installed?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() cnes?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsBoolean() ebserhPriority?: boolean | null;
    @ApiPropertyOptional() @IsOptional() @IsString() deliveryDate?: string | null;
    @ApiPropertyOptional({ enum: ["E", "M", "D"] }) @IsOptional() @IsString() gestao?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() naturezaJuridica?: string | null;
}

export class UpdateHospitalRnmDto {
    @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() contract?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() structure90Days?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() formSent?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() formReceived?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() contactNotes?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() contactResponsible?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() priorityGroup?: string;
    @ApiPropertyOptional() @IsOptional() @IsNumber() deliveryOrder?: number | null;
    @ApiPropertyOptional() @IsOptional() @IsString() construction?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() installed?: string;
    @ApiPropertyOptional() @IsOptional() @IsBoolean() ebserhPriority?: boolean | null;
    @ApiPropertyOptional() @IsOptional() @IsString() deliveryDate?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() cnes?: string | null;
    @ApiPropertyOptional({ enum: ["E", "M", "D"] }) @IsOptional() @IsString() gestao?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() naturezaJuridica?: string | null;
}

export class CreateHospitalDto {
    @ApiProperty({ description: "CNES do estabelecimento (7 dígitos)" })
    @IsString()
    @IsNotEmpty()
    cnes!: string;

    @ApiProperty({ description: "Módulo de destino: 'tomo' ou 'rnm'", enum: ["tomo", "rnm"] })
    @IsIn(["tomo", "rnm"])
    module!: "tomo" | "rnm";

    @ApiPropertyOptional({ description: "Dados TOMO iniciais (opcionais, só para module='tomo')" })
    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateHospitalTomoDto)
    tomo?: UpdateHospitalTomoDto;
}

export class UpdateHospitalDto {
    @ApiPropertyOptional() @IsOptional() @IsString() cnes?: string | null;
    @ApiPropertyOptional({ enum: ["E", "M", "D"] }) @IsOptional() @IsString() gestao?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() naturezaJuridica?: string | null;
}

export class UpdateHospitalComboDto {
    @ApiPropertyOptional({ enum: ["COMBO CIRURGIA", "COMBO OFTALMO"] }) @IsOptional() @IsString() comboType?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() contract?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() deliveryParcel?: string | null;
    // Datas
    @ApiPropertyOptional() @IsOptional() @IsString() expeditionDate?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() deliveryForecast?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() deliveryDate?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() installationDate?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() trainingDate?: string | null;
    // Situação / Equipamentos
    @ApiPropertyOptional() @IsOptional() @IsString() deliveryStatus?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsInt() equipmentCount?: number | null;
    @ApiPropertyOptional() @IsOptional() @IsString() notes?: string | null;
    // Contato
    @ApiPropertyOptional() @IsOptional() @IsString() address?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() managerData?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() managerPhone?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() focalPointData?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() focalPointPhone?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() focalPointEmail?: string | null;
    // Hospital base
    @ApiPropertyOptional() @IsOptional() @IsString() cnes?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() cnpj?: string | null;
}

export class CreateHospitalComboDto {
    @ApiProperty({ description: "CNES do estabelecimento (7 dígitos)" })
    @IsString() @IsNotEmpty() cnes!: string;

    @ApiProperty({ enum: ["COMBO CIRURGIA", "COMBO OFTALMO"] })
    @IsIn(["COMBO CIRURGIA", "COMBO OFTALMO"]) comboType!: string;

    @ApiPropertyOptional() @IsOptional() @IsString() contract?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() deliveryParcel?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() expeditionDate?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() deliveryForecast?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() deliveryDate?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() installationDate?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() trainingDate?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() deliveryStatus?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsInt() equipmentCount?: number | null;
    @ApiPropertyOptional() @IsOptional() @IsString() notes?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() address?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() managerData?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() managerPhone?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() focalPointData?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() focalPointPhone?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() focalPointEmail?: string | null;
}

export class CreateComboEquipamentoDto {
    @ApiProperty({ description: "ID do combo (hospital_combo.id)" })
    @IsInt() comboId!: number;

    @ApiProperty() @IsString() @IsNotEmpty() equipmentName!: string;

    @ApiPropertyOptional() @IsOptional() @IsString() comboCode?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() serialNumber?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() company?: string | null;

    @ApiPropertyOptional() @IsOptional() @IsBoolean() nfSent?: boolean | null;
    @ApiPropertyOptional() @IsOptional() @IsString() nfNumber?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() nfSentDate?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsNumber() nfValue?: number | null;

    @ApiPropertyOptional() @IsOptional() @IsBoolean() provisionalReceiptSent?: boolean | null;
    @ApiPropertyOptional() @IsOptional() @IsBoolean() finalReceiptSent?: boolean | null;

    @ApiPropertyOptional() @IsOptional() @IsNumber() payment1Value?: number | null;
    @ApiPropertyOptional() @IsOptional() @IsString() payment1Nup?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() payment1SentDate?: string | null;

    @ApiPropertyOptional() @IsOptional() @IsNumber() payment2Value?: number | null;
    @ApiPropertyOptional() @IsOptional() @IsString() payment2Nup?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() payment2SentDate?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() payment2Deadline?: string | null;

    @ApiPropertyOptional() @IsOptional() @IsNumber() totalPaid?: number | null;
    @ApiPropertyOptional() @IsOptional() @IsString() paymentStatus?: string | null;
}

export class UpdateComboEquipamentoDto {
    @ApiPropertyOptional() @IsOptional() @IsString() equipmentName?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() comboCode?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() serialNumber?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() company?: string | null;

    @ApiPropertyOptional() @IsOptional() @IsBoolean() nfSent?: boolean | null;
    @ApiPropertyOptional() @IsOptional() @IsString() nfNumber?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() nfSentDate?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsNumber() nfValue?: number | null;

    @ApiPropertyOptional() @IsOptional() @IsBoolean() provisionalReceiptSent?: boolean | null;
    @ApiPropertyOptional() @IsOptional() @IsBoolean() finalReceiptSent?: boolean | null;

    @ApiPropertyOptional() @IsOptional() @IsNumber() payment1Value?: number | null;
    @ApiPropertyOptional() @IsOptional() @IsString() payment1Nup?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() payment1SentDate?: string | null;

    @ApiPropertyOptional() @IsOptional() @IsNumber() payment2Value?: number | null;
    @ApiPropertyOptional() @IsOptional() @IsString() payment2Nup?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() payment2SentDate?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() payment2Deadline?: string | null;

    @ApiPropertyOptional() @IsOptional() @IsNumber() totalPaid?: number | null;
    @ApiPropertyOptional() @IsOptional() @IsString() paymentStatus?: string | null;
}

export class BulkCreateHospitalDto {
    @ApiProperty({ description: "Array de CNES para importação em massa (máx 50)", type: [String], maxItems: 50 })
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(50)
    @IsString({ each: true })
    cnesList!: string[];
}
