/**
 * Remove acentos e caracteres não-alfabéticos.
 */
function normalize(str: string): string {
    return str
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-zA-Z]/g, "");
}

/**
 * Gera senha: NomeSobrenome + 3 dígitos aleatórios.
 * Ex: "João Silva" → "JoaoSilva742"
 */
export function generatePassword(name: string, surname: string): string {
    const digits = Math.floor(100 + Math.random() * 900).toString();
    return normalize(name) + normalize(surname) + digits;
}

/**
 * Gera login: nome.sobrenome (minúsculas, sem acento).
 * Ex: "João Silva" → "joao.silva"
 */
export function generateLogin(name: string, surname: string): string {
    return (normalize(name) + "." + normalize(surname)).toLowerCase();
}
