import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./filters/http-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import express, { json, urlencoded } from "express";
import type { Express } from "express";

const expressServer: Express = express();
let cachedApp: Express | null = null;

export async function createApp(): Promise<Express> {
    if (cachedApp) return cachedApp;

    // bodyParser: false -- desativa o body-parser automatico do Nest (limite padrao de 100kb)
    // pra registrar o nosso proprio, com limite maior (importacoes em massa via planilha).
    const app = await NestFactory.create(
        AppModule,
        new ExpressAdapter(expressServer),
        { logger: false, bodyParser: false },
    );
    app.use(json({ limit: "15mb" }));
    app.use(urlencoded({ extended: true, limit: "15mb" }));

    app.enableCors();
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();

    cachedApp = expressServer;
    return cachedApp;
}
