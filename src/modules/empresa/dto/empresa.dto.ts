import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Matches } from "class-validator";

const CNPJ_REGEX = /^\d{14}$/;

export class CreateEmpresaProblemDto {
    @ApiProperty({ description: "ID do combo_consult" })
    @IsInt()
    consultId!: number;

    @ApiPropertyOptional() @IsOptional() @IsString() queixa?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() motivoUnidade?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() propostaSolucaoMs?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
}

export class UpdateEmpresaProblemDto {
    @ApiPropertyOptional() @IsOptional() @IsString() queixa?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() motivoUnidade?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() propostaSolucaoMs?: string;
    @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
}

export class UpdateEmpresaEquipamentoDto {
    @ApiPropertyOptional() @IsOptional() @IsString()   serialNumber?:           string | null;
    @ApiPropertyOptional() @IsOptional() @IsBoolean()  nfSent?:                 boolean | null;
    @ApiPropertyOptional() @IsOptional() @IsString()   nfNumber?:               string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()   nfSentDate?:             string | null;
    @ApiPropertyOptional() @IsOptional() @IsNumber()   nfValue?:                number | null;
    @ApiPropertyOptional() @IsOptional() @IsBoolean()  provisionalReceiptSent?: boolean | null;
    @ApiPropertyOptional() @IsOptional() @IsBoolean()  finalReceiptSent?:       boolean | null;
}

export class UpdateEmpresaContatoDto {
    @ApiPropertyOptional() @IsOptional() @IsString() installationDate?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() trainingDate?:     string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() deliveryStatus?:   string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() notes?:            string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() address?:              string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() managerData?:          string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() managerPhone?:         string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() focalPointData?:       string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() focalPointPhone?:      string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() focalPointEmail?:      string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() establishmentEmail?:   string | null;
}

// Admin DTOs — sem restricao de empresa, permite campos adicionais
export class UpdateAdminEquipamentoDto extends UpdateEmpresaEquipamentoDto {
    @ApiPropertyOptional() @IsOptional() @IsNumber()  payment1Value?:    number | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  payment1Nup?:      string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  payment1SentDate?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsNumber()  payment2Value?:    number | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  payment2Nup?:      string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  payment2SentDate?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  payment2Deadline?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsNumber()  totalPaid?:        number | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  paymentStatus?:    string | null;
}

export class UpdateAdminContatoDto extends UpdateEmpresaContatoDto {
    @ApiPropertyOptional() @IsOptional() @IsString()  contract?:         string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  deliveryParcel?:   string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  expeditionDate?:   string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  deliveryForecast?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  deliveryDate?:     string | null;
    @ApiPropertyOptional() @IsOptional() @IsInt()     equipmentCount?:   number | null;
}

// "Adicionar equipamento" = criar novo row em combo_consult copiando
// dados do estabelecimento de um row existente (consultId como template)
export class CreateAdminEquipamentoDto {
    @ApiProperty({ description: "ID de um combo_consult do mesmo estabelecimento (template)" })
    @IsInt() consultId!: number;

    @ApiProperty()  @IsString() @IsNotEmpty()         equipmentName!:    string;

    @ApiPropertyOptional() @IsOptional() @IsString()  comboCode?:               string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  serialNumber?:            string | null;

    @ApiPropertyOptional() @IsOptional() @IsBoolean() nfSent?:                  boolean | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  nfNumber?:                string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  nfSentDate?:              string | null;
    @ApiPropertyOptional() @IsOptional() @IsNumber()  nfValue?:                 number | null;

    @ApiPropertyOptional() @IsOptional() @IsBoolean() provisionalReceiptSent?:  boolean | null;
    @ApiPropertyOptional() @IsOptional() @IsBoolean() finalReceiptSent?:        boolean | null;

    @ApiPropertyOptional() @IsOptional() @IsNumber()  payment1Value?:    number | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  payment1Nup?:      string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  payment1SentDate?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsNumber()  payment2Value?:    number | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  payment2Nup?:      string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  payment2SentDate?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  payment2Deadline?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsNumber()  totalPaid?:        number | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  paymentStatus?:    string | null;
}

// Cria um único row em combo_consult (modelo flat)
export class CreateComboCompletoDto {
    @ApiPropertyOptional() @IsOptional() @IsInt()     companyId?:               number | null;
    // Estabelecimento
    @ApiPropertyOptional() @IsOptional() @IsString()  cnes?:                    string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  establishmentName?:       string | null;
    @ApiPropertyOptional() @IsOptional() @IsString() @Matches(CNPJ_REGEX, { message: "cnpj deve conter exatamente 14 dígitos numéricos" }) cnpj?: string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  estabKey?:                string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  uf?:                      string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  municipality?:            string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  region?:                  string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  ibge?:                    string | null;
    // Combo
    @ApiPropertyOptional() @IsOptional() @IsString()  comboType?:               string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  contract?:                string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  deliveryParcel?:          string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  expeditionDate?:          string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  deliveryForecast?:        string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  deliveryDate?:            string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  installationDate?:        string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  trainingDate?:            string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  deliveryStatus?:          string | null;
    @ApiPropertyOptional() @IsOptional() @IsInt()     equipmentCount?:          number | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  notes?:                   string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  address?:                 string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  managerData?:             string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  managerPhone?:            string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  focalPointData?:          string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  focalPointPhone?:         string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  focalPointEmail?:         string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  establishmentEmail?:      string | null;
    // Equipamento
    @ApiPropertyOptional() @IsOptional() @IsString()  equipmentName?:           string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  equipKey?:                string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  comboCode?:               string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  serialNumber?:            string | null;
    @ApiPropertyOptional() @IsOptional() @IsBoolean() nfSent?:                  boolean | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  nfNumber?:                string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  nfSentDate?:              string | null;
    @ApiPropertyOptional() @IsOptional() @IsNumber()  nfValue?:                 number | null;
    @ApiPropertyOptional() @IsOptional() @IsBoolean() provisionalReceiptSent?:  boolean | null;
    @ApiPropertyOptional() @IsOptional() @IsBoolean() finalReceiptSent?:        boolean | null;
    @ApiPropertyOptional() @IsOptional() @IsNumber()  payment1Value?:           number | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  payment1Nup?:             string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  payment1SentDate?:        string | null;
    @ApiPropertyOptional() @IsOptional() @IsNumber()  payment2Value?:           number | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  payment2Nup?:             string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  payment2SentDate?:        string | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  payment2Deadline?:        string | null;
    @ApiPropertyOptional() @IsOptional() @IsNumber()  totalPaid?:               number | null;
    @ApiPropertyOptional() @IsOptional() @IsString()  paymentStatus?:           string | null;
}
