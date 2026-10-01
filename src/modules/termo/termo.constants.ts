import { createHash } from "crypto";

/**
 * Termo de aceite exibido na tela de login.
 *
 * Ao alterar o TEXTO ou os DOCUMENTOS, incremente TERMO_VERSAO e atualize
 * a constante equivalente no frontend (src/constants/termo.ts). Logins
 * enviados com outra versao sao recusados (409) e o usuario precisa
 * recarregar a pagina para aceitar a versao vigente.
 */
export const TERMO_VERSAO = "1.0";

/** Texto exato do checkbox de aceite. */
export const TERMO_TEXTO =
    "Li e concordo com o Guia de Privacidade e Segurança do Usuário e com o " +
    "Documento Técnico de Segurança e Auditoria, ciente de que meu IP, localização, " +
    "dados do navegador e as exportações que eu fizer serão registrados para fins de auditoria.";

/** Documentos referenciados pelo termo (nome e versao). */
export const TERMO_DOCUMENTOS = [
    { nome: "Guia de Privacidade e Segurança do Usuário", versao: "1.0" },
    { nome: "Documento Técnico de Segurança e Auditoria", versao: "1.0" },
] as const;

/** Itens aceitos no checklist (hoje um unico check geral). */
export const TERMO_ITENS = ["aceite_documentos_seguranca"] as const;

/** SHA-256 da versao + texto + documentos — identifica exatamente o que foi aceito. */
export const TERMO_HASH = createHash("sha256")
    .update(JSON.stringify({ versao: TERMO_VERSAO, texto: TERMO_TEXTO, documentos: TERMO_DOCUMENTOS }))
    .digest("hex");

/** Fuso usado para exibir o horario da assinatura (o banco guarda em timestamptz). */
export const TERMO_FUSO_EXIBICAO = "America/Sao_Paulo";
