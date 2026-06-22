import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateRtxTrsDto {
    @ApiPropertyOptional() van?: number;
    @ApiPropertyOptional() ambulance?: number;
    @ApiPropertyOptional() minibus?: number;
}

export class UpdateGeneralQuotaDto {
    @ApiPropertyOptional() van?: number;
    @ApiPropertyOptional() ambulance?: number;
    @ApiPropertyOptional() microbus?: number;
}

export class UpdateEntregaDto {
    @ApiPropertyOptional() rtxTrs?: UpdateRtxTrsDto;
    @ApiPropertyOptional() generalQuota?: UpdateGeneralQuotaDto;
    @ApiPropertyOptional() rtxObservation?: string | null;
    @ApiPropertyOptional() trsObservation?: string | null;
    @ApiPropertyOptional() cib?: string | null;
    @ApiPropertyOptional() agreement?: string | null;
}
