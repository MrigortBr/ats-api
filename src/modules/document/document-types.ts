/** Tipos de documento aceitos por módulo. */

export const COMBO_DOCUMENT_TYPES = [
    "OFICIO_CONTEMPLACAO",
    "TERMO_ACEITE",
    "NOTA_FISCAL",
    "TERMO_RECEBIMENTO",
] as const;

export const TOMO_RNM_DOCUMENT_TYPES = [
    "OFICIO_CONTEMPLACAO",
    "TERMO_ACEITE",
    "FORMULARIO_PRONTIDAO",
    "PLANTAS_FOTOS",
    "NOTA_FISCAL",
    "TERMO_RECEBIMENTO",
] as const;

export const ALL_DOCUMENT_TYPES = [
    ...new Set([...COMBO_DOCUMENT_TYPES, ...TOMO_RNM_DOCUMENT_TYPES]),
] as const;

export type ComboDocumentType   = typeof COMBO_DOCUMENT_TYPES[number];
export type TomoRnmDocumentType = typeof TOMO_RNM_DOCUMENT_TYPES[number];
export type DocumentType        = typeof ALL_DOCUMENT_TYPES[number];

export const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB por arquivo
