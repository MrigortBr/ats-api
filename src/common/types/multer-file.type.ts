/**
 * Representa o arquivo recebido pelo Multer (MemoryStorage).
 * Centralizado aqui para evitar redeclaração em cada módulo.
 */
export interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
}
