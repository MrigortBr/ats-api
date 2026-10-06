import { randomInt } from "crypto";

/**
 * Remove acentos e caracteres não-alfabéticos.
 */
function normalize(str: string): string {
    return str
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-zA-Z]/g, "");
}

// Sem caracteres ambíguos (0/O, 1/l/I) para facilitar a digitação da senha recebida por e-mail.
const MAIUSCULAS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const MINUSCULAS = "abcdefghijkmnpqrstuvwxyz";
const DIGITOS = "23456789";
// Sem "&", "<", ">" e aspas: a senha é inserida no HTML do e-mail de boas-vindas.
const SIMBOLOS = "@#$%*!?-_";
const TODOS = MAIUSCULAS + MINUSCULAS + DIGITOS + SIMBOLOS;

/**
 * Gera uma senha aleatória criptograficamente segura (crypto.randomInt), com pelo
 * menos uma maiúscula, uma minúscula, um dígito e um símbolo.
 *
 * Antes a senha era "NomeSobrenome + 3 dígitos" — previsível para quem sabe o nome
 * do usuário (só 900 combinações).
 */
export function generateSecurePassword(tamanho = 14): string {
    const n = Math.max(tamanho, 12);
    const chars = [
        MAIUSCULAS[randomInt(MAIUSCULAS.length)],
        MINUSCULAS[randomInt(MINUSCULAS.length)],
        DIGITOS[randomInt(DIGITOS.length)],
        SIMBOLOS[randomInt(SIMBOLOS.length)],
    ];
    while (chars.length < n) chars.push(TODOS[randomInt(TODOS.length)]);
    // Embaralha (Fisher-Yates) para as classes obrigatórias não ficarem sempre no início.
    for (let i = chars.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join("");
}

/**
 * Gera a senha inicial de um usuário. Mantém a assinatura antiga (nome, sobrenome)
 * para não mudar quem chama, mas a senha não deriva mais do nome.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function generatePassword(_name?: string, _surname?: string): string {
    return generateSecurePassword();
}

/**
 * Gera login: nome.sobrenome (minúsculas, sem acento).
 * Ex: "João Silva" → "joao.silva"
 */
export function generateLogin(name: string, surname: string): string {
    return (normalize(name) + "." + normalize(surname)).toLowerCase();
}
