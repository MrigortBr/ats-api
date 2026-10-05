import {
    BadRequestException,
    HttpStatus,
    InternalServerErrorException,
    NotFoundException,
} from "@nestjs/common";
import { HttpExceptionFilter } from "./http-exception.filter";

function makeHost(headersSent = false) {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const response = { status, headersSent };
    const request = { method: "GET", url: "/teste" };
    const host = {
        switchToHttp: () => ({ getResponse: () => response, getRequest: () => request }),
    };
    return { host: host as never, status, json };
}

describe("HttpExceptionFilter", () => {
    let filter: HttpExceptionFilter;
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
        filter = new HttpExceptionFilter();
        errorSpy = jest.spyOn((filter as unknown as { logger: { error: () => void } }).logger, "error").mockImplementation();
    });

    it("mantem status e corpo de uma HttpException", () => {
        const { host, status, json } = makeHost();
        filter.catch(new NotFoundException("nao achei"), host);
        expect(status).toHaveBeenCalledWith(404);
        expect(json.mock.calls[0][0]).toMatchObject({ statusCode: 404, path: "/teste" });
        expect(errorSpy).not.toHaveBeenCalled();
    });

    it("preserva o detalhe de validacao (BadRequest)", () => {
        const { host, json } = makeHost();
        filter.catch(new BadRequestException(["ibge deve ter 7 digitos"]), host);
        expect(JSON.stringify(json.mock.calls[0][0].message)).toContain("ibge deve ter 7 digitos");
    });

    it("erro nao-HTTP vira 500 generico, sem vazar detalhe", () => {
        const { host, status, json } = makeHost();
        filter.catch(new Error('duplicate key value violates constraint "users_email_key"'), host);
        expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
        const body = json.mock.calls[0][0];
        expect(body.message).toBe("Erro interno do servidor");
        expect(JSON.stringify(body)).not.toContain("users_email_key");
        expect(errorSpy).toHaveBeenCalledTimes(1);
    });

    it("erro nao-HTTP devolve errorId e o mesmo id vai para o log", () => {
        const { host, json } = makeHost();
        filter.catch(new Error("boom"), host);
        const { errorId } = json.mock.calls[0][0];
        expect(errorId).toMatch(/^[0-9a-f-]{36}$/);
        expect(errorSpy.mock.calls[0][0]).toContain(`[${errorId}]`);
    });

    it("HttpException 5xx tambem e logada e recebe errorId", () => {
        const { host, json } = makeHost();
        filter.catch(new InternalServerErrorException("falha no servico externo"), host);
        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(json.mock.calls[0][0].errorId).toBeDefined();
    });

    it("erros 4xx nao recebem errorId e nao sao logados", () => {
        const { host, json } = makeHost();
        filter.catch(new NotFoundException("x"), host);
        expect(json.mock.calls[0][0].errorId).toBeUndefined();
        expect(errorSpy).not.toHaveBeenCalled();
    });

    it("nao tenta responder se os headers ja foram enviados", () => {
        const { host, status } = makeHost(true);
        filter.catch(new Error("boom"), host);
        expect(status).not.toHaveBeenCalled();
    });
});
